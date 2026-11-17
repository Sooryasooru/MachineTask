# Submission notes

## Status

| Deliverable | Status |
| --- | --- |
| Working app (local) | ✅ Built and verified against Postgres |
| Source code | ✅ This repository |
| README | ✅ `README.md` |
| Architecture note | ✅ `ARCHITECTURE.md` |
| AI workflow note + raw log | ✅ `AI_WORKFLOW.md`, `AI_LOG.md` |
| Live URL | ⛔ Not deployed — requires your Vercel + Neon accounts (steps in README) |
| Video | ⛔ Not recorded — outline below; put the Loom URL in `video-link.txt` |

**Local URL:** http://localhost:3000 (currently running via `npm run dev`).

## Credentials

Demo authentication only — pick a user on the login screen, no password.

| User | Email | Suggested role |
| --- | --- | --- |
| Alice | `alice@ajaia.test` | Owner of the welcome document |
| Bob | `bob@ajaia.test` | Editor on the welcome document |
| Carol | `carol@ajaia.test` | Unshared — use to verify 404 behaviour |

## Three-minute reviewer walkthrough

1. Open http://localhost:3000 → redirected to `/login`. Choose **Alice**.
2. Open **Welcome to Ajaia Docs**. Edit a line (bold/italic/underline/H1/lists), rename the title, wait for “Saved”, then refresh — changes persist.
3. Click **Share**, invite `carol@ajaia.test` as **Viewer**. Open the row's role dropdown to switch her to **Editor**, then back to Viewer, then remove her.
4. Sign out, choose **Carol** (after sharing with her as Viewer): the document appears under **Shared with me** with `Owner: Alice` and a `Viewer` badge. Open it — read-only editor and “View only” banner, no toolbar or Share button.
5. Sign out, choose **Alice**, click **Upload file**, import a `.md` or `.txt` file — a new editable document opens with the filename as its title.
6. Create a new document and delete it from the dashboard (trash icon on hover) to see the owner-only delete path.

Direct API checks (optional):

```bash
# as Carol, after being granted Viewer
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/documents/<id> \
  -H 'content-type: application/json' -d '{"title":"nope"}'   # 403
```

## Files included

Configuration and project:

- `package.json`, `package-lock.json` — dependencies, scripts, Prisma seed hook
- `next.config.ts` — Node externals for mammoth, Tailwind Turbopack loader; Cache Components deliberately off
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`
- `.gitignore`, `.env.example` (`.env` is local-only and not committed)
- `AGENTS.md` — version-matched Next.js agent instructions from the scaffold

Database:

- `prisma/schema.prisma` — User / Document / Share / Role
- `prisma/migrations/…_init/migration.sql` — initial schema
- `prisma/seed.ts` — idempotent demo users, welcome document and share

Server libraries:

- `src/lib/db.ts` — Prisma singleton
- `src/lib/auth.ts` — demo cookie session, `getCurrentUser`, `requireUser`
- `src/lib/access.ts` — pure `resolveAccess`, `canEdit`, `canManageSharing`
- `src/lib/documents.ts` — `getAccess`, `listShares`
- `src/lib/sanitize.ts` — allowlist sanitizer
- `src/lib/import.ts` — txt/markdown/docx conversion
- `src/lib/limits.ts` — upload limits shared with the client
- `src/lib/validation.ts` — Zod schemas
- `src/lib/api.ts` — JSON/error helpers
- `src/lib/format.ts` — date, initials, role labels
- `src/lib/types.ts` — shared serializable types

API routes:

- `src/app/api/login/route.ts`, `src/app/api/logout/route.ts`
- `src/app/api/documents/route.ts`
- `src/app/api/documents/[id]/route.ts`
- `src/app/api/documents/[id]/shares/route.ts`
- `src/app/api/import/route.ts`

Pages and UI:

- `src/app/layout.tsx`, `src/app/globals.css`
- `src/app/page.tsx` — dashboard
- `src/app/login/page.tsx`
- `src/app/docs/[id]/page.tsx`
- `src/app/not-found.tsx`
- `src/components/AppHeader.tsx`, `LogoutButton.tsx`, `LoginForm.tsx`
- `src/components/DashboardActions.tsx`, `DeleteDocumentButton.tsx`
- `src/components/DocumentEditor.tsx` — TipTap, toolbar, autosave
- `src/components/ShareDialog.tsx`
- `src/components/icons.tsx`

Tests and docs:

- `src/lib/access.test.ts` (9 tests)
- `src/lib/import.test.ts` (16 tests)
- `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `AI_LOG.md`, `SUBMISSION.md`, `video-link.txt`

