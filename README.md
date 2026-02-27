# The Stack

A personal finance tools platform built with Next.js.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL at minimum
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database

```bash
npx prisma db push            # apply schema to your database
npm run db:seed                # seed with sample card data
npx prisma studio              # browse data in GUI
```

The app works without a database — it falls back to the JSON seed data in `content/cards/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database from JSON |
| `npm run db:studio` | Open Prisma Studio |

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Zod, Framer Motion, OpenTelemetry.
