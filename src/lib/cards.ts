import { z } from 'zod';
import { CardType, CreditTier, Network, type Prisma } from '@prisma/client';
import { db, isDatabaseConfigured } from '@/lib/db';

/**
 * Card data domain module.
 *
 * Provides:
 * - Shared card-related types used across APIs/pages
 * - Query parsing, filtering, and pagination helpers
 * - Prisma-row -> app-model mappers for list and detail views
 * - Database accessors for cards, card details, and slugs
 */

export const spendingCategoryValues = [
  'dining',
  'groceries',
  'travel',
  'gas',
  'streaming',
  'online_shopping',
  'entertainment',
  'utilities',
  'all',
  'other'
] as const;

export type SpendingCategoryValue = (typeof spendingCategoryValues)[number];
export type CardTypeValue = 'personal' | 'business' | 'student' | 'secured';
export type RewardTypeValue = 'cashback' | 'points' | 'miles';
export type CreditTierValue = 'excellent' | 'good' | 'fair' | 'building';

export type CardRecord = {
  slug: string;
  name: string;
  issuer: string;
  imageUrl?: string;
  cardType: CardTypeValue;
  rewardType: RewardTypeValue;
  topCategories: SpendingCategoryValue[];
  annualFee: number;
  creditTierMin: CreditTierValue;
  headline: string;
  description?: string;
  longDescription?: string;
  editorRating?: number;
  pros?: string[];
  cons?: string[];
  bestSignUpBonusValue?: number;
  bestSignUpBonusSpendRequired?: number;
  bestSignUpBonusSpendPeriodDays?: number;
  totalBenefitsValue: number;
  plannerBenefitsValue: number;
};

export type RewardDetail = {
  category: SpendingCategoryValue;
  rate: number;
  rateType: RewardTypeValue;
  capAmount?: number;
  capPeriod?: string;
  isRotating?: boolean;
  notes?: string;
};

export type SignUpBonusDetail = {
  bonusValue: number;
  bonusType: string;
  displayHeadline?: string;
  displayDescription?: string;
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
  affiliateUrl?: string;
  rewards: RewardDetail[];
  signUpBonuses: SignUpBonusDetail[];
  benefits: BenefitDetail[];
  transferPartners: TransferPartnerDetail[];
};

export const cardsQuerySchema = z.object({
  issuer: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CardsQuery = z.infer<typeof cardsQuerySchema>;

// In-memory filtering for API/query flows after DB fetch.
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

export type DbCardRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
    signUpBonuses: true;
    benefits: true;
  };
}>;

const creditTierFromDb: Record<CreditTier, CreditTierValue> = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  BUILDING: 'building'
};

const cardTypeFromDb: Record<CardType, CardTypeValue> = {
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

function deriveRewardType(rewards: DbCardRow['rewards']): RewardTypeValue {
  const rateType = rewards[0]?.rateType;
  if (rateType === 'POINTS') return 'points';
  if (rateType === 'MILES') return 'miles';
  return 'cashback';
}

function deriveTopCategories(rewards: DbCardRow['rewards']): SpendingCategoryValue[] {
  if (rewards.length === 0) return ['all'];
  return Array.from(
    new Set(rewards.map((reward) => spendingCategoryFromDb[reward.category] ?? 'other'))
  );
}

function deriveBestSignUpBonus(signUpBonuses: DbCardRow['signUpBonuses']) {
  if (signUpBonuses.length === 0) return null;
  const active = signUpBonuses.filter((bonus) => bonus.isCurrentOffer !== false);
  const candidates = active.length > 0 ? active : signUpBonuses;
  const best = [...candidates].sort(
    (a, b) => Number(b.bonusValue) - Number(a.bonusValue) || a.id.localeCompare(b.id)
  )[0];
  if (!best) return null;

  return {
    bonusValue: Number(best.bonusValue),
    spendRequired: Number(best.spendRequired),
    spendPeriodDays: best.spendPeriodDays
  };
}

function assertCardsDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required for card data');
  }
}

