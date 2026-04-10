import { bankingBonusesSeedDatasetSchema } from '@/lib/banking-bonus-seed-schema';
import type { BankingBonusListItem } from '@/lib/banking/schema';
import {
  isOfferExpired,
  sortByBonusAmountDesc,
  toBankingBonusListItem
} from '@/lib/banking/source-shared';

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

export function getActiveSeedBankingBonuses(): BankingBonusListItem[] {
  return sortByBonusAmountDesc(
    bankingBonusSeedData
      .filter((record) => record.isActive && !isOfferExpired(record.expiresAt))
      .map(toBankingBonusListItem)
  );
}

export function getSeedBankingBonusBySlug(slug: string): BankingBonusListItem | null {
  return getActiveSeedBankingBonuses().find((bonus) => bonus.slug === slug) ?? null;
}

export function getActiveSeedBankingBonusSlugs(): string[] {
  return getActiveSeedBankingBonuses().map((bonus) => bonus.slug);
}
