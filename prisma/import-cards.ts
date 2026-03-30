import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BenefitCategory,
  CardType,
  CreditTier,
  Network,
  PartnerType,
  PrismaClient,
  RateType,
  SpendingCategory
} from '@prisma/client';
import {
  cardsSeedDatasetSchema,
  type CardSeedRecord,
  type SpendingCategoryValue
} from '../src/lib/card-seed-schema';
import { readAllCardSeedDatasets } from '../src/lib/card-seed-files';

type CliOptions = {
  filePaths: string[];
  importAll: boolean;
  deactivateMissing: boolean;
};

type CardImportDataset = {
  filePath: string;
  records: CardSeedRecord[];
};

const cardTypeToDb: Record<NonNullable<CardSeedRecord['cardType']>, CardType> = {
  personal: CardType.PERSONAL,
  business: CardType.BUSINESS,
  student: CardType.STUDENT,
  secured: CardType.SECURED
};

const networkToDb: Record<NonNullable<CardSeedRecord['network']>, Network> = {
  visa: Network.VISA,
  mastercard: Network.MASTERCARD,
  amex: Network.AMEX,
  discover: Network.DISCOVER
};

const creditTierToDb: Record<CardSeedRecord['creditTierMin'], CreditTier> = {
  excellent: CreditTier.EXCELLENT,
  good: CreditTier.GOOD,
  fair: CreditTier.FAIR,
  building: CreditTier.BUILDING
};

const spendingCategoryToDb: Record<SpendingCategoryValue, SpendingCategory> = {
  dining: SpendingCategory.DINING,
  groceries: SpendingCategory.GROCERIES,
  travel: SpendingCategory.TRAVEL,
  gas: SpendingCategory.GAS,
  streaming: SpendingCategory.STREAMING,
  online_shopping: SpendingCategory.ONLINE_SHOPPING,
  entertainment: SpendingCategory.ENTERTAINMENT,
  utilities: SpendingCategory.UTILITIES,
  all: SpendingCategory.ALL,
  other: SpendingCategory.OTHER
};

const rateTypeToDb: Record<'cashback' | 'points' | 'miles', RateType> = {
  cashback: RateType.CASHBACK,
  points: RateType.POINTS,
  miles: RateType.MILES
};

const benefitCategoryToDb: Record<string, BenefitCategory> = {
  PURCHASE_PROTECTION: BenefitCategory.PURCHASE_PROTECTION,
  EXTENDED_WARRANTY: BenefitCategory.EXTENDED_WARRANTY,
  CELL_PHONE: BenefitCategory.CELL_PHONE,
  RENTAL_CAR: BenefitCategory.RENTAL_CAR,
  TRAVEL_INSURANCE: BenefitCategory.TRAVEL_INSURANCE,
  LOUNGE_ACCESS: BenefitCategory.LOUNGE_ACCESS,
  PRICE_PROTECTION: BenefitCategory.PRICE_PROTECTION,
  RETURN_PROTECTION: BenefitCategory.RETURN_PROTECTION,
  CONCIERGE: BenefitCategory.CONCIERGE,
  TSA_GLOBAL_ENTRY: BenefitCategory.TSA_GLOBAL_ENTRY,
  STREAMING_CREDITS: BenefitCategory.STREAMING_CREDITS,
  DINING_CREDITS: BenefitCategory.DINING_CREDITS,
  TRAVEL_CREDITS: BenefitCategory.TRAVEL_CREDITS,
  OTHER: BenefitCategory.OTHER
};

const partnerTypeToDb: Record<string, PartnerType> = {
  airline: PartnerType.AIRLINE,
  hotel: PartnerType.HOTEL,
  other: PartnerType.OTHER
};

function usage() {
  console.info(
    'Usage: npm run cards:import -- <path-to-json> [more-paths...] [--deactivate-missing]\n' +
      '   or: npm run cards:import -- --all [--deactivate-missing]\n\n' +
      'Accepted JSON formats:\n' +
      '1) Array of card records\n' +
      '2) Object with { "cards": [...] }\n\n' +
      'Example:\n' +
      'npm run cards:import -- ./content/cards-expansion.json\n' +
      'npm run cards:import -- --all'
  );
}

function parseArgs(argv: string[]): CliOptions {
  const filePaths: string[] = [];
  let importAll = false;
  let deactivateMissing = false;

  for (const arg of argv) {
    if (arg === '--deactivate-missing') {
      deactivateMissing = true;
      continue;
    }

    if (arg === '--all') {
      importAll = true;
      continue;
    }

    if (!arg.startsWith('-')) {
      filePaths.push(arg);
      continue;
    }
  }

  return { filePaths, importAll, deactivateMissing };
}

function extractRows(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object' && 'cards' in raw) {
    const maybeRows = (raw as { cards?: unknown }).cards;
    if (Array.isArray(maybeRows)) return maybeRows;
  }

  return raw;
}

function toCardData(record: CardSeedRecord) {
  return {
    slug: record.slug,
    name: record.name,
    issuer: record.issuer,
    cardType: record.cardType ? cardTypeToDb[record.cardType] : CardType.PERSONAL,
    network: record.network ? networkToDb[record.network] : null,
    description: record.description ?? null,
    longDescription: record.longDescription ?? null,
    annualFee: record.annualFee,
    introApr: record.introApr ?? null,
    regularAprMin: record.regularAprMin ?? null,
    regularAprMax: record.regularAprMax ?? null,
    creditScoreMin: creditTierToDb[record.creditTierMin],
    foreignTxFee: record.foreignTxFee ?? 0,
    editorRating: record.editorRating ?? null,
    pros: record.pros ?? [],
    cons: record.cons ?? [],
    imageUrl: record.imageUrl ?? null,
    applyUrl: record.applyUrl ?? null,
    affiliateUrl: record.affiliateUrl ?? null,
    isActive: record.isActive ?? true,
    lastVerified: record.lastVerified ? new Date(record.lastVerified) : new Date()
  };
}

