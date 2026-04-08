import { PrismaClient } from '@prisma/client';
import {
  resolvePersistedBankingImageUrl,
  resolvePersistedCardImageUrl
} from '../src/lib/entity-image-persistence';

type CliOptions = {
  dryRun: boolean;
};

type ChangeRecord = {
  entityType: 'card' | 'banking';
  slug: string;
  before: string | null;
  after: string | null;
};

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes('--dry-run')
  };
}

function normalizeStoredImageUrl(imageUrl?: string | null) {
  const normalizedImageUrl = imageUrl?.trim();
  return normalizedImageUrl ? normalizedImageUrl : null;
}

function hasChanged(before: string | null, after: string | null) {
  return before !== after;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const cardRows = await prisma.card.findMany({
      select: { id: true, slug: true, issuer: true, name: true, imageUrl: true }
    });
    const bankingRows = await prisma.bankingBonus.findMany({
      select: { id: true, slug: true, bankName: true, imageUrl: true }
    });

    const changes: ChangeRecord[] = [];
    let updatedCards = 0;
    let updatedBankingBonuses = 0;

    for (const row of cardRows) {
      const before = normalizeStoredImageUrl(row.imageUrl);
      const after =
        resolvePersistedCardImageUrl({
          slug: row.slug,
          issuer: row.issuer,
          name: row.name,
          imageUrl: row.imageUrl
        }) ?? null;

      if (!hasChanged(before, after)) continue;

      if (!options.dryRun) {
        await prisma.card.update({
          where: { id: row.id },
          data: { imageUrl: after }
        });
      }

      updatedCards += 1;
      changes.push({
        entityType: 'card',
        slug: row.slug,
        before,
        after
      });
    }

    for (const row of bankingRows) {
      const before = normalizeStoredImageUrl(row.imageUrl);
      const after = resolvePersistedBankingImageUrl(row.bankName, row.imageUrl) ?? null;

      if (!hasChanged(before, after)) continue;

      if (!options.dryRun) {
        await prisma.bankingBonus.update({
          where: { id: row.id },
          data: { imageUrl: after }
        });
      }

      updatedBankingBonuses += 1;
      changes.push({
        entityType: 'banking',
        slug: row.slug,
        before,
        after
      });
    }

    console.info('[entity-images:backfill] Complete', {
      dryRun: options.dryRun,
      cardsScanned: cardRows.length,
      bankingBonusesScanned: bankingRows.length,
      updatedCards,
      updatedBankingBonuses,
      changedRowsPreview: changes.slice(0, 20)
    });
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('[entity-images:backfill] unexpected failure', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
