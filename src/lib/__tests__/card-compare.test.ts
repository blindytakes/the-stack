import { describe, expect, it } from 'vitest';
import type { CardDetail } from '../cards';
import {
  buildCardBenefitValuationKey,
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
  it('keeps default spend focused on the four core categories plus general', () => {
    expect(defaultCardComparisonAssumptions.monthlySpend).toEqual({
      dining: 450,
      groceries: 650,
      travel: 250,
      gas: 160,
      general: 920
    });
    expect(defaultCardComparisonAssumptions.benefitValuations).toEqual({});
  });

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
        general: 1000
      },
      pointValueCents: 1.5
    });

    expect(comparison.a.annualRewardsValue).toBe(240);
    expect(comparison.a.usedCreditsValue).toBe(200);
    expect(comparison.a.firstYearValue).toBe(1145);
    expect(comparison.a.ongoingValue).toBe(345);

    expect(comparison.b.annualRewardsValue).toBe(180);
    expect(comparison.b.firstYearValue).toBe(380);
    expect(comparison.b.ongoingValue).toBe(180);
    expect(comparison.overallWinner).toBe('a');
  });

  it('uses the global CPP assumption for point and mile welcome offers', () => {
    const card = createCard({
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'points' }],
      signUpBonuses: [
        {
          bonusValue: 500,
          bonusType: 'points',
          bonusPoints: 50000,
          spendRequired: 4000,
          spendPeriodDays: 90,
          isCurrentOffer: true
        }
      ]
    });

    const summary = buildCardComparisonCardSummary(card, {
      monthlySpend: {
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        general: 0
      },
      pointValueCents: 1.5
    });

    expect(summary.welcomeOfferValue).toBe(750);
    expect(summary.firstYearValue).toBe(750);
  });

  it('uses line-item benefit valuations for credits and optional perks', () => {
    const cardA = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: [],
      benefits: [
        {
          category: 'travel credits',
          name: '$200 United TravelBank Credit',
          description: 'Annual United TravelBank credit.',
          estimatedValue: 200
        },
        {
          category: 'airline perks',
          name: 'Free checked bags',
          description: 'Checked-bag benefit on eligible itineraries.'
        }
      ]
    });
    const cardB = createCard({
      slug: 'card-b',
      name: 'Card B',
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: []
    });
    const checkedBagKey = buildCardBenefitValuationKey(cardA, cardA.benefits[1]);

    const comparison = buildCardComparison(cardA, cardB, {
      monthlySpend: {
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        general: 0
      },
      benefitValuations: {
        [checkedBagKey]: {
          included: true,
          annualValue: 120
        }
      }
    });

    expect(comparison.a.usedCreditsValue).toBe(200);
    expect(comparison.a.usedPerksValue).toBe(120);
    expect(comparison.a.usedBenefitsValue).toBe(320);
    expect(comparison.a.ongoingValue).toBe(320);
  });

  it('lets users exclude or override individual credit values', () => {
    const cardA = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: [],
      benefits: [
        {
          category: 'travel credits',
          name: '$200 United TravelBank Credit',
          description: 'Annual United TravelBank credit.',
          estimatedValue: 200
        }
      ]
    });
    const cardB = createCard({
      slug: 'card-b',
      name: 'Card B',
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: []
    });
    const creditKey = buildCardBenefitValuationKey(cardA, cardA.benefits[0]);

    const excludedComparison = buildCardComparison(cardA, cardB, {
      benefitValuations: {
        [creditKey]: {
          included: false
        }
      }
    });
    const customComparison = buildCardComparison(cardA, cardB, {
      benefitValuations: {
        [creditKey]: {
          included: true,
          annualValue: 180
        }
      }
    });

    expect(excludedComparison.a.usedCreditsValue).toBe(0);
    expect(customComparison.a.usedCreditsValue).toBe(180);
  });

  it('uses conservative default values for restrictive merchant credits', () => {
    const cardA = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: [],
      benefits: [
        {
          category: 'other',
          name: '$300 Equinox Credit',
          description: 'Eligible Equinox membership or digital subscription credit.',
          estimatedValue: 300
        },
        {
          category: 'other',
          name: '$300 lululemon Credit',
          description: 'Quarterly eligible U.S. lululemon store credit.',
          estimatedValue: 300
        },
        {
          category: 'other',
          name: '$200 Uber Cash',
          description: 'Monthly Uber Cash credit.',
          estimatedValue: 200
        },
        {
          category: 'travel credits',
          name: '$500 Credit for Stays with The Edit',
          description: 'Semi-annual prepaid hotel credits through The Edit.',
          estimatedValue: 500
        },
        {
          category: 'other',
          name: '$300 in DoorDash Promos',
          description: 'Monthly DoorDash promotional benefit.',
          estimatedValue: 300
        },
        {
          category: 'other',
          name: '$300 in StubHub Credits',
          description: 'Semi-annual StubHub statement credits.',
          estimatedValue: 300
        },
        {
          category: 'other',
          name: '$120 in Lyft Credits',
          description: 'Monthly Lyft statement credits.',
          estimatedValue: 120
        },
        {
          category: 'other',
          name: '$150 Annual Fee Refund After $150,000 Spend',
          description: 'Statement credit after meeting the annual spend threshold.',
          estimatedValue: 150
        }
      ]
    });
    const cardB = createCard({
      slug: 'card-b',
      name: 'Card B',
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 0, rateType: 'cashback' }],
      signUpBonuses: []
    });

    const comparison = buildCardComparison(cardA, cardB, {
      monthlySpend: {
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        general: 0
      }
    });

    expect(comparison.a.usedCreditsValue).toBe(1171);
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$300 Equinox Credit')
    ).toMatchObject({ included: false, defaultAnnualValue: 0 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$300 lululemon Credit')
    ).toMatchObject({ included: true, defaultAnnualValue: 150 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$200 Uber Cash')
    ).toMatchObject({ included: true, defaultAnnualValue: 160 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$500 Credit for Stays with The Edit')
    ).toMatchObject({ included: true, defaultAnnualValue: 300 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$300 in DoorDash Promos')
    ).toMatchObject({ included: true, defaultAnnualValue: 240 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$300 in StubHub Credits')
    ).toMatchObject({ included: true, defaultAnnualValue: 225 });
    expect(
      comparison.a.benefitBreakdown.find((benefit) => benefit.name === '$120 in Lyft Credits')
    ).toMatchObject({ included: true, defaultAnnualValue: 96 });
    expect(
      comparison.a.benefitBreakdown.find(
        (benefit) => benefit.name === '$150 Annual Fee Refund After $150,000 Spend'
      )
    ).toMatchObject({ included: false, defaultAnnualValue: 0 });
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
        general: 0
      }
    });

    expect(comparison.a.annualRewardsValue).toBe(360);
    expect(comparison.b.annualRewardsValue).toBe(240);
    expect(comparison.a.categoryBreakdown.find((item) => item.category === 'groceries')?.rewardLabel).toContain('then');
  });

  it('applies caps to flat all-spend rewards before falling back to 1x or 1%', () => {
    const cappedFlatCard = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [
        {
          category: 'all',
          rate: 2,
          rateType: 'cashback',
          capAmount: 1000,
          capPeriod: 'year',
          notes: '2% cash back on the first $1,000 per year, then 1%.'
        }
      ],
      signUpBonuses: []
    });

    const summary = buildCardComparisonCardSummary(cappedFlatCard, {
      monthlySpend: {
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        general: 2000
      }
    });

    expect(summary.annualRewardsValue).toBe(250);
    expect(summary.categoryBreakdown.find((item) => item.category === 'general')?.rewardLabel).toContain('then');
  });

  it('shares combined caps across matching capped reward categories', () => {
    const combinedCapCard = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [
        {
          category: 'groceries',
          rate: 5,
          rateType: 'cashback',
          capAmount: 6000,
          capPeriod: 'year',
          notes: '5% cash back on the first $6,000 in combined gas and grocery purchases each year.'
        },
        {
          category: 'gas',
          rate: 5,
          rateType: 'cashback',
          capAmount: 6000,
          capPeriod: 'year',
          notes: '5% cash back on gas in the first $6,000 of combined gas and grocery purchases each year.'
        },
        { category: 'all', rate: 1, rateType: 'cashback' }
      ],
      signUpBonuses: []
    });

    const summary = buildCardComparisonCardSummary(combinedCapCard, {
      monthlySpend: {
        dining: 0,
        groceries: 500,
        travel: 0,
        gas: 500,
        general: 0
      }
    });

    expect(summary.annualRewardsValue).toBe(360);
    expect(summary.categoryBreakdown.find((item) => item.category === 'gas')?.rewardLabel).toContain('then');
  });

  it('does not apply portal-only travel multipliers to generic travel spend', () => {
    const portalTravelCard = createCard({
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [
        {
          category: 'travel',
          rate: 10,
          rateType: 'cashback',
          notes: '10% on hotels and rental cars booked through issuer travel.'
        },
        { category: 'all', rate: 2, rateType: 'cashback' }
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

    const comparison = buildCardComparison(portalTravelCard, flatCard, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 0,
        travel: 1000,
        gas: 0,
        general: 0
      }
    });

    const travelRow = comparison.a.categoryBreakdown.find((item) => item.category === 'travel');

    expect(travelRow?.annualValue).toBe(240);
    expect(travelRow?.effectiveReturnPercent).toBe(2);
    expect(travelRow?.rewardLabel).toBe('2%');
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
        general: 2000
      }
    });

    expect(comparison.firstYearWinner).toBe('a');
    expect(comparison.ongoingWinner).toBe('b');
    expect(comparison.overallWinner).toBe('tie');
    expect(comparison.verdictTitle).toContain('better opener');
    expect(comparison.verdictTitle).toContain('better keeper');
  });

  it('computes breakeven from the higher-reward side even when card B has the richer earn rate', () => {
    const lowerFeeCard = createCard({
      slug: 'lower-fee-card',
      name: 'Lower Fee Card',
      rewardType: 'cashback',
      annualFee: 0,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 1, rateType: 'cashback' }],
      signUpBonuses: []
    });
    const higherRewardCard = createCard({
      slug: 'higher-reward-card',
      name: 'Higher Reward Card',
      rewardType: 'cashback',
      annualFee: 95,
      bestSignUpBonusValue: 0,
      rewards: [{ category: 'all', rate: 3, rateType: 'cashback' }],
      signUpBonuses: []
    });

    const comparison = buildCardComparison(lowerFeeCard, higherRewardCard, {
      monthlySpend: {
        ...defaultCardComparisonAssumptions.monthlySpend,
        dining: 0,
        groceries: 0,
        travel: 0,
        gas: 0,
        general: 1000
      }
    });

    expect(comparison.breakevenAnnualSpend).toBe(4750);
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
        general: 1000
      }
    });

    expect(summary.annualRewardsValue).toBe(240);
    expect(summary.usedCreditsValue).toBe(180);
    expect(summary.firstYearValue).toBe(925);
    expect(summary.ongoingValue).toBe(325);
  });
});
