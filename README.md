# Ajaia Docs

A small Google Docs–style app: a dashboard, a rich-text editor with autosave, file import, email-based sharing with Viewer/Editor roles, and Postgres persistence with server-enforced permissions.

**Live URL:** not deployed yet. The app is built and verified locally; see [Deploy](#deploy-vercel--neon) for the exact Vercel + Neon steps. Creating those accounts requires your credentials, so I stopped short of publishing.

- [Architecture note](./ARCHITECTURE.md)
- [AI workflow note](./AI_WORKFLOW.md)
- [Raw AI log](./AI_LOG.md)
- [Submission notes](./SUBMISSION.md)

## Stack

| Purpose | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Editor | TipTap 3 (`@tiptap/react`, `@tiptap/starter-kit`) |
| Database | Postgres 16 (Neon in production, local Postgres in development) via Prisma 6 |
| Validation | Zod 4 |
| Import | `mammoth` (.docx), `marked` (.md), plain text (.txt) |
| Sanitization | `sanitize-html` (allowlist, applied on save and import) |
| Tests | Vitest |

## What works

- Create, rename, edit, reopen and delete documents.
- Formatting: bold, italic, underline, H1, H2, bullet lists, numbered lists, with active-state highlighting and keyboard shortcuts.
- Autosave ~800 ms after typing, with `Unsaved changes`, `Saving…`, `Saved` and `Couldn't save / Retry` states. Title saves on blur or Enter.
- Upload `.txt`, `.md` or `.docx` into a new editable document (2 MB max).
- Share by email as **Viewer** or **Editor**, change a collaborator's role, and revoke access.
- Dashboard with **My documents** and **Shared with me**, owner badge and role badge on shared items, plus empty states.
- Viewers get a read-only editor, a “View only” banner, and no toolbar.
- Every document route checks the session and the caller's access server-side. Strangers get **404**, not 403, so document ids can't be probed.
- Stored HTML is sanitized on both save and import; scripts, event handlers and `javascript:` links are removed.

## Seeded demo users

| Name | Email | Notes |
| --- | --- | --- |
| Alice | `alice@ajaia.test` | Owns the seeded “Welcome to Ajaia Docs” document |
| Bob | `bob@ajaia.test` | Has **Editor** access to Alice's welcome document |
| Carol | `carol@ajaia.test` | No initial shares — good for testing the stranger case |

There are no passwords. Sign-in is a demo-only mock: see [Authentication](#authentication-is-mocked).

## Local setup

Prerequisites: Node.js 20.9+ (built on Node 24) and a Postgres 14+ database.

```bash
npm install

# 1. Configure the database
cp .env.example .env
# edit DATABASE_URL

# 2. Create the schema and demo data
npx prisma migrate dev --name init
npm run db:seed

# 3. Run
npm run dev
# http://localhost:3000
```

If you use Neon, paste its connection string (with `?sslmode=require`) into `.env` and run `npm run db:deploy` instead of `migrate dev`.

### Using a local Postgres

```bash
createdb ajia_docs
psql -d postgres -c "CREATE ROLE ajia LOGIN PASSWORD 'ajia_docs_dev' CREATEDB;"
psql -d postgres -c "ALTER DATABASE ajia_docs OWNER TO ajia;"
# DATABASE_URL="postgresql://ajia:ajia_docs_dev@localhost:5432/ajia_docs"
```

`CREATEDB` is only needed by `prisma migrate dev`, which creates a temporary shadow database.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate && next build` |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed Alice, Bob, Carol and the welcome document |
| `npm run db:studio` | Prisma Studio |

## Supported uploads

`.txt`, `.md`, `.docx`, up to **2 MB** (Vercel's request-body limit is ~4.5 MB, so 2 MB leaves headroom).

- `.txt` is HTML-escaped, then blank-line-separated blocks become paragraphs and single newlines become `<br />`.
- `.md` is rendered with `marked` (GFM).
- `.docx` is converted with `mammoth`.
- Every result is passed through `sanitize-html` with a tag allowlist. Tables and images from `.docx` files are dropped because the editor schema doesn't support them.

## API

All routes require the session cookie except login. Every document route calls `getAccess()` first.

| Route | Behaviour |
| --- | --- |
| `POST /api/login` | Demo sign-in; sets an httpOnly cookie with the user id |
| `POST /api/logout` | Clears the cookie |
| `GET /api/documents` | `{ owned, shared }` for the current user |
| `POST /api/documents` | Create an empty document |
| `GET /api/documents/[id]` | Document + caller's access level; 404 if no access |
| `PATCH /api/documents/[id]` | Update title/content; owner or editor; Zod-validated; sanitized |
| `DELETE /api/documents/[id]` | Owner only |
| `POST /api/documents/[id]/shares` | Owner only; invite by email or update an existing role (upsert) |
| `DELETE /api/documents/[id]/shares` | Owner only; revoke by `userId` |
| `POST /api/import` | Multipart upload; Node runtime; extension + size checks |

## Authentication is mocked

The login screen lists the seeded users, and the chosen user id is stored in an httpOnly cookie. The cookie is **unsigned**, so anyone who can set a cookie can impersonate a user. This is a deliberate scope cut for the assignment and must not ship to production as-is. Real auth (OAuth or hashed passwords + signed sessions) is listed as the next step in `SUBMISSION.md`.

## Verification

Run locally:

```bash
npx tsc --noEmit   # clean
npm run lint       # clean
npm test           # 25 unit tests
npm run build      # production build
```

I also ran a 53-check HTTP smoke test against the dev server covering login/logout, CRUD, validation failures, viewer/editor/stranger permissions, role changes, revocation, import types, an oversized upload, and XSS payload stripping. All 53 passed. The UI was not clicked through in a browser; see `SUBMISSION.md` for the honest breakdown.

## Deliberately not built

Real-time collaboration, comments, version history, real authentication/OAuth, and a file-attachment store. The editor is last-write-wins on save (debounced), so two people editing the same document can overwrite each other.

## Deploy (Vercel + Neon)

1. Create a Neon project and copy the **pooled** connection string (`...?sslmode=require`).
2. Apply the schema and seed from your machine using that string:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
3. Push this repository to GitHub.
4. Import it in Vercel. Add `DATABASE_URL` for Production and Preview. The build command is already `prisma generate && next build`.
5. Deploy, then test the live URL in two browser profiles: sign in as Alice, create and share a document with Bob as Viewer, then confirm Bob sees “View only” and gets a 403 from a direct `PATCH`.
