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

Runtime source of truth:

- Structured card, bonus, benefit, and banking rows live in PostgreSQL and are accessed through Prisma.
- Checked-in `content/*.json` files are import inputs, not runtime data sources.
- `imageUrl` is stored on DB rows. Imports and the image backfill task normalize missing or low-fidelity URLs before they are written.
- Supabase Storage is optional asset-hosting infrastructure for `entity-assets:import`; runtime reads the stored URL from the DB.

Operational steady state:

- `Card.imageUrl` should be populated in the database for every live card row.
- `BankingBonus.imageUrl` should be populated in the database for every live banking row.
- Runtime fallback resolvers still exist, but they are intended as safety nets rather than the primary source for production image URLs.

### Cards import

Use the manual import script to load or refresh card records from JSON. The importer normalizes `imageUrl` using the same shared resolver the app uses at runtime, so missing or weak URLs are replaced before the row is written.

```bash
# Import a curated expansion file
npm run cards:import -- ./content/cards-expansion.json

# Optional: deactivate DB cards not present in the file
npm run cards:import -- ./content/cards-expansion.json --deactivate-missing
```

### Banking offers import

Use the manual import script to load or refresh banking bonus offers from JSON. Known bank logos are normalized into `BankingBonus.imageUrl` during import so the DB becomes the primary source for banking images too.

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

Use the entity asset import script to upload approved card art and bank logos into Supabase Storage, then write the resulting `imageUrl` back to the database. Card records can also update `applyUrl` / `affiliateUrl` in the same pass. If you do not want Supabase Storage involved, pass `--use-source-url` and the script will write the approved source image URL directly into the DB instead.

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

### Image URL backfill

Use the backfill script to normalize existing `Card.imageUrl` and `BankingBonus.imageUrl` rows in the database without re-importing all offer data.

```bash
# Preview DB changes
npm run entity-images:backfill -- --dry-run

# Apply the normalized image URLs
npm run entity-images:backfill
```

Why this runs from Terminal instead of Supabase SQL Editor:

- The backfill is a TypeScript/Prisma script, not a raw SQL migration.
- It reuses the same resolver logic the app and import scripts use to decide which image URL is canonical.
- Prisma needs `DATABASE_URL` in the shell environment before it can connect to the database.

What the shell commands do:

```bash
cd /Users/alexsalesi/the-stack
set -a
source .env
set +a
```

- `cd /Users/alexsalesi/the-stack` makes sure `npm run ...` uses this repo's code and scripts.
- `set -a` tells the shell to automatically export variables loaded next.
- `source .env` loads the local env file into the current shell session, including `DATABASE_URL`.
- `set +a` turns automatic exporting back off.

What the backfill commands do:

- `npm run entity-images:backfill -- --dry-run` shows which rows would change without writing to the database.
- `npm run entity-images:backfill` applies those changes to `Card.imageUrl` and `BankingBonus.imageUrl`.

Recommended verification after a backfill:

```sql
select 'Card' as table_name, count(*) filter (where "imageUrl" is null) as null_images
from "Card"
union all
select 'BankingBonus', count(*) filter (where "imageUrl" is null)
from "BankingBonus";
```

Expected steady-state result: `0` null image rows for both tables.

## Deliverability

See [docs/deliverability.md](docs/deliverability.md) for SPF/DKIM/DMARC and monitoring setup.

## Observability

See [docs/observability-grafana.md](docs/observability-grafana.md) for Grafana Cloud OTLP setup and dashboard import instructions.

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
| `npm run entity-images:backfill` | Normalize persisted card/banking image URLs in DB |
| `npm run entity-assets:import -- <file>` | Upload card/bank images to Supabase Storage and update DB URLs |

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Zod, Framer Motion, OpenTelemetry.
