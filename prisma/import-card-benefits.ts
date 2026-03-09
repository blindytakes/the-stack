import fs from 'node:fs/promises';
import path from 'node:path';
import { BenefitCategory, PrismaClient } from '@prisma/client';
import {
  cardBenefitsImportDatasetSchema,
  type CardBenefitImportRecord
} from '../src/lib/card-benefit-import-schema';

type CliOptions = {
  filePath: string;
};

function usage() {
  console.info(
    'Usage: npm run card-benefits:import -- <path-to-json>\n\n' +
      'Accepted JSON formats:\n' +
      '1) Array of card benefit import records\n' +
      '2) Object with { "cards": [...] }\n\n' +
      'Example:\n' +
      'npm run card-benefits:import -- ./content/card-benefits.json'
  );
}

function parseArgs(argv: string[]): CliOptions {
  let filePath = '';

  for (const arg of argv) {
    if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
    }
  }

  return { filePath };
}

function extractRows(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object' && 'cards' in raw) {
    const maybeRows = (raw as { cards?: unknown }).cards;
    if (Array.isArray(maybeRows)) return maybeRows;
  }

  return raw;
}

function toBenefitCreateData(cardId: string, record: CardBenefitImportRecord) {
  return record.benefits.map((benefit) => ({
    cardId,
    category: benefit.category as BenefitCategory,
    name: benefit.name,
    description: benefit.description,
    estimatedValue: typeof benefit.estimatedValue === 'number' ? benefit.estimatedValue : null,
    activationMethod: benefit.activationMethod ?? null,
    finePrint: benefit.finePrint ?? null
  }));
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.filePath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), options.filePath);
  const rawText = await fs.readFile(resolvedPath, 'utf8');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (error) {
    console.error('[card-benefits:import] Invalid JSON', {
      file: resolvedPath,
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
    return;
  }

  const rowsInput = extractRows(parsedJson);
  const parsed = cardBenefitsImportDatasetSchema.safeParse(rowsInput);
  if (!parsed.success) {
    console.error('[card-benefits:import] Validation failed', {
      file: resolvedPath,
      issues: parsed.error.issues
    });
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const updated: Array<{ slug: string; benefitCount: number }> = [];

    for (const record of parsed.data) {
      const card = await prisma.card.findUnique({
        where: { slug: record.slug },
        select: { id: true, slug: true, name: true }
      });

      if (!card) {
        throw new Error(`Card not found for slug "${record.slug}"`);
      }

      await prisma.$transaction(async (tx) => {
        await tx.benefit.deleteMany({
          where: { cardId: card.id }
        });

        const benefits = toBenefitCreateData(card.id, record);
        if (benefits.length > 0) {
          await tx.benefit.createMany({
            data: benefits
          });
        }
      });

      updated.push({
        slug: card.slug,
        benefitCount: record.benefits.length
      });
    }

    console.info('[card-benefits:import] Complete', {
      file: resolvedPath,
      updated
    });
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('[card-benefits:import] unexpected failure', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
