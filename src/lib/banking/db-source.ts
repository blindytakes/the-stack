import {
  BankingAccountType,
  BankingCustomerType,
  type Prisma
} from '@prisma/client';
import { db } from '@/lib/db';
import type { BankingBonusListItem, BankingBonusRecord } from '@/lib/banking/schema';
import {
  sortByBonusAmountDesc,
  toBankingBonusListItem
} from '@/lib/banking/source-shared';

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

function toBankingRecordFromDb(row: DbBankingBonusRow): BankingBonusRecord {
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

export async function getActiveDbBankingBonuses(now = new Date()): Promise<BankingBonusListItem[]> {
  const rows = await db.bankingBonus.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    },
    orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
  });

  return sortByBonusAmountDesc(rows.map(toBankingRecordFromDb).map(toBankingBonusListItem));
}

export async function getDbBankingBonusBySlug(
  slug: string,
  now = new Date()
): Promise<BankingBonusListItem | null> {
  const row = await db.bankingBonus.findFirst({
    where: {
      slug,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    }
  });

  return row ? toBankingBonusListItem(toBankingRecordFromDb(row)) : null;
}

export async function getActiveDbBankingBonusSlugs(now = new Date()): Promise<string[]> {
  const rows = await db.bankingBonus.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    },
    select: { slug: true }
  });

  return rows.map((row) => row.slug);
}
