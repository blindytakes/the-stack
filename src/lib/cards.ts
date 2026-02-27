import { z } from 'zod';
import { CardType, CreditTier, Network, type Prisma } from '@prisma/client';
import cardsJson from '../../content/cards/cards.json';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cardsSeedDatasetSchema, type CardSeedRecord, type SpendingCategoryValue } from '@/lib/card-seed-schema';

export type CardRecord = {
  slug: string;
  name: string;
  issuer: string;
  cardType: CardSeedRecord['cardType'];
  rewardType: CardSeedRecord['rewardType'];
  topCategories: SpendingCategoryValue[];
  annualFee: number;
  creditTierMin: CardSeedRecord['creditTierMin'];
  headline: string;
  description?: string;
  longDescription?: string;
  editorRating?: number;
  pros?: string[];
  cons?: string[];
};

export type RewardDetail = {
  category: SpendingCategoryValue;
  rate: number;
  rateType: 'cashback' | 'points' | 'miles';
  capAmount?: number;
  capPeriod?: string;
  isRotating?: boolean;
  notes?: string;
};

export type SignUpBonusDetail = {
  bonusValue: number;
  bonusType: string;
  bonusPoints?: number;
  spendRequired: number;
  spendPeriodDays: number;
  isCurrentOffer?: boolean;
};

export type BenefitDetail = {
  category: string;
  name: string;
  description: string;
  estimatedValue?: number;
  activationMethod?: string;
};

export type TransferPartnerDetail = {
  partnerName: string;
  partnerType: string;
  transferRatio: number;
};

export type CardDetail = CardRecord & {
  network?: string;
  introApr?: string;
  regularAprMin?: number;
  regularAprMax?: number;
  foreignTxFee: number;
  applyUrl?: string;
  rewards: RewardDetail[];
  signUpBonuses: SignUpBonusDetail[];
  benefits: BenefitDetail[];
  transferPartners: TransferPartnerDetail[];
};

function seedToCardRecord(seed: CardSeedRecord): CardRecord {
  return {
    slug: seed.slug,
    name: seed.name,
    issuer: seed.issuer,
    cardType: seed.cardType,
    rewardType: seed.rewardType,
    topCategories: seed.topCategories,
    annualFee: seed.annualFee,
    creditTierMin: seed.creditTierMin,
    headline: seed.headline,
    description: seed.description,
    longDescription: seed.longDescription,
    editorRating: seed.editorRating,
    pros: seed.pros,
    cons: seed.cons
  };
}