function deriveTotalBenefitsValue(benefits: DbCardRow['benefits']): number {
  return Number(
    benefits
      .reduce((sum, benefit) => sum + (benefit.estimatedValue != null ? Number(benefit.estimatedValue) : 0), 0)
      .toFixed(2)
  );
}

const plannerBenefitCategorySet = new Set<string>([
  'TRAVEL_CREDITS',
  'DINING_CREDITS',
  'STREAMING_CREDITS',
  'TSA_GLOBAL_ENTRY'
]);

const plannerBenefitNameAllowlist = [
  /anniversary bonus miles/i,
  /hotel credit/i,
  /uber cash/i,
  /resy/i,
  /\bdunkin/i
];

const plannerBenefitNameBlocklist = [
  /dashpass/i,
  /membership/i,
  /lyft pink/i,
  /instacart/i,
  /\blounge\b/i,
  /priority pass/i,
  /\bstatus\b/i,
  /\belite\b/i,
  /concierge/i
];

const plannerBenefitCategoryMultipliers: Record<string, number> = {
  TRAVEL_CREDITS: 0.9,
  DINING_CREDITS: 0.8,
  STREAMING_CREDITS: 0.75,
  TSA_GLOBAL_ENTRY: 1
};

const plannerBenefitNameMultipliers: Array<[RegExp, number]> = [
  [/airline fee credit/i, 0.6],
  [/hotel credit/i, 0.6],
  [/resy/i, 0.65],
  [/\bdunkin/i, 0.8],
  [/uber cash/i, 0.8],
  [/anniversary bonus miles/i, 0.9]
];

function derivePlannerBenefitRealizationMultiplier(category: string, benefitName: string): number {
  const nameMultiplier = plannerBenefitNameMultipliers.find(([pattern]) => pattern.test(benefitName))?.[1];
  if (typeof nameMultiplier === 'number') {
    return nameMultiplier;
  }

  return plannerBenefitCategoryMultipliers[category] ?? 1;
}

function derivePlannerBenefitsValue(benefits: DbCardRow['benefits']): number {
  return Number(
    benefits
      .reduce((sum, benefit) => {
        const estimatedValue = benefit.estimatedValue != null ? Number(benefit.estimatedValue) : 0;
        if (estimatedValue <= 0) return sum;

        const benefitName = benefit.name.toLowerCase();
        if (plannerBenefitNameBlocklist.some((pattern) => pattern.test(benefitName))) {
          return sum;
        }

        if (plannerBenefitNameAllowlist.some((pattern) => pattern.test(benefitName))) {
          return sum + estimatedValue * derivePlannerBenefitRealizationMultiplier(benefit.category, benefitName);
        }

        if (plannerBenefitCategorySet.has(benefit.category)) {
          return sum + estimatedValue * derivePlannerBenefitRealizationMultiplier(benefit.category, benefitName);
        }

        return sum;
      }, 0)
      .toFixed(2)
  );
}

// Map Prisma list-query rows into the compact CardRecord used by directory/search views.
export function toCardRecordFromDb(row: DbCardRow): CardRecord {
  const bestSignUpBonus = deriveBestSignUpBonus(row.signUpBonuses);

  return {
    slug: row.slug,
    name: row.name,
    issuer: row.issuer,
    imageUrl: row.imageUrl ?? undefined,
    cardType: cardTypeFromDb[row.cardType],
    rewardType: deriveRewardType(row.rewards),
    topCategories: deriveTopCategories(row.rewards),
    annualFee: Number(row.annualFee),
    creditTierMin: creditTierFromDb[row.creditScoreMin],
    headline: `${row.name} by ${row.issuer}${Number(row.annualFee) === 0 ? ' with no annual fee' : ''}`.trim(),
    description: row.description ?? undefined,
    longDescription: row.longDescription ?? undefined,
    editorRating: row.editorRating != null ? Number(row.editorRating) : undefined,
    pros: row.pros.length > 0 ? row.pros : undefined,
    cons: row.cons.length > 0 ? row.cons : undefined,
    bestSignUpBonusValue: bestSignUpBonus?.bonusValue,
    bestSignUpBonusSpendRequired: bestSignUpBonus?.spendRequired,
    bestSignUpBonusSpendPeriodDays: bestSignUpBonus?.spendPeriodDays,
    totalBenefitsValue: deriveTotalBenefitsValue(row.benefits),
    plannerBenefitsValue: derivePlannerBenefitsValue(row.benefits)
  };
}

