import { describe, expect, it } from 'vitest';
import { createBankingListItem } from '@/lib/__tests__/banking-test-helpers';
import {
  buildActiveBankingFilterChips,
  buildBankingDirectorySearchParams,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  filterAndSortBankingOffers,
  parseBankingDirectoryFilters
} from '@/lib/banking-directory-explorer';

describe('banking directory explorer helpers', () => {
  it('parses and rebuilds non-default filters from the URL', () => {
    const filters = parseBankingDirectoryFilters(
      new URLSearchParams(
        'q=empire&accountType=checking&customerType=business&directDeposit=no&apy=3_plus&difficulty=low&cash=light&timeline=fast&stateLimited=yes&state=ny&sort=low_cash'
      )
    );

    expect(filters).toEqual({
      accountType: 'checking',
      customerType: 'business',
      directDeposit: 'no',
      apy: '3_plus',
      difficulty: 'low',
      cashRequirement: 'light',
      timeline: 'fast',
      stateLimited: 'yes',
      state: 'NY',
      sortBy: 'low_cash'
    });

    expect(buildBankingDirectorySearchParams(new URLSearchParams(), filters).toString()).toBe(
      'accountType=checking&customerType=business&directDeposit=no&apy=3_plus&difficulty=low&cash=light&timeline=fast&stateLimited=yes&state=NY&sort=low_cash'
    );
    expect(countActiveBankingDirectoryFilters(filters)).toBe(9);
  });

  it('filters and sorts offers using banking filters only', () => {
    const offers = [
      createBankingListItem({
        slug: 'summit-no-payroll',
        bankName: 'Summit Bank',
        offerName: 'Summit Checking Bonus',
        directDeposit: { required: false },
        minimumOpeningDeposit: 0,
        holdingPeriodDays: 60,
        estimatedNetValue: 250
      }),
      createBankingListItem({
        slug: 'empire-checking',
        bankName: 'Empire National',
        offerName: 'Empire Checking Bonus',
        customerType: 'business',
        directDeposit: { required: false },
        apyPercent: 3.25,
        apyDisplay: '3.25% APY',
        minimumOpeningDeposit: 1500,
        holdingPeriodDays: 60,
        estimatedNetValue: 280
      }),
      createBankingListItem({
        slug: 'empire-payroll',
        bankName: 'Empire National',
        offerName: 'Empire Payroll Bonus',
        directDeposit: { required: true, minimumAmount: 2000 },
        minimumOpeningDeposit: 0,
        holdingPeriodDays: 60,
        estimatedNetValue: 400
      }),
      createBankingListItem({
        slug: 'atlas-savings',
        bankName: 'Atlas Online',
        offerName: 'Atlas Savings Bonus',
        accountType: 'savings',
        directDeposit: { required: false },
        minimumOpeningDeposit: 5000,
        holdingPeriodDays: 45,
        estimatedNetValue: 325
      })
    ];

    const result = filterAndSortBankingOffers(offers, {
      ...defaultBankingDirectoryFilters,
      accountType: 'checking',
      customerType: 'business',
      directDeposit: 'no',
      apy: '3_plus',
      sortBy: 'low_cash'
    });

    expect(result.map((offer) => offer.slug)).toEqual(['empire-checking']);
  });

  it('builds removable chip labels for active filters', () => {
    const chips = buildActiveBankingFilterChips({
      ...defaultBankingDirectoryFilters,
      customerType: 'business',
      apy: '3_plus',
      cashRequirement: 'light',
      state: 'NY'
    });

    expect(chips).toEqual([
      { key: 'customerType', label: 'Business only' },
      { key: 'apy', label: '3.00%+ APY' },
      { key: 'cashRequirement', label: 'Up to $2.5k' },
      { key: 'state', label: 'Available in New York' }
    ]);
  });

  it('normalizes legacy banking sort values to the default visible sort', () => {
    const filters = parseBankingDirectoryFilters(new URLSearchParams('sort=easy'));
    const legacyNetFilters = parseBankingDirectoryFilters(new URLSearchParams('sort=net'));

    expect(filters.sortBy).toBe(defaultBankingDirectoryFilters.sortBy);
    expect(legacyNetFilters.sortBy).toBe(defaultBankingDirectoryFilters.sortBy);
  });
});
