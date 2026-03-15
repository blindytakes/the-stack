import { db, isDatabaseConfigured } from '@/lib/db';
import { toCardDetailFromDb, toCardRecordFromDb } from '@/lib/cards/mappers';
import type { CardDetail, CardRecord } from '@/lib/cards/schema';

export type CardsDataResponse = {
  cards: CardRecord[];
  source: 'db';
};

function assertCardsDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required for card data');
  }
}

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

export async function getAllCardSlugs(): Promise<string[]> {
  assertCardsDatabaseConfigured();

  const rows = await db.card.findMany({
    where: { isActive: true },
    select: { slug: true }
  });
  return rows.map((row) => row.slug);
}