## What works (verified)

- Demo login/logout, session cookie, redirect preservation via `?next=`.
- Create, read, update, delete documents; owner-only delete.
- Title and content validation (Zod): empty title, >200 chars, empty patch, malformed JSON.
- Autosave debounce with Saving/Saved/Error + Retry; pending edits drained after an in-flight save.
- Viewer read-only page; no toolbar, no Share button.
- Permission matrix: owner, editor, viewer, stranger (404), plus 403s on edit/share/delete for insufficient roles.
- Sharing: invite, role upsert, revoke, self-share 400, unknown email 404, invalid role 400.
- Import: `.txt` escaped and paragraphized, `.md` converted, `.docx` via mammoth (converter code path unit-tested; no sample `.docx` fixture was uploaded), unsupported type 400, >2 MB 413.
- XSS: `<script>` and `onclick` stripped on save; scripts dropped from markdown/text imports; `javascript:` links dropped.
- 25 Vitest unit tests, clean TypeScript, clean ESLint, successful `next build`, 53/53 HTTP smoke checks.

## What is incomplete or unverified

- **No deployment.** No Vercel/Neon credentials were available; creating accounts wasn't appropriate. The app is ready for the documented deploy steps.
- **No video.** The 3–5 minute outline is below; record it and update `video-link.txt`.
- **No browser click-through.** I did not manually click the UI, verify hydration visually, or test drag-selection formatting. Server-rendered HTML for the viewer and dashboard was checked, and the APIs were exercised over HTTP, but the interactive editor was not driven in a browser.
- **No E2E/Playwright suite.** The HTTP smoke test was a one-off script (not committed) so it isn't repeatable in CI.
- **Autosave is last-write-wins.** Simultaneous editors can overwrite each other; there is no presence, comments or history.
- **Mock auth is insecure.** Unsigned httpOnly cookie; documented in the UI and README.
- **`.docx` tables and images are dropped** because the editor schema doesn't support them.
- No pagination or search; delete is permanent; 1 MB document content limit.

## With 2–4 more hours

1. **Optimistic concurrency** (`revision` column + `If-Match`) and a lightweight version list, so autosave can't silently clobber another editor.
2. **Real authentication** (OAuth via a provider) without changing the `User`/`Share` model, and a CSRF token on mutations.
3. **Playwright tests** for the two-user share flow plus a seeded test database in CI.
4. **Comments** anchored to quoted text (`documentId`, `userId`, `quote`, `position`), which is the next most valuable Docs feature after permissions.

## Video outline (3–5 min)

- **0:00–0:30** — What it is; stack; deliberate cuts (collaboration, comments, history, real auth, attachments).
- **0:30–2:30** — Demo: sign in as Alice, create/format/rename, refresh to show persistence, import a file, share with Bob as Editor and Carol as Viewer, switch users to show editor vs viewer vs no-access.
- **2:30–3:30** — Decisions: HTML + sanitizer on both write paths, single server-side access gate, 404-not-403 for strangers, TipTap v3 StarterKit, mocked auth.
- **3:30–4:30** — AI workflow: the Cache Components removal, the Vitest/`@types/node` conflict, the autosave lint rewrite, the corrected test assertion, and the false-positive smoke test.
- **4:30–5:00** — Limits (last-write-wins, mock auth) and next steps (revisions, real auth, comments, Playwright).

## Resetting the demo database

```bash
npx prisma migrate reset --force   # drops, migrates and re-seeds
```
