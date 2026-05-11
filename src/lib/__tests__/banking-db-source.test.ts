import {
  BankingAccountType,
  BankingBonusSourceType,
  BankingCustomerType,
  Prisma
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findManyMock = vi.fn();
const findFirstMock = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    bankingBonus: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args)
    }
  }
}));

import {
  getActiveDbBankingBonuses,
  getActiveDbBankingBonusSlugs,
  getDbBankingBonusBySlug
} from '@/lib/banking/db-source';

type DbBankingBonusRow = Prisma.BankingBonusGetPayload<Record<string, never>>;

function createDbBankingBonusRow(
  overrides: Partial<DbBankingBonusRow> = {}
): DbBankingBonusRow {
  return {
    id: 'bank_1',
    slug: 'test-banking-offer',
    bankName: 'Test Bank',
    offerName: 'Test Offer',
    accountType: BankingAccountType.CHECKING,
    customerType: BankingCustomerType.PERSONAL,
    headline: 'Earn a cash bonus',
    imageUrl: 'https://example.com/logo.png',
    bonusAmount: new Prisma.Decimal(300),
    estimatedFees: new Prisma.Decimal(15),
    apyPercent: new Prisma.Decimal(4.25),
    apyDisplay: '4.25% APY',
    apySourceUrl: 'https://example.com/apy',
    apyAsOf: new Date('2026-03-01T00:00:00.000Z'),
    directDepositRequired: true,
    directDepositMinimumAmount: new Prisma.Decimal(2000),
    minimumOpeningDeposit: new Prisma.Decimal(500),
    holdingPeriodDays: 90,
    requiredActions: ['Open the account', 'Receive a direct deposit'],
    stateRestrictions: [' ca ', 'ny'],
    notes: 'Some notes',
    offerUrl: 'https://example.com/offer',
    affiliateUrl: 'https://example.com/affiliate',
    sourceType: BankingBonusSourceType.MANUAL,
    sourceLabel: null,
    confidenceScore: null,
    expiresAt: null,
    isActive: true,
    lastVerified: new Date('2026-03-15T00:00:00.000Z'),
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides
  };
}

