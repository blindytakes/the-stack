import { BankingAccountType, BankingCustomerType, type Prisma } from '@prisma/client';
import { getNodeEnv } from '@/lib/config/runtime';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { bankingBonusesSeedDatasetSchema } from '@/lib/banking-bonus-seed-schema';
import { db, isDatabaseConfigured } from '@/lib/db';
import type {
  BankingBonusListItem,
  BankingBonusRecord,
  BankingBonusesDataSource
} from '@/lib/banking/schema';

type BankingBonusesDataResponse = {
  bonuses: BankingBonusListItem[];
  source: BankingBonusesDataSource;
};

type BankingBonusesCacheEntry = {
  value: BankingBonusesDataResponse;
  expiresAt: number;
};

declare global {
  var bankingBonusesDataCache: BankingBonusesCacheEntry | undefined;
}

const BANKING_BONUSES_CACHE_TTL_MS = 5 * 60 * 1000;
let bankingBonusesInFlight: Promise<BankingBonusesDataResponse> | null = null;

const curatedOfferUrlBySlug: Record<string, string> = {
  'alliant-ultimate-opportunity-savings-100':
    'https://promo.alliantcreditunion.org/ultimate-opportunity-savings'
};

const bankingBonusSeedData = bankingBonusesSeedDatasetSchema.parse([
  {
    slug: 'summit-national-checking-300',
    bankName: 'Summit National Bank',
    offerName: 'Smart Checking Bonus',
    accountType: 'checking',
    headline: 'Earn $300 after qualifying direct deposits and keeping the account open.',
    bonusAmount: 300,
    estimatedFees: 12,
    directDeposit: {
      required: true,
      minimumAmount: 1000
    },
    holdingPeriodDays: 180,
    requiredActions: [
      'Receive one or more qualifying direct deposits within 90 days.',
      'Keep the account open through the payout date.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/summit-national-checking-300',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'harbor-federal-checking-savings-500',
    bankName: 'Harbor Federal',
    offerName: 'Checking + Savings Bundle',
    accountType: 'bundle',
    headline: 'Up to $500 total bonus for opening and funding both accounts.',
    bonusAmount: 500,
    estimatedFees: 25,
    directDeposit: {
      required: true,
      minimumAmount: 1500
    },
    minimumOpeningDeposit: 2500,
    holdingPeriodDays: 120,
    requiredActions: [
      'Open both checking and savings accounts in the same application.',
      'Maintain the minimum combined balance during the qualifying window.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/harbor-federal-checking-savings-500',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'atlas-online-savings-250',
    bankName: 'Atlas Online Bank',
    offerName: 'High-Yield Savings Bonus',
    accountType: 'savings',
    headline: 'Earn $250 for depositing fresh funds and maintaining balance targets.',
    bonusAmount: 250,
    estimatedFees: 0,
    minimumOpeningDeposit: 15000,
    holdingPeriodDays: 90,
    requiredActions: [
      'Deposit qualifying new funds within 30 days of opening.',
      'Maintain minimum required balance until bonus posts.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/atlas-online-savings-250',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'maple-street-checking-225',
    bankName: 'Maple Street Bank',
    offerName: 'Everyday Checking Bonus',
    accountType: 'checking',
    headline: 'Earn $225 after qualifying card activity and direct deposits.',
    bonusAmount: 225,
    estimatedFees: 10,
    directDeposit: {
      required: true,
      minimumAmount: 750
    },
    holdingPeriodDays: 120,
    requiredActions: [
      'Complete 10 debit card purchases in the first 60 days.',
      'Receive qualifying direct deposit activity.'
    ],
    stateRestrictions: ['CA', 'OR', 'WA'],
    offerUrl: 'https://www.thestackhq.com/banking/maple-street-checking-225',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'granite-state-checking-150',
    bankName: 'Granite State Credit Union',
    offerName: 'Starter Checking Bonus',
    accountType: 'checking',
    headline: 'Simple $150 starter bonus with low friction requirements.',
    bonusAmount: 150,
    estimatedFees: 0,
    directDeposit: {
      required: false
    },
    holdingPeriodDays: 60,
    requiredActions: ['Enroll in e-statements and complete five debit transactions.'],
    offerUrl: 'https://www.thestackhq.com/banking/granite-state-checking-150',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'oak-legacy-checking-300-legacy',
    bankName: 'Oak Legacy Bank',
    offerName: 'Legacy Checking Promotion',
    accountType: 'checking',
    headline: 'Legacy campaign retained for historical comparison only.',
    bonusAmount: 300,
    estimatedFees: 30,
    directDeposit: {
      required: true,
      minimumAmount: 2000
    },
    holdingPeriodDays: 180,
    requiredActions: ['Receive qualifying payroll direct deposit.'],
    offerUrl: 'https://www.thestackhq.com/banking/oak-legacy-checking-300-legacy',
    isActive: false,
    lastVerified: '2025-12-01T00:00:00.000Z'
  }
]);

const accountTypeFromDb: Record<BankingAccountType, BankingBonusRecord['accountType']> = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  BUNDLE: 'bundle'
};

const customerTypeFromDb: Record<BankingCustomerType, BankingBonusRecord['customerType']> = {
  PERSONAL: 'personal',
  BUSINESS: 'business'
};

type DbBankingBonusRow = Prisma.BankingBonusGetPayload<Record<string, never>>;

function sortByBonusAmountDesc<T extends BankingBonusListItem>(bonuses: T[]): T[] {
  // Keep the repository default ordering local so loading stays independent from list/query helpers.
  return [...bonuses].sort(
    (a, b) => b.bonusAmount - a.bonusAmount || b.estimatedNetValue - a.estimatedNetValue
  );
}

function isOfferExpired(expiresAt?: string, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}

export function resolveBankingOfferUrl(slug: string, offerUrl?: string) {
  return curatedOfferUrlBySlug[slug] ?? offerUrl;
}

function toListItem(record: BankingBonusRecord): BankingBonusListItem {
  return {
    ...record,
    imageUrl: resolveBankingBrandImageUrl(record.bankName, record.imageUrl),
    offerUrl: resolveBankingOfferUrl(record.slug, record.offerUrl),
    estimatedNetValue: Number((record.bonusAmount - record.estimatedFees).toFixed(2))
  };
}

function toRecordFromDb(row: DbBankingBonusRow): BankingBonusRecord {
  const stateRestrictions = row.stateRestrictions.map((state) => state.trim().toUpperCase());

  return {
    slug: row.slug,
    bankName: row.bankName,
    offerName: row.offerName,
    accountType: accountTypeFromDb[row.accountType],
    customerType: customerTypeFromDb[row.customerType],
    headline: row.headline,
    imageUrl: row.imageUrl ?? undefined,
    bonusAmount: Number(row.bonusAmount),
    estimatedFees: Number(row.estimatedFees),
    apyPercent: row.apyPercent != null ? Number(row.apyPercent) : undefined,
    apyDisplay: row.apyDisplay ?? undefined,
    apySourceUrl: row.apySourceUrl ?? undefined,
    apyAsOf: row.apyAsOf ? row.apyAsOf.toISOString().slice(0, 10) : undefined,
    directDeposit: {
      required: row.directDepositRequired,
      ...(row.directDepositRequired && row.directDepositMinimumAmount != null
        ? { minimumAmount: Number(row.directDepositMinimumAmount) }
        : {})
    },
    minimumOpeningDeposit:
      row.minimumOpeningDeposit != null ? Number(row.minimumOpeningDeposit) : undefined,
    holdingPeriodDays: row.holdingPeriodDays ?? undefined,
    requiredActions: row.requiredActions,
    stateRestrictions: stateRestrictions.length > 0 ? stateRestrictions : undefined,
    notes: row.notes ?? undefined,
    offerUrl: row.offerUrl ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
    isActive: row.isActive,
    expiresAt: row.expiresAt?.toISOString(),
    lastVerified: row.lastVerified.toISOString()
  };
}

function getActiveSeedBankingBonuses(): BankingBonusListItem[] {
  return sortByBonusAmountDesc(
    bankingBonusSeedData
      .filter((record) => record.isActive && !isOfferExpired(record.expiresAt))
      .map(toListItem)
  );
}

function shouldUseDbSource(): boolean {
  if (!isDatabaseConfigured()) return false;
  if (getNodeEnv() === 'test') return false;
  return true;
}

async function getActiveDbBankingBonuses(): Promise<BankingBonusListItem[]> {
  const now = new Date();
  const rows = await db.bankingBonus.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    },
    orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
  });

  return sortByBonusAmountDesc(rows.map(toRecordFromDb).map(toListItem));
}