function getCardsSeedDataSafe(): CardSeedRecord[] | null {
  const parsed = cardsSeedDatasetSchema.safeParse(cardsJson);
  if (!parsed.success) {
    console.error('[cards] seed json parse failed', parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

export const cardsQuerySchema = z.object({
  issuer: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CardsQuery = z.infer<typeof cardsQuerySchema>;

export function filterCards(cards: CardRecord[], query: CardsQuery) {
  return cards.filter((card) => {
    if (query.issuer && !card.issuer.toLowerCase().includes(query.issuer.toLowerCase())) {
      return false;
    }

    if (
      query.category &&
      !card.topCategories.some((category) => category.toLowerCase() === query.category?.toLowerCase())
    ) {
      return false;
    }

    if (typeof query.maxFee === 'number' && card.annualFee > query.maxFee) {
      return false;
    }

    return true;
  });
}

export function paginateCards(cards: CardRecord[], query: Pick<CardsQuery, 'limit' | 'offset'>) {
  return cards.slice(query.offset, query.offset + query.limit);
}

type DbCardRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
  };
}>;

const creditTierFromDb: Record<CreditTier, CardRecord['creditTierMin']> = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  BUILDING: 'building'
};

const cardTypeFromDb: Record<CardType, NonNullable<CardRecord['cardType']>> = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  STUDENT: 'student',
  SECURED: 'secured'
};

const spendingCategoryFromDb: Record<string, SpendingCategoryValue> = {
  DINING: 'dining',
  GROCERIES: 'groceries',
  TRAVEL: 'travel',
  GAS: 'gas',
  STREAMING: 'streaming',
  ONLINE_SHOPPING: 'online_shopping',
  ENTERTAINMENT: 'entertainment',
  UTILITIES: 'utilities',
  ALL: 'all',
  OTHER: 'other'
};

function toCardRecordFromDb(row: DbCardRow, seedBySlug: Map<string, CardSeedRecord>): CardRecord | null {
  const seed = seedBySlug.get(row.slug);
  const derivedRewardType: CardRecord['rewardType'] =
    row.rewards[0]?.rateType === 'POINTS'
      ? 'points'
      : row.rewards[0]?.rateType === 'MILES'
        ? 'miles'
        : 'cashback';

  const derivedTopCategories: SpendingCategoryValue[] =
    row.rewards.length > 0
      ? row.rewards.map((reward) => spendingCategoryFromDb[reward.category] ?? 'other')
      : ['all'];

  return {
    slug: row.slug,
    name: row.name,
    issuer: row.issuer,
    cardType: cardTypeFromDb[row.cardType],
    rewardType: seed?.rewardType ?? derivedRewardType,
    topCategories: seed?.topCategories ?? derivedTopCategories,
    annualFee: Number(row.annualFee),
    creditTierMin: creditTierFromDb[row.creditScoreMin],
    headline:
      seed?.headline ??
      `${row.name} by ${row.issuer}${Number(row.annualFee) === 0 ? ' with no annual fee' : ''}`.trim(),
    description: row.description ?? undefined,
    longDescription: row.longDescription ?? undefined,
    editorRating: row.editorRating ? Number(row.editorRating) : undefined,
    pros: row.pros.length > 0 ? row.pros : undefined,
    cons: row.cons.length > 0 ? row.cons : undefined
  };
}

export async function getCardsDataWithDbFallback(): Promise<{
  cards: CardRecord[];
  source: 'db' | 'json';
}> {
  const seedCards = getCardsSeedDataSafe();

  if (!isDatabaseConfigured()) {
    if (!seedCards) {
      throw new Error('Card seed JSON is invalid and no database is configured');
    }
    return { cards: seedCards.map(seedToCardRecord), source: 'json' };
  }

  try {
    const rows = await db.card.findMany({
      where: { isActive: true },
      include: { rewards: true },
      orderBy: [{ issuer: 'asc' }, { name: 'asc' }]
    });

    const seedBySlug = new Map((seedCards ?? []).map((card) => [card.slug, card]));
    const cards = rows
      .map((row) => toCardRecordFromDb(row, seedBySlug))
      .filter((card): card is CardRecord => Boolean(card));

    if (cards.length > 0) {
      return { cards, source: 'db' };
    }
  } catch (error) {
    console.error('[cards] db read failed, falling back to json', error);
  }

  if (!seedCards) {
    throw new Error('Card data unavailable: database read failed and seed JSON is invalid');
  }

  return { cards: seedCards.map(seedToCardRecord), source: 'json' };
}

const networkFromDb: Record<Network, string> = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover'
};

const rateTypeFromDb: Record<string, RewardDetail['rateType']> = {
  CASHBACK: 'cashback',
  POINTS: 'points',
  MILES: 'miles'
};

type DbCardDetailRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
    signUpBonuses: true;
    benefits: true;
    transferPartners: true;
  };
}>;

