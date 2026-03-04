import { z } from 'zod';
import {
  bankingAccountTypeSchema,
  bankingBonusesSeedDatasetSchema,
  type BankingBonusSeedRecord
} from '@/lib/banking-bonus-seed-schema';

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

export type BankingBonusRecord = BankingBonusSeedRecord;

export type BankingBonusListItem = BankingBonusRecord & {
  estimatedNetValue: number;
};

export const bankingBonusesQuerySchema = z.object({
  accountType: bankingAccountTypeSchema.optional(),
  requiresDirectDeposit: z.enum(['yes', 'no']).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type BankingBonusesQuery = z.infer<typeof bankingBonusesQuerySchema>;

function toListItem(record: BankingBonusRecord): BankingBonusListItem {
  return {
    ...record,
    estimatedNetValue: Number((record.bonusAmount - record.estimatedFees).toFixed(2))
  };
}

export function getBankingOfferRequirements(offer: BankingBonusRecord): string[] {
  const requirements: string[] = [];

  if (offer.directDeposit.required) {
    const amount =
      typeof offer.directDeposit.minimumAmount === 'number'
        ? ` of at least $${offer.directDeposit.minimumAmount.toLocaleString()}`
        : '';
    requirements.push(`Qualifying direct deposit${amount}`);
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    requirements.push(`Open with at least $${offer.minimumOpeningDeposit.toLocaleString()}`);
  }

  if (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays > 0) {
    requirements.push(`Keep account open for ${offer.holdingPeriodDays} days`);
  }

  requirements.push(...offer.requiredActions);
  return requirements;
}

export function getBankingBonusesData(): {
  bonuses: BankingBonusListItem[];
  source: 'seed';
} {
  return {
    bonuses: bankingBonusSeedData
      .filter((record) => record.isActive)
      .map(toListItem)
      .sort((a, b) => b.estimatedNetValue - a.estimatedNetValue),
    source: 'seed'
  };
}

export function filterBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: BankingBonusesQuery
): BankingBonusListItem[] {
  return bonuses.filter((bonus) => {
    if (query.accountType && bonus.accountType !== query.accountType) {
      return false;
    }

    if (query.requiresDirectDeposit === 'yes' && !bonus.directDeposit.required) {
      return false;
    }

    if (query.requiresDirectDeposit === 'no' && bonus.directDeposit.required) {
      return false;
    }

    if (
      query.state &&
      bonus.stateRestrictions &&
      bonus.stateRestrictions.length > 0 &&
      !bonus.stateRestrictions.includes(query.state)
    ) {
      return false;
    }

    return true;
  });
}

export function paginateBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: Pick<BankingBonusesQuery, 'limit' | 'offset'>
): BankingBonusListItem[] {
  return bonuses.slice(query.offset, query.offset + query.limit);
}
