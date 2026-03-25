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

Supabase Storage import tooling:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default `entity-images`)
- `SUPABASE_STORAGE_PUBLIC_BASE_URL` (optional custom CDN/public base)

Health checks:

- `HEALTH_CHECK_TOKEN` (required in production for `/api/health`)

### Database

```bash
npx prisma db push            # apply schema to your database
npx prisma studio              # browse data in GUI
```

### Cards import

Use the manual import script to load or refresh card records from JSON.

```bash
# Import a curated expansion file
npm run cards:import -- ./content/cards-expansion.json

# Optional: deactivate DB cards not present in the file
npm run cards:import -- ./content/cards-expansion.json --deactivate-missing
```

### Banking offers import

Use the manual import script to load or refresh banking bonus offers from JSON.

```bash
# 1) Start from the template
cp content/banking-bonuses.template.json content/banking-bonuses.json

# 2) Edit content/banking-bonuses.json with your current offers

# 3) Import into DB
npm run banking:import -- ./content/banking-bonuses.json

# Optional: import an additive expansion batch such as business checking offers
npm run banking:import -- ./content/banking-bonuses-business-expansion.json

# Optional: deactivate DB offers not present in the file
npm run banking:import -- ./content/banking-bonuses.json --deactivate-missing
```

### Card benefits import

Use the manual import script to refresh card benefit rows from JSON.

```bash
# Refresh the checked-in card benefit file
npm run card-benefits:import -- ./content/card-benefits.json
```

Keep `estimatedValue` conservative. Use it for recurring value you can defend; leave it blank for highly conditional, promotional, or hard-to-realize perks.

### Entity assets import

Use the entity asset import script to upload approved card art and bank logos into Supabase Storage, then write the resulting `imageUrl` back to the database. Card records can also update `applyUrl` / `affiliateUrl` in the same pass.

If your database does not already include the latest `BankingBonus.imageUrl` column, run `npx prisma db push` first.

```bash
# 1) Start from the template
cp content/entity-assets.template.json content/entity-assets.json

# 2) Add approved source pages/image URLs and optional apply links

# 3) Preview the updates
npm run entity-assets:import -- ./content/entity-assets.json --dry-run

# 4) Run the import for real
npm run entity-assets:import -- ./content/entity-assets.json
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
| `npm run cards:import -- <file>` | Upsert card records from JSON |
| `npm run banking:import -- <file>` | Upsert banking offers from JSON |
| `npm run entity-assets:import -- <file>` | Upload card/bank images to Supabase Storage and update DB URLs |

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Zod, Framer Motion, OpenTelemetry.
