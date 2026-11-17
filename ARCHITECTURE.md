# Architecture

## What this is optimizing for

The assignment rewards a small app that is **correct end to end** over a large app with gaps. I prioritized:

1. **Server-side authorization.** Permissions are enforced in one place and every document read/write goes through it. Client-side hiding is only cosmetic.
2. **Data safety.** Documents are HTML, so both the save path and the import path sanitize with the same allowlist before anything is stored.
3. **A complete, calm editing loop.** Create → edit → autosave → refresh → persist, including visible save state and a retry path.
4. **Boring, debuggable choices.** Postgres + Prisma, cookie session, route handlers, no background workers.

## Scope

**In:** document CRUD, rich-text formatting (bold, italic, underline, H1/H2, bullet/numbered lists), autosave, `.txt`/`.md`/`.docx` import, sharing with Viewer/Editor roles, revocation, dashboard split into owned/shared, server-enforced access.

**Out (on purpose):** real-time collaboration, comments, version history, real authentication, attachment storage, pagination/search, document folders.

Each cut removes a subsystem that would have doubled the surface area without improving the core demo: a CRDT/WebSocket server, a comments data model, an auth provider, and object storage.

## Data model

```
User 1 ──< Document (owner)      Document 1 ──< Share >── 1 User
User 1 ──< Share
```

Prisma schema (`prisma/schema.prisma`):

- **User**: `id` (cuid), unique `email`, `name`.
- **Document**: `id`, `title` (default "Untitled document"), `content` (sanitized HTML), `ownerId`, `createdAt`, `updatedAt`. Indexed on `ownerId`.
- **Share**: `id`, `documentId`, `userId`, `role` (`EDITOR` | `VIEWER`), unique on `(documentId, userId)`, indexes on `userId`. Deleting a document or user cascades.

`content` is HTML because TipTap produces and consumes HTML and the assignment is explicitly a Docs-style editor. A JSON document model would be better for collaboration and versioning, but worse for this scope: import/export, sanitization and rendering all become bespoke.

## Permission model

`src/lib/access.ts` holds the pure rules:

```ts
resolveAccess(ownerId, shares, userId): "OWNER" | "EDITOR" | "VIEWER" | null
canEdit(access): boolean            // OWNER or EDITOR
canManageSharing(access): boolean   // OWNER only
```

`src/lib/documents.ts#getAccess(userId, docId)` loads `ownerId + shares` and applies `resolveAccess`. It is the single database-backed gate.

Rules:

| Caller | Read | Edit | Share / delete |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Editor | yes | yes | no (403) |
| Viewer | yes | no (403) | no (403) |
| Stranger | **404** | **404** | **404** |

**404 for strangers, 403 for known-but-insufficient access.** A stranger must not be able to distinguish “this id doesn't exist” from “this id exists but isn't yours”. A viewer already knows the document exists, so 403 is the honest answer there.

Every route re-reads the session and calls `getAccess`; nothing trusts a role sent by the client. Page-level access uses the same helper, and the editor's read-only state is derived from the server-resolved access level.

## Request flows

### Save / autosave

```
TipTap onUpdate
  → pendingRef.content = editor.getHTML()
  → status "unsaved", 800 ms timer
  → PATCH /api/documents/:id
      → session → getAccess → canEdit → Zod → sanitize → Prisma update
  → "Saved" or "Couldn't save"
```

The client keeps a small pending patch (`title` and/or `content`) and drains it in a loop: edits made while a request is in flight are sent immediately after it finishes. Failures restore the pending patch so Retry resends it without discarding newer text. Title commits on blur/Enter rather than per keystroke.

This is **last-write-wins**. Two editors on the same document can overwrite each other. Real-time collaboration is out of scope; the mitigation would be a revision column with optimistic concurrency, which is noted as future work.

### Import

```
multipart POST /api/import
  → session
  → FormData parse
  → size ≤ 2 MB, extension ∈ {.txt, .md, .docx}
  → Buffer → txt: escape+paragraphs | md: marked | docx: mammoth
  → sanitize-html allowlist
  → create Document owned by the caller
  → { id } → client navigates to /docs/:id
```

The route declares `runtime = "nodejs"` because mammoth needs Node APIs. File extension and size are checked server-side, not only in the UI. Parse failures return 422 instead of 500.

### HTML sanitization

`sanitizeDocumentHtml` allows: `p, h1, h2, h3, strong, b, em, i, u, s, ul, ol, li, br, a, blockquote, code, pre, hr`. Links may carry `href`, `target`, `rel`; schemes are limited to `http`, `https`, `mailto`; every anchor is rewritten with `rel="noopener noreferrer nofollow"` and `target="_blank"`. Script/style contents are dropped entirely. Applied on **both** `PATCH /api/documents/:id` and `POST /api/import`.

### Auth (mock)

`POST /api/login` validates a seeded `userId`, then sets `ajaia_user` as an httpOnly, `sameSite=lax`, 7-day cookie (`secure` in production). `getCurrentUser()` reads the cookie and loads the user; `requireUser()` redirects pages to `/login?next=…`. The login client only accepts `next` values that start with `/` and not `//` to avoid an open redirect.

This is explicitly **not secure**: the cookie is unsigned. Replacing it is the first production task.

## Decisions and tradeoffs

**Next.js 16 with Cache Components disabled.** The 16.4 scaffold enables `cacheComponents`. Its docs state that reading `cookies()` outside a `<Suspense>` boundary is a build error, and this app reads the session on every page. Making every route partial-prerender for no benefit would add Suspense plumbing and risk stale-per-user caching, so I removed the flags and kept routes dynamic. The build output confirms every route is `ƒ` (dynamic).

**TipTap 3, StarterKit only.** v3's StarterKit already includes Underline and Link, so installing `@tiptap/extension-underline` separately (as v2 required) would register duplicates. `immediatelyRender: false` avoids an SSR hydration mismatch.

**HTML in a `String` column.** Simple, import-friendly, and directly renderable. The cost is that every write must sanitize, and rich structures (tables, images) are unsupported.

**Optimistic, debounced saves.** The UI feels instant and survives refresh. The cost is a small window where a closed tab can lose the last <800 ms of typing, and no conflict detection.

**Route handlers over Server Actions for mutations.** The assignment specifies an API surface, and it keeps permission checks explicit and curl-testable. Pages are server components that call Prisma directly after an access check.

**Mock auth over NextAuth.** No provider setup or secrets, and reviewers can switch users in two clicks — which makes the sharing demo immediate. The README and the login screen both label it as insecure.

**Pooled Postgres connection.** Neon's pooled string is used in production because serverless functions open many short-lived connections. Prisma `generate` runs in the build command.

## Known limits

- Last-write-wins; no presence, cursors, comments or history.
- Mock auth (unsigned cookie), no rate limiting, no CSRF token on mutations (mitigated only by `sameSite=lax`).
- 1 MB content limit; no pagination on the dashboard; delete is permanent.
- `.docx` tables/images are intentionally dropped.
- Autosave can lose the final <800 ms if the tab is closed; a `beforeunload` warning covers deliberate navigation.
- No automated browser/E2E suite; permission and import behaviour is covered by unit tests plus a one-off 53-check HTTP smoke test.

## What I'd build next (2–4 hours)

1. Revision column + `If-Match`/optimistic concurrency, then a simple activity/version list.
2. Real auth (OAuth) with the existing `User`/`Share` model unchanged.
3. Comment anchors stored as `{ documentId, userId, quote, position }`.
4. Playwright tests for the two-user share flow, and a seeded integration test database.
