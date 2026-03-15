import { describe, expect, it } from 'vitest';
import {
  getBankingOfferCashRequirementLevel,
  getBankingOfferDifficultyScore,
  getBankingOfferTimelineBucket
} from '@/lib/banking/scoring';
import { createBankingOffer } from '@/lib/__tests__/banking-test-helpers';

describe('banking scoring helpers', () => {
  it('scores extra friction for payroll, large deposits, and long holding periods', () => {
    const lightOffer = createBankingOffer();
    const heavyOffer = createBankingOffer({
      directDeposit: { required: true, minimumAmount: 1500 },
      minimumOpeningDeposit: 15000,
      holdingPeriodDays: 180,
      requiredActions: ['Open account', 'Receive payroll', 'Maintain balance']
    });

    expect(getBankingOfferDifficultyScore(lightOffer)).toBe(1);
    expect(getBankingOfferDifficultyScore(heavyOffer)).toBe(7);
  });

  it('classifies cash requirement and timeline buckets from the raw offer data', () => {
    expect(getBankingOfferCashRequirementLevel(createBankingOffer())).toBe('none');
    expect(
      getBankingOfferCashRequirementLevel(createBankingOffer({ minimumOpeningDeposit: 2000 }))
    ).toBe('light');
    expect(
      getBankingOfferCashRequirementLevel(createBankingOffer({ minimumOpeningDeposit: 6000 }))
    ).toBe('medium');
    expect(
      getBankingOfferCashRequirementLevel(createBankingOffer({ minimumOpeningDeposit: 12000 }))
    ).toBe('high');

    expect(getBankingOfferTimelineBucket(createBankingOffer({ holdingPeriodDays: 60 }))).toBe('fast');
    expect(getBankingOfferTimelineBucket(createBankingOffer({ holdingPeriodDays: 120 }))).toBe('standard');
    expect(getBankingOfferTimelineBucket(createBankingOffer({ holdingPeriodDays: 180 }))).toBe('long');
  });
});
