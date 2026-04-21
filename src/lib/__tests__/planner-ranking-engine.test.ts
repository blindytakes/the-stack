import { describe, expect, it } from 'vitest';
import {
  getChase524StatusFromRecentCardOpenings,
  rankPlannerResults
} from '../planner/ranking-engine';
import type { CardRecord } from '../cards';
import type {
  CardsOnlyPlannerContext,
  FullPlannerContext
} from '../planner/schemas';

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: 'test-card',
    name: 'Test Card',
    issuer: 'TestBank',
    imageAssetType: 'text_fallback',
    cardType: 'personal',
    rewardType: 'cashback',
    topCategories: ['dining'],
    annualFee: 0,
    creditTierMin: 'good',
    headline: 'A test card',
    totalBenefitsValue: 0,
    plannerBenefitsValue: 0,
    ...overrides
  };
}

function makeFullPlannerInput(
  overrides: Partial<FullPlannerContext> = {}
): FullPlannerContext {
  return {
    mode: 'full',
    audience: 'consumer',
    monthlySpend: 'from_2500_to_5000',
    directDeposit: 'yes',
    state: 'NY',
    ownedCardSlugs: [],
    availableCash: 'from_2501_to_9999',
    ownedBankNames: [],
    amexLifetimeBlockedSlugs: [],
    chase524Status: 'not_sure',
    ...overrides
  };
}

function makeCardsOnlyPlannerInput(
  overrides: Partial<CardsOnlyPlannerContext> = {}
): CardsOnlyPlannerContext {
  return {
    mode: 'cards_only',
    audience: 'consumer',
    monthlySpend: 'from_2500_to_5000',
    spend: 'dining',
    credit: 'good',
    ownedCardSlugs: [],
    amexLifetimeBlockedSlugs: [],
    chase524Status: 'not_sure',
    ...overrides
  };
}

