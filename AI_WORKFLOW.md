# AI workflow note

## Tools used

- **Freebuff coding agent (Buffy)** — scaffolding the Next.js app, implementing the Prisma schema, API routes, TipTap editor, share dialog and dashboard, writing tests and these docs, and running verification (typecheck, lint, tests, build, HTTP smoke test).
- **The assignment's supplied execution plan** — used as the architecture outline (data model, permission rules, route list, scope cuts). I treated it as a draft to validate, not as ground truth; several details were wrong for the installed versions (see below).

The raw trail of prompts, mistakes and corrections is in [`AI_LOG.md`](./AI_LOG.md).

## Where AI sped things up

- **Scaffold and config** — Next 16 app, Tailwind v4, TypeScript, ESLint; Prisma init and migration.
- **Boilerplate with a known shape** — route handlers, Zod schemas, JSON error helpers, cookie session helpers.
- **Prisma schema and seed** — relation modelling, cascade rules, idempotent seeding.
- **Import converters** — txt escaping/paragraphs, marked and mammoth wiring, plus the sanitize-html allowlist.
- **UI volume** — dashboard rows, empty states, editor toolbar, share modal, save-status states. This is the least interesting code and the easiest to review quickly.
- **Test generation** — the first draft of the access and import tests; I then corrected assertions to match real library output.

## What I changed or rejected

1. **Removed `cacheComponents` from the scaffold.** Next 16.4 enables it by default. Its bundled docs (`authentication-with-cache-components.md`) say reading `cookies()` outside a `<Suspense>` boundary is a build error. This app is session-dependent on every page, so that would have meant wrapping every route in Suspense for no benefit. I removed `cacheComponents` and `partialPrefetching` and kept routes dynamic. Verified by the production build showing all routes as `ƒ`.
2. **Did not install `@tiptap/extension-underline`.** The supplied plan warns v2 needs it; the installed TipTap is 3.34, whose `StarterKit` already registers Underline and Link. I checked `node_modules/@tiptap/starter-kit/dist/index.d.ts` and avoided a duplicate-extension warning.
3. **Bumped `@types/node` from `^20` to `^24`.** `npm i -D vitest` failed with ERESOLVE because Vitest 5 requires `@types/node ^22 || >=24`. Rather than `--legacy-peer-deps`, I aligned the types with the actual Node 24 runtime.
4. **Rewrote the recursive autosave function.** ESLint's `react-hooks/immutability` rule rejected `await save()` inside its own `useCallback`. The AI's first version was a recursive drain; I replaced it with a `while` loop that drains the pending patch, tracks `savedAny`/`failed`, and still preserves failed edits for Retry. Lint and build then passed.
5. **Corrected a test, not the implementation.** My generated test expected `<li><p>one</p></li>` from `marked`; it actually emits `<li>one</li>`. I changed the assertion to the real output instead of adding an HTML post-processor or weakening the test.
6. **Hardened the sanitizer beyond the first draft.** Added `nonTextTags` so script/style *contents* are dropped, restricted URL schemes, and forced `rel="noopener noreferrer nofollow"` on links. Covered by tests for `<script>`, `onclick`, and `javascript:` URLs.
7. **Removed `next/font/google`.** The scaffold loads Geist at build time, which adds a network dependency to every build. I used a system font stack instead — one less failure mode, no visual cost for this app.
8. **Rejected scope creep.** Suggested additions like real-time collaboration, comments, real OAuth, image uploads and an activity feed were cut; they are listed as future work instead. The assignment explicitly values deliberate cuts.
9. **Fixed a false-positive in my own smoke test.** The run reported the viewer page missing “View only”; the script had never requested the page and was grepping the previous response body. After adding the request, the page contained the banner twice (top bar + banner). The application was correct; the test was not.
10. **Local database permissions.** `prisma migrate dev` failed with P3014 because the app role couldn't create the shadow database. I granted `CREATEDB` to the local role (documented as a `migrate dev` requirement) rather than switching the schema or using `db push`.

## How I verified

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm test` — 25 unit tests across pure permission rules and import/sanitization.
- `npm run build` — production build succeeds; Prisma client generated in the build.
- 53-check HTTP smoke test against the running dev server:
  - 401 for anonymous APIs, redirect for anonymous document pages;
  - owner CRUD, title/content validation (empty, >200 chars, no fields, malformed JSON);
  - `<script>` and `onclick` stripped on save, `<strong>` preserved;
  - owner/editor/viewer/stranger matrix, including 404 for strangers and 403 for viewers;
  - share with self (400), unknown email (404), invalid role (400), upsert role change, revoke, 404 on re-revoke;
  - `.txt` import escaped, `.exe` rejected (400), ~2.1 MB upload rejected (413);
  - logout and post-logout 401.
- Viewer page HTML contains the read-only banner and no Share control.
- **Not verified:** I did not click through the UI in a browser, test drag-selection formatting, verify hydration visually, or run the two-profile live deployment test (no Vercel/Neon credentials). Those are the first things to check manually after deploying.
