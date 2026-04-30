import { describe, expect, it } from 'vitest';
import type { CardDetail } from '../cards';
import {
  buildCardComparison,
  buildCardComparisonCardSummary,
  defaultCardComparisonAssumptions
} from '../card-compare';

function createCard(overrides: Partial<CardDetail> = {}): CardDetail {
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
    editorRating: overrides.editorRating,
    pros: overrides.pros,
    cons: overrides.cons,
    bestSignUpBonusValue: overrides.bestSignUpBonusValue ?? 750,
    bestSignUpBonusSpendRequired: overrides.bestSignUpBonusSpendRequired ?? 4000,
    bestSignUpBonusSpendPeriodDays:
      overrides.bestSignUpBonusSpendPeriodDays ?? 90,
    offsettingCreditsValue: overrides.offsettingCreditsValue ?? 0,
    totalBenefitsValue: overrides.totalBenefitsValue ?? 0,
    plannerBenefitsValue: overrides.plannerBenefitsValue ?? 0,
    network: overrides.network,
    introApr: overrides.introApr,
    regularAprMin: overrides.regularAprMin,
    regularAprMax: overrides.regularAprMax,
    applyUrl: overrides.applyUrl,
    affiliateUrl: overrides.affiliateUrl,
    rewards: overrides.rewards ?? [
      { category: 'all', rate: 2, rateType: 'points' }
    ],
    signUpBonuses: overrides.signUpBonuses ?? [
      {
        bonusValue: overrides.bestSignUpBonusValue ?? 750,
        bonusType: 'points',
        spendRequired: overrides.bestSignUpBonusSpendRequired ?? 4000,
        spendPeriodDays: overrides.bestSignUpBonusSpendPeriodDays ?? 90,
        isCurrentOffer: true
      }
    ],
    benefits: overrides.benefits ?? [],
    transferPartners: overrides.transferPartners ?? []
  };
}

describe('card-compare', () => {
  it('builds first-year and ongoing value using rewards, credits, fees, and the welcome offer', () => {
    const cardA = createCard({
      rewardType: 'cashback',
      annualFee: 95,
      offsettingCreditsValue: 200,
      bestSignUpBonusValue: 800,
      rewards: [{ category: 'all', rate: 2, rateType: 'cashback' }]
    });
    const cardB = createCard({
      slug: 'card-b',
      name: 'Card B',
      rewardType: 'cashback',
      annualFee: 0,
      offsettingCreditsValue: 0,
      bestSignUpBonusValue: 200,
      rewards: [{ category: 'all', rate: 1.5, rateType: 'cashback' }]
    });

    const comparison = buildCardComparison(cardA, cardB, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        online_shopping: 0,
        general: 1000
      },
      creditUsagePercent: 50,
      pointValueCents: 1.5
    });

    expect(comparison.a.annualRewardsValue).toBe(240);
    expect(comparison.a.usedCreditsValue).toBe(100);
    expect(comparison.a.firstYearValue).toBe(1045);
    expect(comparison.a.ongoingValue).toBe(245);

    expect(comparison.b.annualRewardsValue).toBe(180);
    expect(comparison.b.firstYearValue).toBe(380);
    expect(comparison.b.ongoingValue).toBe(180);
    expect(comparison.overallWinner).toBe('a');
  });

  it('handles capped category rewards by falling back to the base earn rate after the cap', () => {
    const cappedCard = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [
        { category: 'groceries', rate: 5, rateType: 'cashback', capAmount: 1500, capPeriod: 'quarter' },
        { category: 'all', rate: 1, rateType: 'cashback' }
      ],
      signUpBonuses: []
    });

    const flatCard = createCard({
      slug: 'flat-card',
      name: 'Flat Card',
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 2, rateType: 'cashback' }],
      signUpBonuses: []
    });

    const comparison = buildCardComparison(cappedCard, flatCard, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 1000,
        travel: 0,
        gas: 0,
        online_shopping: 0,
        general: 0
      }
    });

    expect(comparison.a.annualRewardsValue).toBe(360);
    expect(comparison.b.annualRewardsValue).toBe(240);
    expect(comparison.a.categoryBreakdown.find((item) => item.category === 'groceries')?.rewardLabel).toContain('then');
  });

  it('calls out when one card wins year one and the other is the better keeper', () => {
    const opener = createCard({
      slug: 'opener',
      name: 'Opener Card',
      rewardType: 'cashback',
      annualFee: 395,
      offsettingCreditsValue: 0,
      bestSignUpBonusValue: 1200,
      rewards: [{ category: 'all', rate: 1, rateType: 'cashback' }]
    });
    const keeper = createCard({
      slug: 'keeper',
      name: 'Keeper Card',
      rewardType: 'cashback',
      annualFee: 95,
      offsettingCreditsValue: 150,
      bestSignUpBonusValue: 300,
      rewards: [{ category: 'all', rate: 2.5, rateType: 'cashback' }]
    });

    const comparison = buildCardComparison(opener, keeper, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        online_shopping: 0,
        general: 2000
      },
      creditUsagePercent: 100
    });

    expect(comparison.firstYearWinner).toBe('a');
    expect(comparison.ongoingWinner).toBe('b');
    expect(comparison.overallWinner).toBe('tie');
    expect(comparison.verdictTitle).toContain('better opener');
    expect(comparison.verdictTitle).toContain('better keeper');
  });

  it('exposes the single-card summary used by detail pages', () => {
    const card = createCard({
      rewardType: 'cashback',
      annualFee: 95,
      offsettingCreditsValue: 180,
      bestSignUpBonusValue: 600,
      rewards: [{ category: 'all', rate: 2, rateType: 'cashback' }]
    });

    const summary = buildCardComparisonCardSummary(card, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        online_shopping: 0,
        general: 1000
      },
      creditUsagePercent: 50
    });

    expect(summary.annualRewardsValue).toBe(240);
    expect(summary.usedCreditsValue).toBe(90);
    expect(summary.firstYearValue).toBe(835);
    expect(summary.ongoingValue).toBe(235);
  });
});
