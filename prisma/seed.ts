/**
 * Database seed entrypoint.
 *
 * This project no longer seeds card data through Prisma because card records
 * are managed directly in Supabase. The script intentionally logs and exits
 * successfully so `npm run db:seed` remains safe to run in all environments.
 */
async function main() {
  console.info(
    '[db:seed] Skipped: card data is managed directly in Supabase. Use Supabase SQL/CSV import for data loads.'
  );
}

main().catch((error) => {
  console.error('[db:seed] unexpected failure', error);
  process.exit(1);
});
