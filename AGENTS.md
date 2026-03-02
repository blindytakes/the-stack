# AGENTS.md

Guidance for AI coding agents operating in this repository.

## Purpose

- Keep changes safe, focused, and easy to review.
- Follow existing patterns in this codebase instead of introducing new conventions.
- Validate changes with the smallest reliable test/check set.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill at least DATABASE_URL in .env.local
npm run dev
```

Open `http://localhost:3000`.

## Repo Map

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: UI, analytics, and tool components.
- `src/lib`: shared business logic, API helpers, env handling, and tests.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: seed script.
- `docs/`: operational docs (for example deliverability).

## Working Rules

- Keep edits scoped to the user request; avoid drive-by refactors.
- Preserve TypeScript strictness and existing naming patterns.
- Do not touch `.env`, secrets, or production credentials.
- Do not change dependency versions unless the task requires it.
- Avoid destructive git/file operations unless explicitly requested.
- If behavior changes, update or add tests in `src/lib/__tests__` when applicable.

## Validation Matrix

Run the least expensive checks that still prove correctness:

- Docs-only edits: no required checks.
- UI/component/page edits: `npm run lint` and `npm run typecheck`.
- Shared logic or API route edits: `npm run lint`, `npm run typecheck`, and `npm run test`.
- Prisma schema or data flow edits:
  - `npm run typecheck`
  - `npm run test` (if affected)
  - `npm run db:push` only when a local `DATABASE_URL` is configured.

If a required check cannot run (missing env, service, or permissions), report it clearly.

## Environment Notes

Minimum local variable:

- `DATABASE_URL`

Common integration variables:

- Newsletter: `NEWSLETTER_PROVIDER`, provider keys/IDs (`RESEND_*` or `BEEHIIV_*`)
- Affiliate tracking: `AFFILIATE_ALLOWED_HOSTS`
- Analytics: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Contact page: `SUPPORT_EMAIL`

See `README.md` and `docs/deliverability.md` for details.

## Done Checklist

Before handing off work:

- Ensure changed files are formatted and type-safe.
- Run the appropriate checks from the Validation Matrix.
- Confirm no unrelated files were modified.
- Summarize what changed, why, and any follow-up steps.
