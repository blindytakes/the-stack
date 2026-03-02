# The Stack

A personal finance tools platform built with Next.js.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL at minimum
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment

Minimum:

- `DATABASE_URL` (optional if you want JSON fallback only)

Newsletter provider integration:

- `NEWSLETTER_PROVIDER` (`none`, `resend`, or `beehiiv`)
- `NEWSLETTER_SYNC_MAX_RETRIES` (default `2`)

Resend:
- `RESEND_API_KEY` (required when provider is `resend`)
- `RESEND_AUDIENCE_ID` (required when provider is `resend`)

Beehiiv:
- `BEEHIIV_API_KEY` (required when provider is `beehiiv`)
- `BEEHIIV_PUBLICATION_ID` (required when provider is `beehiiv`)
- `BEEHIIV_SEND_WELCOME_EMAIL` (`true`/`false`, default `true`)

- `SUPPORT_EMAIL` (used on the contact page)

Affiliate tracking:

- `AFFILIATE_ALLOWED_HOSTS` (comma-separated allowlist of outbound domains)

Analytics:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

### Database

```bash
npx prisma db push            # apply schema to your database
npm run db:seed                # seed with sample card data
npx prisma studio              # browse data in GUI
```

The app works without a database — it falls back to the JSON seed data in `content/cards/`.

## Deliverability

See [docs/deliverability.md](docs/deliverability.md) for SPF/DKIM/DMARC and monitoring setup.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run tests |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database from JSON |
| `npm run db:studio` | Open Prisma Studio |

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Zod, Framer Motion, OpenTelemetry.