function readBankingBonusesCache(now = Date.now()): BankingBonusesDataResponse | null {
  const cached = globalThis.bankingBonusesDataCache;
  if (!cached) return null;

  if (cached.expiresAt <= now) {
    globalThis.bankingBonusesDataCache = undefined;
    return null;
  }

  return cached.value;
}

function writeBankingBonusesCache(
  value: BankingBonusesDataResponse
): BankingBonusesDataResponse {
  globalThis.bankingBonusesDataCache = {
    value,
    expiresAt: Date.now() + BANKING_BONUSES_CACHE_TTL_MS
  };

  return value;
}

async function loadBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  if (!shouldUseDbSource()) {
    return {
      bonuses: getActiveSeedBankingBonuses(),
      source: 'seed'
    };
  }

  try {
    const dbBonuses = await getActiveDbBankingBonuses();
    if (dbBonuses.length > 0) {
      return {
        bonuses: dbBonuses,
        source: 'db'
      };
    }
  } catch (error) {
    console.error('[banking-bonuses] failed to load DB offers; falling back to seed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    bonuses: getActiveSeedBankingBonuses(),
    source: 'seed'
  };
}

export async function getBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  const cached = readBankingBonusesCache();
  if (cached) return cached;

  if (bankingBonusesInFlight) {
    return bankingBonusesInFlight;
  }

  bankingBonusesInFlight = loadBankingBonusesData()
    .then((value) => writeBankingBonusesCache(value))
    .finally(() => {
      bankingBonusesInFlight = null;
    });

  return bankingBonusesInFlight;
}

export async function getBankingBonusBySlug(slug: string): Promise<BankingBonusListItem | null> {
  if (shouldUseDbSource()) {
    try {
      const now = new Date();
      const dbOffer = await db.bankingBonus.findFirst({
        where: {
          slug,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
        }
      });
      if (dbOffer) {
        return toListItem(toRecordFromDb(dbOffer));
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB offer by slug; falling back to seed', {
        slug,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getActiveSeedBankingBonuses().find((bonus) => bonus.slug === slug) ?? null;
}

export async function getAllBankingBonusSlugs(): Promise<string[]> {
  if (shouldUseDbSource()) {
    try {
      const now = new Date();
      const rows = await db.bankingBonus.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
        },
        select: { slug: true }
      });
      if (rows.length > 0) {
        return rows.map((row) => row.slug);
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB slugs; falling back to seed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getActiveSeedBankingBonuses().map((bonus) => bonus.slug);
}
