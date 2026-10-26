# Quacker — starter template

Full-stack teaching template: pnpm monorepo with two apps.

- `apps/backend` — NestJS + Prisma + Postgres. Auth: BetterAuth (mounted at `/api/auth/*`, treat as a black box). API docs: Swagger at `/api/docs`.
- `apps/frontend` — React + Vite + TanStack Router/Query, Tailwind + shadcn/ui, `ky` + `zod` API client. Feature folders under `src/features/`.

The worked example is the quack feed: `Quack` model → seed → repository → service → `GET`/`POST /api/quacks` (DTO-validated, author taken from the session) → zod schema → TanStack Query → list page + post form. Copy its pattern for new features.

**Before writing or changing any UI, read [`DESIGN.md`](DESIGN.md).** It is a contract, not a suggestion — it exists to stop generated screens drifting into generic nested cards.

## Commands

- `pnpm dev` — everything: env files, Postgres (Docker), migrate, seed, both dev servers
- `pnpm check-all` — lint + type-check + tests + build (same as CI)
- `pnpm backend test` / `pnpm frontend test:ci` — unit tests
- `pnpm frontend e2e` — Playwright against the running app
- `pnpm backend prisma:migrations:run` — create/apply migrations after schema changes

## Conventions

Deliberately sparse — this file grows as the team learns what it expects from generated code. Add rules here when you find yourself repeating the same review feedback.

### UI controls come from the kit

Need a control that isn't in `src/components/ui/`? Add it with `pnpm dlx shadcn@latest add <name>` — don't hand-roll one in a feature folder, even where a native input would do the job. One accessibility implementation to reason about beats a per-control judgement call.

The CLI puts `shadow-xs`/`shadow-sm` on inputs, textareas and cards. [`DESIGN.md`](DESIGN.md) keeps shadows for things that genuinely float — dialogs, dropdowns, toasts. Strip them.

### The app is already running

Assume the dev servers are up. If something is listening on the app's ports, that is this application: use it. Don't start a second instance, don't restart it, don't run `pnpm dev`.

Don't reach for the browser to check your own work. Tests and type-checks are the evidence; open the running app when asked to, not on your own initiative.

### Search is case-insensitive

Search across quacks matches post text, author display name, and username — all case-insensitively. Keep any future search or filter extensions consistent with this.

### Enforce single-action constraints in the database

For user actions that permit at most one entry per item (such as one vote per poll or one like per post), always enforce uniqueness at the database level via composite unique indexes (e.g., `@@unique([userId, pollId])`), not just in application code. Pair these actions on the frontend with optimistic cache updates that roll back and notify the user on failure.

### Who may do something is decided on the server

"Me" comes from the session (`@User()`), never from a `userId` in the URL, query or body — and so does the role (`user.role`). An ownership check belongs in the service, which has the data; owner-or-role is one condition there — see `QuacksService.deleteQuack`. Hiding a button in React is a convenience, not a check. Signed out is 401 (the guard); signed in but not allowed is 403.

### A permission check isn't done until its test has failed

Every owner or role check gets a test that calls the API directly as someone who must not get through and expects 403 — an E2E spec in `apps/frontend/e2e/`, or an HTTP spec next to the controller. Before committing, switch the check off, run the test, watch it fail, and put the check back. In Playwright, assert that the confirmation dialog has closed before asserting the item is gone: an open Radix dialog hides the rest of the page from `getByRole`, so a refused delete would pass for a successful one.