export type CardsDataResponse = {
  cards: CardRecord[];
  source: 'db';
};

export async function getCardsData(): Promise<CardsDataResponse> {
  assertCardsDatabaseConfigured();

  const rows = await db.card.findMany({
    where: { isActive: true },
    include: { rewards: true, signUpBonuses: true, benefits: true },
    orderBy: [{ issuer: 'asc' }, { name: 'asc' }]
  });

  return {
    cards: rows.map((row) => toCardRecordFromDb(row)),
    source: 'db'
  };
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

export type DbCardDetailRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
    signUpBonuses: true;
    benefits: true;
    transferPartners: true;
  };
}>;

export function toCardDetailFromDb(row: DbCardDetailRow): CardDetail {
  const base = toCardRecordFromDb(row);

  return {
    ...base,
    network: row.network ? networkFromDb[row.network] : undefined,
    introApr: row.introApr ?? undefined,
    regularAprMin: row.regularAprMin != null ? Number(row.regularAprMin) : undefined,
    regularAprMax: row.regularAprMax != null ? Number(row.regularAprMax) : undefined,
    foreignTxFee: Number(row.foreignTxFee),
    applyUrl: row.applyUrl ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
    rewards: row.rewards.map((r) => ({
      category: spendingCategoryFromDb[r.category] ?? 'other',
      rate: Number(r.rate),
      rateType: rateTypeFromDb[r.rateType] ?? 'cashback',
      capAmount: r.capAmount != null ? Number(r.capAmount) : undefined,
      capPeriod: r.capPeriod ?? undefined,
      isRotating: r.isRotating ?? undefined,
      notes: r.notes ?? undefined
    })),
    signUpBonuses: row.signUpBonuses.map((b) => ({
      bonusValue: Number(b.bonusValue),
      bonusType: b.bonusType,
      displayHeadline: b.displayHeadline ?? undefined,
      displayDescription: b.displayDescription ?? undefined,
      bonusPoints: b.bonusPoints ?? undefined,
      spendRequired: Number(b.spendRequired),
      spendPeriodDays: b.spendPeriodDays,
      isCurrentOffer: b.isCurrentOffer
    })),
    benefits: row.benefits.map((b) => ({
      category: b.category.toLowerCase().replace(/_/g, ' '),
      name: b.name,
      description: b.description,
      estimatedValue: b.estimatedValue != null ? Number(b.estimatedValue) : undefined,
      activationMethod: b.activationMethod ?? undefined
    })),
    transferPartners: row.transferPartners.map((p) => ({
      partnerName: p.partnerName,
      partnerType: p.partnerType.toLowerCase(),
      transferRatio: Number(p.transferRatio)
    }))
  };
}

// Fetch one active card by slug and map it to API/page detail shape.
export async function getCardBySlug(slug: string): Promise<CardDetail | null> {
  assertCardsDatabaseConfigured();

  const row = await db.card.findFirst({
    where: { slug, isActive: true },
    include: {
      rewards: true,
      signUpBonuses: true,
      benefits: true,
      transferPartners: true
    }
  });

  return row ? toCardDetailFromDb(row) : null;
}

// Used by static params and route generation to enumerate active card pages.
export async function getAllCardSlugs(): Promise<string[]> {
  assertCardsDatabaseConfigured();

  const rows = await db.card.findMany({
    where: { isActive: true },
    select: { slug: true }
  });
  return rows.map((r) => r.slug);
}
