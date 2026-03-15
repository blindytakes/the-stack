import type { BankingBonusListItem, BankingBonusRecord } from '@/lib/banking-bonuses';

export function createBankingOffer(
  overrides: Partial<BankingBonusRecord> = {}
): BankingBonusRecord {
  return {
    slug: 'test-offer',
    bankName: 'Test Bank',
    offerName: 'Test Offer',
    accountType: 'checking',
    headline: 'Test headline',
    bonusAmount: 300,
    estimatedFees: 0,
    directDeposit: { required: false },
    requiredActions: ['Open account'],
    isActive: true,
    lastVerified: '2026-03-01T00:00:00.000Z',
    ...overrides
  };
}

export function createBankingListItem(
  overrides: Partial<BankingBonusListItem> = {}
): BankingBonusListItem {
  return {
    ...createBankingOffer(),
    estimatedNetValue: 300,
    ...overrides
  };
}