describe('rankPlannerResults', () => {
  const cards: CardRecord[] = [
    makeCard({
      slug: 'cashback-dining',
      rewardType: 'cashback',
      topCategories: ['dining'],
      annualFee: 0,
      creditTierMin: 'good'
    }),
    makeCard({
      slug: 'travel-points',
      rewardType: 'points',
      topCategories: ['travel'],
      annualFee: 95,
      creditTierMin: 'good'
    }),
    makeCard({
      slug: 'excellent-only',
      rewardType: 'points',
      topCategories: ['travel'],
      annualFee: 95,
      creditTierMin: 'excellent',
      bestSignUpBonusValue: 900
    }),
    makeCard({
      slug: 'secured-starter',
      rewardType: 'cashback',
      topCategories: ['all'],
      annualFee: 0,
      creditTierMin: 'building'
    })
  ];

  it('returns all eligible results so the scheduler can own pool limits', () => {
    const results = rankPlannerResults(
      Array.from({ length: 13 }, (_, index) =>
        makeCard({
          slug: `test-card-${index}`,
          bestSignUpBonusValue: 100 + index
        })
      ),
      makeCardsOnlyPlannerInput({ credit: 'excellent' })
    );

    expect(results).toHaveLength(13);
  });

  it('excludes cards the user already has open', () => {
    const results = rankPlannerResults(
      cards,
      makeCardsOnlyPlannerInput({
        credit: 'excellent',
        ownedCardSlugs: ['cashback-dining']
      })
    );

    expect(results.some((card) => card.slug === 'cashback-dining')).toBe(false);
  });

  it('excludes Amex cards blocked by lifetime history', () => {
    const results = rankPlannerResults(
      [
        makeCard({
          slug: 'amex-gold-card',
          issuer: 'American Express',
          rewardType: 'points'
        }),
        makeCard({
          slug: 'chase-sapphire-preferred',
          issuer: 'Chase',
          rewardType: 'points',
          topCategories: ['travel']
        })
      ],
      makeCardsOnlyPlannerInput({
        spend: 'travel',
        credit: 'excellent',
        amexLifetimeBlockedSlugs: ['amex-gold-card']
      })
    );

    expect(results.some((card) => card.slug === 'amex-gold-card')).toBe(false);
    expect(results.some((card) => card.slug === 'chase-sapphire-preferred')).toBe(true);
  });

  it('excludes Chase cards when the user is at or over 5/24', () => {
    const results = rankPlannerResults(
      [
        makeCard({
          slug: 'chase-sapphire-preferred',
          issuer: 'Chase',
          rewardType: 'points',
          topCategories: ['travel']
        }),
        makeCard({
          slug: 'citi-strata-premier-card',
          issuer: 'Citi',
          rewardType: 'points',
          topCategories: ['travel']
        })
      ],
      makeCardsOnlyPlannerInput({
        spend: 'travel',
        credit: 'excellent',
        chase524Status: 'at_or_over_5_24'
      })
    );

    expect(results.some((card) => card.slug === 'chase-sapphire-preferred')).toBe(false);
    expect(results.some((card) => card.slug === 'citi-strata-premier-card')).toBe(true);
  });

  it('filters by credit tier eligibility in cards-only mode', () => {
    const results = rankPlannerResults(
      cards,
      makeCardsOnlyPlannerInput({ credit: 'fair' })
    );

    expect(results.every((card) => ['fair', 'building'].includes(card.creditTierMin))).toBe(true);
  });

  it('ignores hidden credit defaults in full mode', () => {
    const results = rankPlannerResults(
      [
        makeCard({ slug: 'excellent-only', creditTierMin: 'excellent' }),
        makeCard({ slug: 'starter', creditTierMin: 'building' })
      ],
      makeFullPlannerInput()
    );

    expect(results.map((card) => card.slug)).toEqual(['excellent-only', 'starter']);
  });

  it('limits consumer full-plan results to personal cards', () => {
    const results = rankPlannerResults(
      [
        makeCard({ slug: 'personal-card', cardType: 'personal', bestSignUpBonusValue: 300 }),
        makeCard({ slug: 'business-card', cardType: 'business', bestSignUpBonusValue: 1200 })
      ],
      makeFullPlannerInput()
    );

    expect(results.map((card) => card.slug)).toEqual(['personal-card']);
  });

  it('limits results to business cards for the business audience', () => {
    const results = rankPlannerResults(
      [
        makeCard({ slug: 'personal-card', cardType: 'personal' }),
        makeCard({ slug: 'business-card', cardType: 'business' })
      ],
      makeCardsOnlyPlannerInput({ audience: 'business' })
    );

    expect(results.map((card) => card.slug)).toEqual(['business-card']);
  });

  it('favors matching spend category in cards-only mode', () => {
    const results = rankPlannerResults(
      cards,
      makeCardsOnlyPlannerInput({ spend: 'travel', credit: 'good' })
    );

    expect(results[0]?.slug).toBe('travel-points');
  });

  it('falls back to base offer value ordering in full mode', () => {
    const results = rankPlannerResults(
      [
        makeCard({
          slug: 'fit-but-lower-value',
          topCategories: ['dining'],
          bestSignUpBonusValue: 300,
          plannerBenefitsValue: 0,
          annualFee: 0
        }),
        makeCard({
          slug: 'higher-value',
          topCategories: ['travel'],
          bestSignUpBonusValue: 900,
          plannerBenefitsValue: 0,
          annualFee: 95
        })
      ],
      makeFullPlannerInput()
    );

    expect(results[0]?.slug).toBe('higher-value');
    expect(results[1]?.slug).toBe('fit-but-lower-value');
  });

  it('includes a numeric score on results', () => {
    const results = rankPlannerResults(
      cards,
      makeCardsOnlyPlannerInput({ credit: 'excellent' })
    );

    results.forEach((card) => {
      expect(typeof card.score).toBe('number');
    });
  });
});

describe('getChase524StatusFromRecentCardOpenings', () => {
  it('maps recent card opening ranges to Chase 5/24 status', () => {
    expect(getChase524StatusFromRecentCardOpenings('two_or_less')).toBe('under_5_24');
    expect(getChase524StatusFromRecentCardOpenings('three_to_four')).toBe('under_5_24');
    expect(getChase524StatusFromRecentCardOpenings('five_or_more')).toBe('at_or_over_5_24');
    expect(getChase524StatusFromRecentCardOpenings(undefined)).toBe('not_sure');
  });
});
