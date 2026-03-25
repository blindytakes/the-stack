import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { filterCards, paginateCards, cardsQuerySchema, toCardRecordFromDb, toCardDetailFromDb } from '../cards';
import type { CardRecord, DbCardRow, DbCardDetailRow } from '../cards';
import { cardSeedRecordSchema } from '../card-seed-schema';
import type { CardSeedRecord } from '../card-seed-schema';

/**
 * Card domain test suite.
 *
 * Covers:
 * - filter/pagination/query parsing behavior
 * - DB row -> app model mapping logic
 * - schema validation and regression cases (especially numeric zero values)
 */

/* ── Helpers ──────────────────────────────────────────────── */

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: 'test-card',
    name: 'Test Card',
    issuer: 'TestBank',
    cardType: 'personal',
    rewardType: 'cashback',
    topCategories: ['dining'],
    annualFee: 0,
    creditTierMin: 'good',
    headline: 'A test card',
    totalBenefitsValue: 0,
    plannerBenefitsValue: 0,
    ...overrides
  };
}

function makeSeed(overrides: Partial<CardSeedRecord> = {}): CardSeedRecord {
  return {
    slug: 'test-card',
    name: 'Test Card',
    issuer: 'TestBank',
    rewardType: 'cashback',
    topCategories: ['dining'],
    annualFee: 0,
    creditTierMin: 'good',
    headline: 'A test card',
    ...overrides
  };
}

/* ── Zero-value preservation (regression) ─────────────────── */

describe('zero-value preservation in seed schema', () => {
  it('accepts editorRating of 0', () => {
    const seed = makeSeed({ editorRating: 0 });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.editorRating).toBe(0);
    }
  });

  it('accepts annualFee of 0', () => {
    const seed = makeSeed({ annualFee: 0 });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.annualFee).toBe(0);
    }
  });

  it('accepts regularAprMin of 0', () => {
    const seed = makeSeed({ regularAprMin: 0, regularAprMax: 29.99 });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.regularAprMin).toBe(0);
      expect(parsed.data.regularAprMax).toBe(29.99);
    }
  });

  it('accepts foreignTxFee of 0', () => {
    const seed = makeSeed({ foreignTxFee: 0 });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.foreignTxFee).toBe(0);
    }
  });

  it('preserves reward capAmount of 0', () => {
    const seed = makeSeed({
      rewards: [
        { category: 'dining', rate: 3, rateType: 'cashback', capAmount: 0 }
      ]
    });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rewards![0].capAmount).toBe(0);
    }
  });

  it('preserves benefit estimatedValue of 0', () => {
    const seed = makeSeed({
      benefits: [
        { category: 'travel', name: 'Free thing', description: 'Free', estimatedValue: 0 }
      ]
    });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.benefits![0].estimatedValue).toBe(0);
    }
  });

  it('preserves isRotating: false (not coerced to undefined)', () => {
    const seed = makeSeed({
      rewards: [
        { category: 'dining', rate: 3, rateType: 'cashback', isRotating: false }
      ]
    });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rewards![0].isRotating).toBe(false);
    }
  });
});

describe('seed URL safety', () => {
  it('rejects imageUrl values with non-http protocols', () => {
    const seed = makeSeed({ imageUrl: 'ftp://example.com/card.png' });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(false);
  });

  it('rejects applyUrl values with non-http protocols', () => {
    const seed = makeSeed({ applyUrl: 'javascript:alert(1)' });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(false);
  });

  it('rejects affiliateUrl values with non-http protocols', () => {
    const seed = makeSeed({ affiliateUrl: 'data:text/html,hello' });
    const parsed = cardSeedRecordSchema.safeParse(seed);
    expect(parsed.success).toBe(false);
  });
});

/* ── filterCards ──────────────────────────────────────────── */

