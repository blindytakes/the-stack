import { describe, expect, it } from 'vitest';
import {
  bankingPriorityScoringPolicy,
  cardOpenScoringPolicy,
  cardPriorityScoringPolicy,
  estimateBankBonusNetValue,
  estimateCardBenefitAdjustment,
  estimateCardOpenValue,
  isStateRestricted,
  meetsCreditTier,
  scoreBankingPriority,
  scoreCardFit,
  scoreCardOpenPriority,
  scoreScheduleContribution
} from '../scoring-policy';

describe('scoring-policy', () => {
  it('keeps card opening value bonus-first with a capped benefit adjustment', () => {
    expect(cardOpenScoringPolicy.benefitWeight).toBe(0.5);
    expect(cardOpenScoringPolicy.benefitCap).toBe(250);
    expect(estimateCardBenefitAdjustment(80)).toBe(40);
    expect(estimateCardBenefitAdjustment(800)).toBe(250);
    expect(
      estimateCardOpenValue({
        bonusValue: 900,
        plannerBenefitsValue: 800,
        annualFee: 95
      })
    ).toBe(1055);
  });

  it('scores card fit using goal, spend, and fee preference', () => {
    expect(
      scoreCardFit(
        {
          rewardType: 'cashback',
          topCategories: ['dining'],
          annualFee: 0
        },
        {
          goal: 'cashback',
          spend: 'dining',
          fee: 'no_fee'
        }
      )
    ).toBe(7);
  });

  it('builds card priority from open value plus fit and execution bonuses', () => {
    expect(cardPriorityScoringPolicy.fitWeight).toBe(60);
    expect(cardPriorityScoringPolicy.effortAdjustment.low).toBe(50);
    expect(
      scoreCardOpenPriority({
        estimatedNetValue: 755,
        fitScore: 7,
        annualFee: 95,
        feePreference: 'up_to_95',
        effort: 'medium',
        timelineDays: 90
      })
    ).toBe(1225);
  });

  it('scores banking offers and scheduler contribution deterministically', () => {
    expect(estimateBankBonusNetValue(400, 12)).toBe(388);
    expect(bankingPriorityScoringPolicy.effortAdjustment.low).toBe(45);
    expect(
      scoreBankingPriority({
        estimatedNetValue: 388,
        effort: 'low',
        timelineDays: 90,
        directDepositRequired: false,
        stateRestricted: false,
        minimumOpeningDeposit: 1000,
        directDepositAvailability: 'yes'
      })
    ).toBe(503);
    expect(
      scoreScheduleContribution({
        estimatedNetValue: 755,
        priorityScore: 1225
      })
    ).toBe(76725);
  });

  it('shares credit-tier eligibility rules across quiz and planner flows', () => {
    expect(meetsCreditTier('good', 'excellent')).toBe(true);
    expect(meetsCreditTier('excellent', 'good')).toBe(false);
  });

  it('treats OT as unknown state instead of hard-restricting banking offers', () => {
    expect(isStateRestricted({ stateRestrictions: ['NY', 'CA'] }, 'OT')).toBe(false);
    expect(isStateRestricted({ stateRestrictions: ['NY', 'CA'] }, 'WA')).toBe(true);
  });
});
