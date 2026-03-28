import { db, isDatabaseConfigured } from '@/lib/db';
import { toCardDetailFromDb, toCardRecordFromDb } from '@/lib/cards/mappers';
import type { CardDetail, CardRecord } from '@/lib/cards/schema';

export type CardsDataResponse = {
  cards: CardRecord[];
  source: 'db';
};

type CardsDataCacheEntry = {
  value: CardsDataResponse;
  expiresAt: number;
};

declare global {
  var cardsDataCache: CardsDataCacheEntry | undefined;
}

const CARDS_DATA_CACHE_TTL_MS = 5 * 60 * 1000;
let cardsDataInFlight: Promise<CardsDataResponse> | null = null;

function assertCardsDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required for card data');
  }
}

function readCardsDataCache(now = Date.now()): CardsDataResponse | null {
  const cached = globalThis.cardsDataCache;
  if (!cached) return null;

  if (cached.expiresAt <= now) {
    globalThis.cardsDataCache = undefined;
    return null;
  }

  return cached.value;
}

function writeCardsDataCache(value: CardsDataResponse): CardsDataResponse {
  globalThis.cardsDataCache = {
    value,
    expiresAt: Date.now() + CARDS_DATA_CACHE_TTL_MS
  };

  return value;
}

async function loadCardsDataFromDb(): Promise<CardsDataResponse> {
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

export async function getCardsData(): Promise<CardsDataResponse> {
  const cached = readCardsDataCache();
  if (cached) return cached;

  if (cardsDataInFlight) {
    return cardsDataInFlight;
  }

  cardsDataInFlight = loadCardsDataFromDb()
    .then((value) => writeCardsDataCache(value))
    .finally(() => {
      cardsDataInFlight = null;
    });

  return cardsDataInFlight;
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