function toRewardRows(cardId: string, record: CardSeedRecord) {
  return (record.rewards ?? []).map((reward) => ({
    cardId,
    category: spendingCategoryToDb[reward.category],
    rate: reward.rate,
    rateType: rateTypeToDb[reward.rateType],
    capAmount: reward.capAmount ?? null,
    capPeriod: reward.capPeriod ?? null,
    isRotating: reward.isRotating ?? false,
    rotationQuarter: reward.rotationQuarter ?? null,
    notes: reward.notes ?? null
  }));
}

function toSignUpBonusRows(cardId: string, record: CardSeedRecord) {
  return (record.signUpBonuses ?? []).map((bonus) => ({
    cardId,
    bonusValue: bonus.bonusValue,
    bonusType: bonus.bonusType,
    displayHeadline: bonus.displayHeadline ?? null,
    displayDescription: bonus.displayDescription ?? null,
    bonusPoints: bonus.bonusPoints ?? null,
    spendRequired: bonus.spendRequired,
    spendPeriodDays: bonus.spendPeriodDays,
    isCurrentOffer: bonus.isCurrentOffer ?? true,
    expiresAt: bonus.expiresAt ? new Date(bonus.expiresAt) : null
  }));
}

function toBenefitRows(cardId: string, record: CardSeedRecord) {
  return (record.benefits ?? []).map((benefit) => ({
    cardId,
    category: benefitCategoryToDb[benefit.category],
    name: benefit.name,
    description: benefit.description,
    estimatedValue: benefit.estimatedValue ?? null,
    activationMethod: benefit.activationMethod ?? null,
    finePrint: benefit.finePrint ?? null
  }));
}

function toTransferPartnerRows(cardId: string, record: CardSeedRecord) {
  return (record.transferPartners ?? []).map((partner) => ({
    cardId,
    partnerName: partner.partnerName,
    partnerType: partnerTypeToDb[partner.partnerType],
    transferRatio: partner.transferRatio ?? 1,
    bonusMultiplier: partner.bonusMultiplier ?? null,
    bonusExpiresAt: partner.bonusExpiresAt ? new Date(partner.bonusExpiresAt) : null
  }));
}

async function loadImportDatasets(options: CliOptions): Promise<CardImportDataset[]> {
  if (options.importAll) {
    const datasets = await readAllCardSeedDatasets();
    return datasets.map((dataset) => ({
      filePath: dataset.filePath,
      records: dataset.cards
    }));
  }

  const datasets: CardImportDataset[] = [];
  for (const filePath of options.filePaths) {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const rawText = await fs.readFile(resolvedPath, 'utf8');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (error) {
      throw new Error(
        `[cards:import] Invalid JSON in ${resolvedPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const rowsInput = extractRows(parsedJson);
    const parsed = cardsSeedDatasetSchema.safeParse(rowsInput);
    if (!parsed.success) {
      throw new Error(
        `[cards:import] Validation failed for ${resolvedPath}: ${JSON.stringify(parsed.error.issues)}`
      );
    }

    datasets.push({
      filePath,
      records: parsed.data
    });
  }

  return datasets;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.importAll && options.filePaths.length === 0) {
    usage();
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const datasets = await loadImportDatasets(options);
    const importedSlugs: string[] = [];

    for (const dataset of datasets) {
      for (const record of dataset.records) {
        const data = toCardData(record);

        await prisma.$transaction(async (tx) => {
          const card = await tx.card.upsert({
            where: { slug: data.slug },
            create: data,
            update: data,
            select: { id: true, slug: true }
          });

          if (record.rewards !== undefined) {
            await tx.rewardStructure.deleteMany({
              where: { cardId: card.id }
            });

            const rewards = toRewardRows(card.id, record);
            if (rewards.length > 0) {
              await tx.rewardStructure.createMany({
                data: rewards
              });
            }
          }

          if (record.signUpBonuses !== undefined) {
            await tx.signUpBonus.deleteMany({
              where: { cardId: card.id }
            });

            const bonuses = toSignUpBonusRows(card.id, record);
            if (bonuses.length > 0) {
              await tx.signUpBonus.createMany({
                data: bonuses
              });
            }
          }

          if (record.benefits !== undefined) {
            await tx.benefit.deleteMany({
              where: { cardId: card.id }
            });

            const benefits = toBenefitRows(card.id, record);
            if (benefits.length > 0) {
              await tx.benefit.createMany({
                data: benefits
              });
            }
          }

          if (record.transferPartners !== undefined) {
            await tx.transferPartner.deleteMany({
              where: { cardId: card.id }
            });

            const partners = toTransferPartnerRows(card.id, record);
            if (partners.length > 0) {
              await tx.transferPartner.createMany({
                data: partners
              });
            }
          }
        });

        importedSlugs.push(data.slug);
      }
    }

    let deactivatedCount = 0;
    if (options.deactivateMissing) {
      const result = await prisma.card.updateMany({
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

    console.info('[cards:import] Complete', {
      files: datasets.map((dataset) => dataset.filePath),
      imported: importedSlugs.length,
      deactivated: deactivatedCount,
      deactivateMissing: options.deactivateMissing
    });
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : '[cards:import] unexpected failure: ' + String(error)
  );
  process.exit(1);
});
