async function main() {
  console.info(
    '[db:seed] Skipped: card data is managed directly in Supabase. Use Supabase SQL/CSV import for data loads.'
  );
}

main().catch((error) => {
  console.error('[db:seed] unexpected failure', error);
  process.exit(1);
});
