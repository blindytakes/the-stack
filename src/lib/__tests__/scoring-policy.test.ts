import { describe, expect, it } from 'vitest';
import {
  bankingPriorityScoringPolicy,
  cardOpenScoringPolicy,
  cardPriorityScoringPolicy,
  estimateBankBonusNetValue,
  estimateCardBenefitAdjustment,
  estimateCardOpenValue,
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

  it('scores card fit using spend-category match', () => {
    // Spend match gives +2
    expect(
      scoreCardFit(
        { topCategories: ['dining'] },
        { spend: 'dining' }
      )
    ).toBe(2);

    // No spend match gives 0
    expect(
      scoreCardFit(
        { topCategories: ['travel'] },
        { spend: 'dining' }
      )
    ).toBe(0);

    // 'all' category always matches
    expect(
      scoreCardFit(
        { topCategories: ['all'] },
        { spend: 'dining' }
      )
    ).toBe(2);
  });

  it('builds card priority from open value plus fit and execution bonuses', () => {
    expect(cardPriorityScoringPolicy.fitWeight).toBe(60);
    expect(cardPriorityScoringPolicy.effortAdjustment.low).toBe(50);
    // 755 + (2 * 60) + 15 (medium effort) + 20 (within 90 days) = 910
    expect(
      scoreCardOpenPriority({
        estimatedNetValue: 755,
        fitScore: 2,
        effort: 'medium',
        timelineDays: 90
      })
    ).toBe(910);
  });

  it('scores banking offers and scheduler contribution deterministically', () => {
    expect(estimateBankBonusNetValue(400, 12)).toBe(388);
    expect(bankingPriorityScoringPolicy.effortAdjustment.low).toBe(45);
    // 388 + 45 (low effort) + 20 (within 90 days) + 20 (DD not required) + 20 (deposit ≤ 2000) = 493
    expect(
      scoreBankingPriority({
        estimatedNetValue: 388,
        effort: 'low',
        timelineDays: 90,
        directDepositRequired: false,
        minimumOpeningDeposit: 1000,
        directDepositAvailability: 'yes'
      })
    ).toBe(493);
    expect(
      scoreScheduleContribution({
        estimatedNetValue: 755,
        priorityScore: 910
      })
    ).toBe(76410);
  });

  it('shares credit-tier eligibility rules across planner intake modes', () => {
    expect(meetsCreditTier('good', 'excellent')).toBe(true);
    expect(meetsCreditTier('excellent', 'good')).toBe(false);
  });

  it('keeps banking priority independent of account type preference', () => {
    const base = {
      estimatedNetValue: 388,
      effort: 'low' as const,
      timelineDays: 90,
      directDepositRequired: false,
      minimumOpeningDeposit: 1000,
      directDepositAvailability: 'yes' as const
    };

    const checking = scoreBankingPriority({
      ...base,
      accountType: 'checking'
    });
    const savings = scoreBankingPriority({
      ...base,
      accountType: 'savings'
    });

    expect(checking).toBe(savings);
  });
});