describe('filterCards', () => {
  const cards: CardRecord[] = [
    makeCard({ slug: 'a', issuer: 'Alpha', annualFee: 0, topCategories: ['dining'] }),
    makeCard({ slug: 'b', issuer: 'Beta', annualFee: 95, topCategories: ['travel'] }),
    makeCard({ slug: 'c', issuer: 'Alpha', annualFee: 550, topCategories: ['groceries', 'dining'] })
  ];

  it('returns all cards when no filters', () => {
    const result = filterCards(cards, { limit: 20, offset: 0 });
    expect(result).toHaveLength(3);
  });

  it('filters by issuer (case-insensitive)', () => {
    const result = filterCards(cards, { issuer: 'alpha', limit: 20, offset: 0 });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.issuer === 'Alpha')).toBe(true);
  });

  it('filters by category', () => {
    const result = filterCards(cards, { category: 'dining', limit: 20, offset: 0 });
    expect(result).toHaveLength(2);
  });

  it('filters by maxFee', () => {
    const result = filterCards(cards, { maxFee: 95, limit: 20, offset: 0 });
    expect(result).toHaveLength(2);
  });

  it('maxFee of 0 only returns free cards', () => {
    const result = filterCards(cards, { maxFee: 0, limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('a');
  });

  it('combines multiple filters', () => {
    const result = filterCards(cards, { issuer: 'alpha', maxFee: 100, limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('a');
  });
});

/* ── paginateCards ────────────────────────────────────────── */

describe('paginateCards', () => {
  const cards = Array.from({ length: 10 }, (_, i) =>
    makeCard({ slug: `card-${i}` })
  );

  it('returns first page', () => {
    const result = paginateCards(cards, { limit: 3, offset: 0 });
    expect(result).toHaveLength(3);
    expect(result[0].slug).toBe('card-0');
  });

  it('returns offset page', () => {
    const result = paginateCards(cards, { limit: 3, offset: 3 });
    expect(result).toHaveLength(3);
    expect(result[0].slug).toBe('card-3');
  });

  it('returns partial last page', () => {
    const result = paginateCards(cards, { limit: 3, offset: 9 });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('card-9');
  });

  it('returns empty for out-of-range offset', () => {
    const result = paginateCards(cards, { limit: 3, offset: 20 });
    expect(result).toHaveLength(0);
  });
});

/* ── cardsQuerySchema ─────────────────────────────────────── */

describe('cardsQuerySchema', () => {
  it('applies defaults for limit and offset', () => {
    const parsed = cardsQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(20);
      expect(parsed.data.offset).toBe(0);
    }
  });

  it('coerces string numbers', () => {
    const parsed = cardsQuerySchema.safeParse({ limit: '5', offset: '10', maxFee: '95' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(5);
      expect(parsed.data.offset).toBe(10);
      expect(parsed.data.maxFee).toBe(95);
    }
  });

  it('rejects negative maxFee', () => {
    const parsed = cardsQuerySchema.safeParse({ maxFee: '-1' });
    expect(parsed.success).toBe(false);
  });

  it('rejects limit above 100', () => {
    const parsed = cardsQuerySchema.safeParse({ limit: '200' });
    expect(parsed.success).toBe(false);
  });
});

/* ── DB mapper helpers ──────────────────────────────────────── */

const now = new Date();

function makeDbCardRow(overrides: Partial<DbCardRow> = {}): DbCardRow {
  return {
    id: 'test-id',
    slug: 'test-card',
    issuer: 'TestBank',
    name: 'Test Card',
    cardType: 'PERSONAL',
    network: null,
    description: null,
    longDescription: null,
    annualFee: new Prisma.Decimal(0),
    introApr: null,
    regularAprMin: null,
    regularAprMax: null,
    creditScoreMin: 'GOOD',
    foreignTxFee: new Prisma.Decimal(0),
    editorRating: null,
    imageUrl: null,
    applyUrl: null,
    affiliateUrl: null,
    isActive: true,
    lastVerified: now,
    createdAt: now,
    updatedAt: now,
    pros: [],
    cons: [],
    rewards: [],
    signUpBonuses: [],
    benefits: [],
    ...overrides
  };
}

function makeDbCardDetailRow(overrides: Partial<DbCardDetailRow> = {}): DbCardDetailRow {
  const base = makeDbCardRow(overrides);
  return {
    ...base,
    signUpBonuses: [],
    benefits: [],
    transferPartners: [],
    ...overrides
  } as DbCardDetailRow;
}

/* ── toCardRecordFromDb (DB mapper regression) ──────────────── */

describe('toCardRecordFromDb', () => {
  it('maps basic fields correctly', () => {
    const row = makeDbCardRow();
    const result = toCardRecordFromDb(row);
    expect(result.slug).toBe('test-card');
    expect(result.name).toBe('Test Card');
    expect(result.issuer).toBe('TestBank');
    expect(result.cardType).toBe('personal');
    expect(result.creditTierMin).toBe('good');
  });

  it('preserves editorRating of 0 (not coerced to undefined)', () => {
    const row = makeDbCardRow({ editorRating: new Prisma.Decimal(0) });
    const result = toCardRecordFromDb(row);
    expect(result.editorRating).toBe(0);
  });

  it('preserves editorRating with positive value', () => {
    const row = makeDbCardRow({ editorRating: new Prisma.Decimal(4.5) });
    const result = toCardRecordFromDb(row);
    expect(result.editorRating).toBe(4.5);
  });

  it('returns undefined for null editorRating', () => {
    const row = makeDbCardRow({ editorRating: null });
    const result = toCardRecordFromDb(row);
    expect(result.editorRating).toBeUndefined();
  });

  it('converts annualFee of 0 to number 0', () => {
    const row = makeDbCardRow({ annualFee: new Prisma.Decimal(0) });
    const result = toCardRecordFromDb(row);
    expect(result.annualFee).toBe(0);
  });

  it('returns undefined for null description/longDescription', () => {
    const row = makeDbCardRow({ description: null, longDescription: null });
    const result = toCardRecordFromDb(row);
    expect(result.description).toBeUndefined();
    expect(result.longDescription).toBeUndefined();
  });

  it('maps imageUrl when present', () => {
    const row = makeDbCardRow({ imageUrl: 'https://assets.example.com/test-card.png' });
    const result = toCardRecordFromDb(row);
    expect(result.imageUrl).toBe('https://assets.example.com/test-card.png');
  });

  it('falls back to an issuer image when card art is missing for a known issuer', () => {
    const row = makeDbCardRow({ issuer: 'Chase', imageUrl: null });
    const result = toCardRecordFromDb(row);
    expect(result.imageUrl).toBe(
      'https://www.chase.com/etc/designs/chase-ux/favicon-152.png'
    );
  });

  it('derives rewardType from first reward rateType', () => {
    const row = makeDbCardRow({
      rewards: [
        {
          id: 'r1', cardId: 'test-id', category: 'TRAVEL', rate: new Prisma.Decimal(3),
          rateType: 'MILES', capAmount: null, capPeriod: null, isRotating: false,
          rotationQuarter: null, notes: null
        }
      ]
    });
    const result = toCardRecordFromDb(row);
    expect(result.rewardType).toBe('miles');
  });

  it('defaults rewardType to cashback when no rewards exist', () => {
    const row = makeDbCardRow({ rewards: [] });
    const result = toCardRecordFromDb(row);
    expect(result.rewardType).toBe('cashback');
  });

  it('maps best current sign-up bonus fields when available', () => {
    const row = makeDbCardRow({
      signUpBonuses: [
        {
          id: 's1',
          cardId: 'test-id',
          bonusValue: new Prisma.Decimal(500),
          bonusType: 'points',
          displayHeadline: null,
          displayDescription: null,
          bonusPoints: 50000,
          spendRequired: new Prisma.Decimal(3000),
          spendPeriodDays: 90,
          isCurrentOffer: true,
          expiresAt: null,
          createdAt: now
        },
        {
          id: 's2',
          cardId: 'test-id',
          bonusValue: new Prisma.Decimal(750),
          bonusType: 'points',
          displayHeadline: null,
          displayDescription: null,
          bonusPoints: 75000,
          spendRequired: new Prisma.Decimal(4000),
          spendPeriodDays: 90,
          isCurrentOffer: true,
          expiresAt: null,
          createdAt: now
        }
      ]
    });
    const result = toCardRecordFromDb(row);
    expect(result.bestSignUpBonusValue).toBe(750);
    expect(result.bestSignUpBonusSpendRequired).toBe(4000);
    expect(result.bestSignUpBonusSpendPeriodDays).toBe(90);
  });

  it('breaks equal-value sign-up bonus ties deterministically by id', () => {
    const row = makeDbCardRow({
      signUpBonuses: [
        {
          id: 'bonus-b',
          cardId: 'test-id',
          bonusValue: new Prisma.Decimal(750),
          bonusType: 'points',
          displayHeadline: null,
          displayDescription: null,
          bonusPoints: 75000,
          spendRequired: new Prisma.Decimal(5000),
          spendPeriodDays: 120,
          isCurrentOffer: true,
          expiresAt: null,
          createdAt: now
        },
        {
          id: 'bonus-a',
          cardId: 'test-id',
          bonusValue: new Prisma.Decimal(750),
          bonusType: 'points',
          displayHeadline: null,
          displayDescription: null,
          bonusPoints: 75000,
          spendRequired: new Prisma.Decimal(4000),
          spendPeriodDays: 90,
          isCurrentOffer: true,
          expiresAt: null,
          createdAt: now
        }
      ]
    });

    const result = toCardRecordFromDb(row);

    expect(result.bestSignUpBonusValue).toBe(750);
    expect(result.bestSignUpBonusSpendRequired).toBe(4000);
    expect(result.bestSignUpBonusSpendPeriodDays).toBe(90);
  });

  it('derives separate total and conservative planner benefit values', () => {
    const row = makeDbCardRow({
      benefits: [
        {
          id: 'b1',
          cardId: 'test-id',
          category: 'TRAVEL_CREDITS',
          name: 'Travel credit',
          description: 'Annual travel credit',
          estimatedValue: new Prisma.Decimal(300),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b2',
          cardId: 'test-id',
          category: 'OTHER',
          name: 'Status benefit',
          description: 'Elite status',
          estimatedValue: new Prisma.Decimal(75.5),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b3',
          cardId: 'test-id',
          category: 'CELL_PHONE',
          name: 'Cell Phone Protection',
          description: 'Insurance benefit',
          estimatedValue: new Prisma.Decimal(100),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b3',
          cardId: 'test-id',
          category: 'DINING_CREDITS',
          name: 'DoorDash DashPass Membership',
          description: 'Membership benefit',
          estimatedValue: new Prisma.Decimal(96),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b4',
          cardId: 'test-id',
          category: 'OTHER',
          name: 'Uber Cash',
          description: 'Monthly Uber credit',
          estimatedValue: new Prisma.Decimal(120),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b5',
          cardId: 'test-id',
          category: 'OTHER',
          name: '$50 Annual Hotel Credit',
          description: 'Portal hotel credit',
          estimatedValue: new Prisma.Decimal(50),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b5',
          cardId: 'test-id',
          category: 'CONCIERGE',
          name: 'Concierge',
          description: 'Unpriced benefit',
          estimatedValue: null,
          activationMethod: null,
          finePrint: null
        }
      ]
    });

    const result = toCardRecordFromDb(row);
    expect(result.totalBenefitsValue).toBe(741.5);
    expect(result.plannerBenefitsValue).toBe(396);
  });

  it('applies realization haircuts to restrictive planner benefits', () => {
    const row = makeDbCardRow({
      benefits: [
        {
          id: 'b1',
          cardId: 'test-id',
          category: 'TRAVEL_CREDITS',
          name: '$200 Airline Fee Credit',
          description: 'Incidental airline credit',
          estimatedValue: new Prisma.Decimal(200),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b2',
          cardId: 'test-id',
          category: 'STREAMING_CREDITS',
          name: '$300 Digital Entertainment Credit',
          description: 'Streaming credit',
          estimatedValue: new Prisma.Decimal(300),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b3',
          cardId: 'test-id',
          category: 'DINING_CREDITS',
          name: '$400 Resy Credit',
          description: 'Dining credit',
          estimatedValue: new Prisma.Decimal(400),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b4',
          cardId: 'test-id',
          category: 'TSA_GLOBAL_ENTRY',
          name: 'Global Entry Credit',
          description: 'Application fee credit',
          estimatedValue: new Prisma.Decimal(30),
          activationMethod: null,
          finePrint: null
        },
        {
          id: 'b5',
          cardId: 'test-id',
          category: 'OTHER',
          name: '10,000 Anniversary Bonus Miles',
          description: 'Anniversary miles',
          estimatedValue: new Prisma.Decimal(100),
          activationMethod: null,
          finePrint: null
        }
      ]
    });

    const result = toCardRecordFromDb(row);
    expect(result.totalBenefitsValue).toBe(1030);
    expect(result.plannerBenefitsValue).toBe(725);
  });
});

/* ── toCardDetailFromDb (DB mapper regression) ──────────────── */

describe('toCardDetailFromDb', () => {
  it('preserves regularAprMin of 0 (not coerced to undefined)', () => {
    const row = makeDbCardDetailRow({
      regularAprMin: new Prisma.Decimal(0),
      regularAprMax: new Prisma.Decimal(29.99)
    });
    const result = toCardDetailFromDb(row);
    expect(result.regularAprMin).toBe(0);
    expect(result.regularAprMax).toBe(29.99);
  });

  it('returns undefined for null regularAprMin/Max', () => {
    const row = makeDbCardDetailRow({ regularAprMin: null, regularAprMax: null });
    const result = toCardDetailFromDb(row);
    expect(result.regularAprMin).toBeUndefined();
    expect(result.regularAprMax).toBeUndefined();
  });

  it('preserves reward capAmount of 0 (not coerced to undefined)', () => {
    const row = makeDbCardDetailRow({
      rewards: [
        {
          id: 'r1', cardId: 'test-id', category: 'DINING', rate: new Prisma.Decimal(3),
          rateType: 'CASHBACK', capAmount: new Prisma.Decimal(0), capPeriod: 'monthly',
          isRotating: false, rotationQuarter: null, notes: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.rewards[0].capAmount).toBe(0);
  });

  it('preserves reward capAmount with positive value', () => {
    const row = makeDbCardDetailRow({
      rewards: [
        {
          id: 'r1', cardId: 'test-id', category: 'DINING', rate: new Prisma.Decimal(3),
          rateType: 'CASHBACK', capAmount: new Prisma.Decimal(500), capPeriod: 'quarterly',
          isRotating: false, rotationQuarter: null, notes: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.rewards[0].capAmount).toBe(500);
  });

  it('returns undefined for null reward capAmount', () => {
    const row = makeDbCardDetailRow({
      rewards: [
        {
          id: 'r1', cardId: 'test-id', category: 'DINING', rate: new Prisma.Decimal(3),
          rateType: 'CASHBACK', capAmount: null, capPeriod: null,
          isRotating: false, rotationQuarter: null, notes: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.rewards[0].capAmount).toBeUndefined();
  });

  it('preserves isRotating: false (not coerced to undefined)', () => {
    const row = makeDbCardDetailRow({
      rewards: [
        {
          id: 'r1', cardId: 'test-id', category: 'DINING', rate: new Prisma.Decimal(3),
          rateType: 'CASHBACK', capAmount: null, capPeriod: null,
          isRotating: false, rotationQuarter: null, notes: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.rewards[0].isRotating).toBe(false);
  });

  it('preserves benefit estimatedValue of 0 (not coerced to undefined)', () => {
    const row = makeDbCardDetailRow({
      benefits: [
        {
          id: 'b1', cardId: 'test-id', category: 'TRAVEL_CREDITS',
          name: 'Free Bag', description: 'First bag free',
          estimatedValue: new Prisma.Decimal(0), activationMethod: null, finePrint: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.benefits[0].estimatedValue).toBe(0);
  });

  it('returns undefined for null benefit estimatedValue', () => {
    const row = makeDbCardDetailRow({
      benefits: [
        {
          id: 'b1', cardId: 'test-id', category: 'PURCHASE_PROTECTION',
          name: 'Purchase Protection', description: 'Covers damage',
          estimatedValue: null, activationMethod: null, finePrint: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.benefits[0].estimatedValue).toBeUndefined();
  });

  it('maps foreignTxFee of 0 correctly', () => {
    const row = makeDbCardDetailRow({ foreignTxFee: new Prisma.Decimal(0) });
    const result = toCardDetailFromDb(row);
    expect(result.foreignTxFee).toBe(0);
  });

  it('maps network from DB enum', () => {
    const row = makeDbCardDetailRow({ network: 'VISA' });
    const result = toCardDetailFromDb(row);
    expect(result.network).toBe('visa');
  });

  it('maps transfer partners correctly', () => {
    const row = makeDbCardDetailRow({
      transferPartners: [
        {
          id: 'tp1', cardId: 'test-id', partnerName: 'United',
          partnerType: 'AIRLINE', transferRatio: new Prisma.Decimal(1),
          bonusMultiplier: null, bonusExpiresAt: null
        }
      ]
    });
    const result = toCardDetailFromDb(row);
    expect(result.transferPartners).toHaveLength(1);
    expect(result.transferPartners[0].partnerName).toBe('United');
    expect(result.transferPartners[0].partnerType).toBe('airline');
    expect(result.transferPartners[0].transferRatio).toBe(1);
  });

  it('maps sign-up bonus display overrides when present', () => {
    const row = makeDbCardDetailRow({
      signUpBonuses: [
        {
          id: 'bonus-display',
          cardId: 'test-id',
          bonusValue: new Prisma.Decimal(1750),
          bonusType: 'points',
          displayHeadline: 'Up to 175,000 Membership Rewards points',
          displayDescription:
            'Offer varies by channel and eligibility. See issuer site for your current welcome offer.',
          bonusPoints: 175000,
          spendRequired: new Prisma.Decimal(0),
          spendPeriodDays: 90,
          isCurrentOffer: true,
          expiresAt: null,
          createdAt: now
        }
      ]
    });

    const result = toCardDetailFromDb(row);

    expect(result.signUpBonuses[0]).toMatchObject({
      displayHeadline: 'Up to 175,000 Membership Rewards points',
      displayDescription:
        'Offer varies by channel and eligibility. See issuer site for your current welcome offer.'
    });
  });

  it('provides fallback benefits when no card-specific benefits exist yet', () => {
    const row = makeDbCardDetailRow({
      slug: 'apple-card',
      issuer: 'Apple',
      name: 'Apple Card',
      annualFee: new Prisma.Decimal(0),
      foreignTxFee: new Prisma.Decimal(0),
      benefits: []
    });

    const result = toCardDetailFromDb(row);

    expect(result.benefits.map((benefit) => benefit.name)).toEqual(
      expect.arrayContaining(['Daily Cash Ecosystem', 'Apple Card Monthly Installments'])
    );
  });
});
