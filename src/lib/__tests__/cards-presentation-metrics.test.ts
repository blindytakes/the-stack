import { describe, expect, it } from 'vitest';
import type { CardRecord } from '../cards/schema';
import { getCardBonusRoi, getCardDecisionMetrics } from '../cards/presentation-metrics';

function createCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: overrides.slug ?? 'sample-card',
    name: overrides.name ?? 'Sample Card',
    issuer: overrides.issuer ?? 'Chase',
    imageAssetType: overrides.imageAssetType ?? 'text_fallback',
    cardType: overrides.cardType ?? 'personal',
    rewardType: overrides.rewardType ?? 'points',
    topCategories: overrides.topCategories ?? ['travel'],
    annualFee: overrides.annualFee ?? 95,
    foreignTxFee: overrides.foreignTxFee ?? 0,
    creditTierMin: overrides.creditTierMin ?? 'good',
    headline: overrides.headline ?? 'Strong travel value',
    description: overrides.description,
    longDescription: overrides.longDescription,
    editorRating: overrides.editorRating ?? 4.4,
    pros: overrides.pros,
    cons: overrides.cons,
    bestSignUpBonusValue: overrides.bestSignUpBonusValue ?? 750,
    bestSignUpBonusSpendRequired: overrides.bestSignUpBonusSpendRequired,
    bestSignUpBonusSpendPeriodDays: overrides.bestSignUpBonusSpendPeriodDays,
    offsettingCreditsValue: overrides.offsettingCreditsValue,
    totalBenefitsValue: overrides.totalBenefitsValue ?? 0,
    plannerBenefitsValue: overrides.plannerBenefitsValue ?? 0
  };
}

describe('card presentation metrics', () => {
  it('calculates bonus ROI from the gross sign-up bonus and required spend', () => {
    const card = createCard({
      annualFee: 395,
      bestSignUpBonusValue: 750,
      bestSignUpBonusSpendRequired: 5000,
      offsettingCreditsValue: 300
    });

    expect(getCardBonusRoi(card)).toBe(15);
  });

  it('returns null when no spend threshold is listed', () => {
    const card = createCard({
      bestSignUpBonusSpendRequired: undefined
    });

    expect(getCardBonusRoi(card)).toBeNull();
  });

  it('surfaces the card ROI metric as bonus ROI', () => {
    const card = createCard({
      annualFee: 395,
      bestSignUpBonusValue: 750,
      bestSignUpBonusSpendRequired: 5000,
      offsettingCreditsValue: 300
    });

    const metric = getCardDecisionMetrics(card).find((item) => item.label === 'Bonus ROI');

    expect(metric).toMatchObject({
      label: 'Bonus ROI',
      value: '15.0%',
      detail: 'Welcome bonus on required spend'
    });
  });
});