function seedToCardDetail(seed: CardSeedRecord): CardDetail {
  return {
    ...seedToCardRecord(seed),
    network: seed.network,
    introApr: seed.introApr,
    regularAprMin: seed.regularAprMin,
    regularAprMax: seed.regularAprMax,
    foreignTxFee: seed.foreignTxFee ?? 0,
    applyUrl: seed.applyUrl,
    rewards: (seed.rewards ?? []).map((r) => ({
      category: r.category,
      rate: r.rate,
      rateType: r.rateType,
      capAmount: r.capAmount,
      capPeriod: r.capPeriod,
      isRotating: r.isRotating,
      notes: r.notes
    })),
    signUpBonuses: (seed.signUpBonuses ?? []).map((b) => ({
      bonusValue: b.bonusValue,
      bonusType: b.bonusType,
      bonusPoints: b.bonusPoints,
      spendRequired: b.spendRequired,
      spendPeriodDays: b.spendPeriodDays,
      isCurrentOffer: b.isCurrentOffer
    })),
    benefits: (seed.benefits ?? []).map((b) => ({
      category: b.category,
      name: b.name,
      description: b.description,
      estimatedValue: b.estimatedValue,
      activationMethod: b.activationMethod
    })),
    transferPartners: (seed.transferPartners ?? []).map((p) => ({
      partnerName: p.partnerName,
      partnerType: p.partnerType,
      transferRatio: p.transferRatio ?? 1
    }))
  };
}

function toCardDetailFromDb(row: DbCardDetailRow, seedBySlug: Map<string, CardSeedRecord>): CardDetail | null {
  const seed = seedBySlug.get(row.slug);
  const base = toCardRecordFromDb(
    row as DbCardRow,
    seedBySlug
  );
  if (!base) {
    return seed ? seedToCardDetail(seed) : null;
  }

  return {
    ...base,
    network: row.network ? networkFromDb[row.network] : undefined,
    introApr: row.introApr ?? undefined,
    regularAprMin: row.regularAprMin ? Number(row.regularAprMin) : undefined,
    regularAprMax: row.regularAprMax ? Number(row.regularAprMax) : undefined,
    foreignTxFee: Number(row.foreignTxFee),
    applyUrl: row.applyUrl ?? undefined,
    rewards: row.rewards.map((r) => ({
      category: spendingCategoryFromDb[r.category] ?? 'other',
      rate: Number(r.rate),
      rateType: rateTypeFromDb[r.rateType] ?? 'cashback',
      capAmount: r.capAmount ? Number(r.capAmount) : undefined,
      capPeriod: r.capPeriod ?? undefined,
      isRotating: r.isRotating || undefined,
      notes: r.notes ?? undefined
    })),
    signUpBonuses: row.signUpBonuses.map((b) => ({
      bonusValue: Number(b.bonusValue),
      bonusType: b.bonusType,
      bonusPoints: b.bonusPoints ?? undefined,
      spendRequired: Number(b.spendRequired),
      spendPeriodDays: b.spendPeriodDays,
      isCurrentOffer: b.isCurrentOffer
    })),
    benefits: row.benefits.map((b) => ({
      category: b.category.toLowerCase().replace(/_/g, ' '),
      name: b.name,
      description: b.description,
      estimatedValue: b.estimatedValue ? Number(b.estimatedValue) : undefined,
      activationMethod: b.activationMethod ?? undefined
    })),
    transferPartners: row.transferPartners.map((p) => ({
      partnerName: p.partnerName,
      partnerType: p.partnerType.toLowerCase(),
      transferRatio: Number(p.transferRatio)
    }))
  };
}

export async function getCardBySlug(slug: string): Promise<CardDetail | null> {
  const seedCards = getCardsSeedDataSafe();

  if (isDatabaseConfigured()) {
    try {
      const row = await db.card.findUnique({
        where: { slug, isActive: true },
        include: {
          rewards: true,
          signUpBonuses: true,
          benefits: true,
          transferPartners: true
        }
      });

      if (row) {
        const seedBySlug = new Map((seedCards ?? []).map((c) => [c.slug, c]));
        return toCardDetailFromDb(row, seedBySlug);
      }
    } catch (error) {
      console.error('[cards] db read failed for slug', slug, error);
    }
  }

  const seed = seedCards?.find((c) => c.slug === slug);
  return seed ? seedToCardDetail(seed) : null;
}

export async function getAllCardSlugs(): Promise<string[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await db.card.findMany({
        where: { isActive: true },
        select: { slug: true }
      });
      if (rows.length > 0) return rows.map((r) => r.slug);
    } catch {
      // fall through to JSON
    }
  }

  const seedCards = getCardsSeedDataSafe();
  return seedCards?.map((c) => c.slug) ?? [];
}