describe('banking db source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads active DB bonuses with production query filters and maps rows to list items', async () => {
    const now = new Date('2026-04-10T00:00:00.000Z');
    findManyMock.mockResolvedValue([
      createDbBankingBonusRow({
        slug: 'lower-bonus',
        bankName: 'Lower Bank',
        bonusAmount: new Prisma.Decimal(200),
        estimatedFees: new Prisma.Decimal(0),
        offerUrl: 'https://example.com/lower'
      }),
      createDbBankingBonusRow({
        slug: 'alliant-ultimate-opportunity-savings-100',
        bankName: 'Alliant Credit Union',
        bonusAmount: new Prisma.Decimal(250),
        estimatedFees: new Prisma.Decimal(20),
        offerUrl: 'https://example.com/incorrect'
      })
    ]);

    const offers = await getActiveDbBankingBonuses(now);

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      },
      orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
    });
    expect(offers.map((offer) => offer.slug)).toEqual([
      'alliant-ultimate-opportunity-savings-100',
      'lower-bonus'
    ]);
    expect(offers[0]).toMatchObject({
      customerType: 'personal',
      accountType: 'checking',
      bonusAmount: 250,
      estimatedFees: 20,
      estimatedNetValue: 230,
      apyPercent: 4.25,
      apyAsOf: '2026-03-01',
      directDeposit: {
        required: true,
        minimumAmount: 2000
      },
      minimumOpeningDeposit: 500,
      stateRestrictions: ['CA', 'NY'],
      offerUrl: 'https://promo.alliantcreditunion.org/ultimate-opportunity-savings'
    });
  });

  it('consolidates legacy BMO business checking rows from the DB into one visible offer', async () => {
    const now = new Date('2026-05-11T00:00:00.000Z');
    findManyMock.mockResolvedValue([
      createDbBankingBonusRow({
        id: 'bmo_1',
        slug: 'bmo-digital-business-checking-1000',
        bankName: 'BMO',
        offerName: 'Digital Business Checking Bonus',
        customerType: BankingCustomerType.BUSINESS,
        bonusAmount: new Prisma.Decimal(1500),
        estimatedFees: new Prisma.Decimal(10),
        directDepositRequired: false,
        directDepositMinimumAmount: null,
        minimumOpeningDeposit: new Prisma.Decimal(100000),
        holdingPeriodDays: 90,
        requiredActions: ['Open a new BMO Digital Business Checking account'],
        offerUrl: 'https://www.bmo.com/en-us/main/business-banking/bank-accounts/bb-checking-offer/',
        expiresAt: new Date('2026-08-31T23:59:59.999-04:00'),
        lastVerified: new Date('2026-05-10T00:00:00.000Z')
      }),
      createDbBankingBonusRow({
        id: 'bmo_2',
        slug: 'bmo-elite-business-checking-1000',
        bankName: 'BMO',
        offerName: 'Elite Business Checking Bonus',
        customerType: BankingCustomerType.BUSINESS,
        bonusAmount: new Prisma.Decimal(1500),
        estimatedFees: new Prisma.Decimal(25),
        directDepositRequired: false,
        directDepositMinimumAmount: null,
        minimumOpeningDeposit: new Prisma.Decimal(100000),
        holdingPeriodDays: 90,
        requiredActions: ['Open a new BMO Elite Business Checking account'],
        offerUrl: 'https://www.bmo.com/en-us/main/business-banking/bank-accounts/bb-checking-offer/',
        expiresAt: new Date('2026-08-31T23:59:59.999-04:00'),
        lastVerified: new Date('2026-05-10T00:00:00.000Z')
      })
    ]);

    const offers = await getActiveDbBankingBonuses(now);
    const bmoOffers = offers.filter((offer) => offer.bankName === 'BMO');

    expect(bmoOffers).toHaveLength(1);
    expect(bmoOffers[0]).toMatchObject({
      slug: 'bmo-business-checking-1500',
      offerName: 'Business Checking Bonus',
      bonusAmount: 1500,
      estimatedFees: 10,
      estimatedNetValue: 1490,
      minimumOpeningDeposit: 100000,
      requiredActions: expect.arrayContaining([
        'Eligible accounts include Digital, Simple, Premium, and Elite Business Checking.'
      ])
    });
  });

  it('loads a single DB bonus by slug and preserves optional fields correctly', async () => {
    const now = new Date('2026-04-10T00:00:00.000Z');
    findFirstMock.mockResolvedValue(
      createDbBankingBonusRow({
        slug: 'db-offer',
        directDepositRequired: false,
        directDepositMinimumAmount: null,
        minimumOpeningDeposit: null,
        apyPercent: null,
        apyDisplay: null,
        apySourceUrl: null,
        apyAsOf: null,
        stateRestrictions: []
      })
    );

    const offer = await getDbBankingBonusBySlug('db-offer', now);

    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        slug: 'db-offer',
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      }
    });
    expect(offer).toMatchObject({
      slug: 'db-offer',
      directDeposit: { required: false },
      minimumOpeningDeposit: undefined,
      apyPercent: undefined,
      stateRestrictions: undefined
    });
  });

  it('uses curated APY source URLs for banking offers with issuer redirects', async () => {
    const now = new Date('2026-04-10T00:00:00.000Z');
    findFirstMock.mockResolvedValue(
      createDbBankingBonusRow({
        slug: 'key-select-checking-500',
        apySourceUrl:
          'https://www.key.com/content/kco/us/en/personal/checking/key-select-checking-account.html'
      })
    );

    const offer = await getDbBankingBonusBySlug('key-select-checking-500', now);

    expect(offer?.apySourceUrl).toBe(
      'https://www.key.com/personal/checking/key-select-checking-account.html'
    );
  });

  it('loads active DB slugs using the same production query filter', async () => {
    const now = new Date('2026-04-10T00:00:00.000Z');
    findManyMock.mockResolvedValue([{ slug: 'offer-a' }, { slug: 'offer-b' }]);

    const slugs = await getActiveDbBankingBonusSlugs(now);

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      },
      select: { slug: true }
    });
    expect(slugs).toEqual(['offer-a', 'offer-b']);
  });

  it('consolidates legacy BMO business checking slugs from the DB', async () => {
    const now = new Date('2026-05-11T00:00:00.000Z');
    findManyMock.mockResolvedValue([
      { slug: 'bmo-digital-business-checking-1000' },
      { slug: 'bmo-simple-business-checking-1000' },
      { slug: 'other-offer' }
    ]);

    const slugs = await getActiveDbBankingBonusSlugs(now);

    expect(slugs).toEqual(['other-offer', 'bmo-business-checking-1500']);
  });

  it('can resolve the consolidated BMO business checking detail from legacy DB rows', async () => {
    const now = new Date('2026-05-11T00:00:00.000Z');
    findFirstMock.mockResolvedValue(null);
    findManyMock.mockResolvedValue([
      createDbBankingBonusRow({
        id: 'bmo_1',
        slug: 'bmo-simple-business-checking-1000',
        bankName: 'BMO',
        offerName: 'Simple Business Checking Bonus',
        customerType: BankingCustomerType.BUSINESS,
        bonusAmount: new Prisma.Decimal(1500),
        estimatedFees: new Prisma.Decimal(10),
        directDepositRequired: false,
        directDepositMinimumAmount: null,
        minimumOpeningDeposit: new Prisma.Decimal(100000),
        holdingPeriodDays: 90,
        requiredActions: ['Open a new BMO Simple Business Checking account'],
        offerUrl: 'https://www.bmo.com/en-us/main/business-banking/bank-accounts/bb-checking-offer/',
        expiresAt: new Date('2026-08-31T23:59:59.999-04:00'),
        lastVerified: new Date('2026-05-10T00:00:00.000Z')
      })
    ]);

    const offer = await getDbBankingBonusBySlug('bmo-business-checking-1500', now);

    expect(offer?.slug).toBe('bmo-business-checking-1500');
    expect(offer?.offerName).toBe('Business Checking Bonus');
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        slug: 'bmo-business-checking-1500',
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      }
    });
    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      },
      orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
    });
  });
});
