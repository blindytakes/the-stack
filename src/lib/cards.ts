import { z } from 'zod';
import { CreditTier, type Prisma } from '@prisma/client';
import cardsJson from '../../content/cards/cards.json';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cardsSeedDatasetSchema, type CardSeedRecord } from '@/lib/card-seed-schema';
export type CardRecord = Pick<
  CardSeedRecord,
  | 'slug'
  | 'name'
  | 'issuer'
  | 'rewardType'
  | 'topCategories'
  | 'annualFee'
  | 'creditTierMin'
  | 'headline'
>;

export function getCardsSeedData(): CardSeedRecord[] {
  return cardsSeedDatasetSchema.parse(cardsJson);
}

function getCardsSeedDataSafe(): CardSeedRecord[] | null {
  const parsed = cardsSeedDatasetSchema.safeParse(cardsJson);
  if (!parsed.success) {
    console.error('[cards] seed json parse failed', parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

export function getCardsData(): CardRecord[] {
  return getCardsSeedData().map((card) => ({
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    rewardType: card.rewardType,
    topCategories: card.topCategories,
    annualFee: card.annualFee,
    creditTierMin: card.creditTierMin,
    headline: card.headline
  }));
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

function toCardRecordFromDb(row: DbCardRow, seedBySlug: Map<string, CardSeedRecord>): CardRecord | null {
  const seed = seedBySlug.get(row.slug);
  const derivedRewardType: CardRecord['rewardType'] =
    row.rewards[0]?.rateType === 'POINTS'
      ? 'points'
      : row.rewards[0]?.rateType === 'MILES'
        ? 'miles'
        : 'cashback';

  const derivedTopCategories =
    row.rewards.map((reward) => reward.category).filter(Boolean).length > 0
      ? row.rewards.map((reward) => reward.category)
      : ['all'];

  return {
    slug: row.slug,
    name: row.name,
    issuer: row.issuer,
    rewardType: seed?.rewardType ?? derivedRewardType,
    topCategories: seed?.topCategories ?? derivedTopCategories,
    annualFee: Number(row.annualFee),
    creditTierMin: creditTierFromDb[row.creditScoreMin],
    headline:
      seed?.headline ??
      `${row.name} by ${row.issuer}${Number(row.annualFee) === 0 ? ' with no annual fee' : ''}`.trim()
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
    return {
      cards: seedCards.map((card) => ({
        slug: card.slug,
        name: card.name,
        issuer: card.issuer,
        rewardType: card.rewardType,
        topCategories: card.topCategories,
        annualFee: card.annualFee,
        creditTierMin: card.creditTierMin,
        headline: card.headline
      })),
      source: 'json'
    };
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

  return {
    cards: seedCards.map((card) => ({
      slug: card.slug,
      name: card.name,
      issuer: card.issuer,
      rewardType: card.rewardType,
      topCategories: card.topCategories,
      annualFee: card.annualFee,
      creditTierMin: card.creditTierMin,
      headline: card.headline
    })),
    source: 'json'
  };
}
