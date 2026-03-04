# The Stack

A personal finance tools platform built with Next.js.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL at minimum
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI agent guidance

For repository-specific AI workflow and safety guidance, see [AGENTS.md](AGENTS.md).

## Environment

Minimum:

- `DATABASE_URL` (required)

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

Health checks:

- `HEALTH_CHECK_TOKEN` (required in production for `/api/health`)

### Database

```bash
npx prisma db push            # apply schema to your database
npx prisma studio              # browse data in GUI
```

### Banking offers import

Use the manual import script to load or refresh banking bonus offers from JSON.

```bash
# 1) Start from the template
cp content/banking-bonuses.template.json content/banking-bonuses.json

# 2) Edit content/banking-bonuses.json with your current offers

# 3) Import into DB
npm run banking:import -- ./content/banking-bonuses.json

# Optional: deactivate DB offers not present in the file
npm run banking:import -- ./content/banking-bonuses.json --deactivate-missing
```

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
| `npm run db:studio` | Open Prisma Studio |
| `npm run banking:import -- <file>` | Upsert banking offers from JSON |

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Zod, Framer Motion, OpenTelemetry.
