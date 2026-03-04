import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, BankingAccountType, BankingBonusSourceType } from '@prisma/client';
import {
  bankingBonusesSeedDatasetSchema,
  type BankingBonusSeedRecord
} from '../src/lib/banking-bonus-seed-schema';

type CliOptions = {
  filePath: string;
  deactivateMissing: boolean;
};

const accountTypeToDb: Record<BankingBonusSeedRecord['accountType'], BankingAccountType> = {
  checking: BankingAccountType.CHECKING,
  savings: BankingAccountType.SAVINGS,
  bundle: BankingAccountType.BUNDLE
};

function usage() {
  console.info(
    'Usage: npm run banking:import -- <path-to-json> [--deactivate-missing]\\n\\n' +
      'Accepted JSON formats:\\n' +
      '1) Array of banking offer records\\n' +
      '2) Object with { "bonuses": [...] }\\n\\n' +
      'Example:\\n' +
      'npm run banking:import -- ./content/banking-bonuses.template.json --deactivate-missing'
  );
}

function parseArgs(argv: string[]): CliOptions {
  let filePath = '';
  let deactivateMissing = false;

  for (const arg of argv) {
    if (arg === '--deactivate-missing') {
      deactivateMissing = true;
      continue;
    }

    if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
      continue;
    }
  }

  return { filePath, deactivateMissing };
}

function extractRows(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object' && 'bonuses' in raw) {
    const maybeRows = (raw as { bonuses?: unknown }).bonuses;
    if (Array.isArray(maybeRows)) return maybeRows;
  }

  return raw;
}

function toUpsertData(record: BankingBonusSeedRecord) {
  return {
    slug: record.slug,
    bankName: record.bankName,
    offerName: record.offerName,
    accountType: accountTypeToDb[record.accountType],
    headline: record.headline,
    bonusAmount: record.bonusAmount,
    estimatedFees: record.estimatedFees,
    directDepositRequired: record.directDeposit.required,
    directDepositMinimumAmount:
      record.directDeposit.required && typeof record.directDeposit.minimumAmount === 'number'
        ? record.directDeposit.minimumAmount
        : null,
    minimumOpeningDeposit:
      typeof record.minimumOpeningDeposit === 'number' ? record.minimumOpeningDeposit : null,
    holdingPeriodDays: record.holdingPeriodDays ?? null,
    requiredActions: record.requiredActions,
    stateRestrictions: record.stateRestrictions ?? [],
    notes: record.notes ?? null,
    offerUrl: record.offerUrl ?? null,
    affiliateUrl: record.affiliateUrl ?? null,
    sourceType: BankingBonusSourceType.MANUAL,
    sourceLabel: 'manual-import',
    isActive: record.isActive,
    lastVerified: record.lastVerified ? new Date(record.lastVerified) : new Date()
  };
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
    console.error('[banking:import] Invalid JSON', {
      file: resolvedPath,
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
    return;
  }

  const rowsInput = extractRows(parsedJson);
  const parsed = bankingBonusesSeedDatasetSchema.safeParse(rowsInput);
  if (!parsed.success) {
    console.error('[banking:import] Validation failed', {
      file: resolvedPath,
      issues: parsed.error.issues
    });
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const importedSlugs: string[] = [];

    for (const record of parsed.data) {
      const data = toUpsertData(record);
      await prisma.bankingBonus.upsert({
        where: { slug: data.slug },
        create: data,
        update: data
      });
      importedSlugs.push(data.slug);
    }

    let deactivatedCount = 0;
    if (options.deactivateMissing) {
      const result = await prisma.bankingBonus.updateMany({
        where: {
          slug: {
            notIn: importedSlugs
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      });
      deactivatedCount = result.count;
    }

    console.info('[banking:import] Complete', {
      file: resolvedPath,
      imported: importedSlugs.length,
      deactivated: deactivatedCount,
      deactivateMissing: options.deactivateMissing
    });
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('[banking:import] unexpected failure', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
