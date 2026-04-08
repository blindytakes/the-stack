/**
 * Database seed entrypoint.
 *
 * Structured catalog data is loaded through explicit JSON import scripts
 * (`cards:import`, `banking:import`, `card-benefits:import`) rather than a
 * conventional Prisma seed. The script intentionally logs and exits
 * successfully so `npm run db:seed` remains safe to run in all environments.
 */
async function main() {
  console.info(
    '[db:seed] Skipped: use cards:import, banking:import, card-benefits:import, and entity-images:backfill for catalog data.'
  );
}

main().catch((error) => {
  console.error('[db:seed] unexpected failure', error);
  process.exit(1);
});
