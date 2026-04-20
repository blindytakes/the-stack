import { describe, expect, it } from 'vitest';
import {
  getChase524StatusFromRecentCardOpenings,
  rankQuizResults,
  quizRequestSchema
} from '../quiz-engine';
import type { QuizRequest } from '../quiz-engine';
import type { CardRecord } from '../cards';

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

function makeInput(overrides: Partial<QuizRequest> = {}): QuizRequest {
  return {
    audience: 'consumer',
    goal: 'cashback',
    spend: 'dining',
    fee: 'no_fee',
    credit: 'good',
    ownedCardSlugs: [],
    amexLifetimeBlockedSlugs: [],
    chase524Status: 'not_sure',
    directDeposit: 'yes',
    state: 'NY',
    monthlySpend: 'from_2500_to_5000',
    pace: 'balanced',
    availableCash: 'from_2501_to_9999',
    bankAccountPreference: 'no_preference',
    ownedBankNames: [],
    ...overrides
  };
}

describe('rankQuizResults', () => {
  const cards: CardRecord[] = [
    makeCard({ slug: 'cashback-dining', rewardType: 'cashback', topCategories: ['dining'], annualFee: 0, creditTierMin: 'good' }),
    makeCard({ slug: 'travel-points', rewardType: 'points', topCategories: ['travel'], annualFee: 95, creditTierMin: 'good' }),
    makeCard({ slug: 'premium-travel', rewardType: 'miles', topCategories: ['travel'], annualFee: 550, creditTierMin: 'excellent' }),
    makeCard({ slug: 'secured-starter', rewardType: 'cashback', topCategories: ['all'], annualFee: 0, creditTierMin: 'building' })
  ];

  it('returns at most 12 results', () => {
    const input = makeInput({ goal: 'flexibility', spend: 'dining', fee: 'over_95_ok', credit: 'excellent' });
    const results = rankQuizResults(cards, input);
    expect(results.length).toBeLessThanOrEqual(12);
  });

  it('excludes cards the user already has open', () => {
    const input = makeInput({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'excellent',
      ownedCardSlugs: ['cashback-dining']
    });

    const results = rankQuizResults(cards, input);

    expect(results.some((card) => card.slug === 'cashback-dining')).toBe(false);
  });

  it('excludes Amex cards the user already had before under the lifetime rule', () => {
    const amexCard = makeCard({
      slug: 'amex-gold-card',
      issuer: 'American Express',
      rewardType: 'points',
      topCategories: ['dining']
    });
    const chaseCard = makeCard({
      slug: 'chase-sapphire-preferred',
      issuer: 'Chase',
      rewardType: 'points',
      topCategories: ['travel']
    });

    const results = rankQuizResults(
      [amexCard, chaseCard],
      makeInput({
        goal: 'travel',
        spend: 'travel',
        fee: 'up_to_95',
        credit: 'excellent',
        amexLifetimeBlockedSlugs: ['amex-gold-card']
      })
    );

    expect(results.some((card) => card.slug === 'amex-gold-card')).toBe(false);
    expect(results.some((card) => card.slug === 'chase-sapphire-preferred')).toBe(true);
  });

  it('excludes Chase cards when the user is at or over 5/24', () => {
    const chaseCard = makeCard({
      slug: 'chase-sapphire-preferred',
      issuer: 'Chase',
      rewardType: 'points',
      topCategories: ['travel']
    });
    const citiCard = makeCard({
      slug: 'citi-strata-premier-card',
      issuer: 'Citi',
      rewardType: 'points',
      topCategories: ['travel']
    });

    const results = rankQuizResults(
      [chaseCard, citiCard],
      makeInput({
        goal: 'travel',
        spend: 'travel',
        fee: 'up_to_95',
        credit: 'excellent',
        chase524Status: 'at_or_over_5_24'
      })
    );

    expect(results.some((card) => card.slug === 'chase-sapphire-preferred')).toBe(false);
    expect(results.some((card) => card.slug === 'citi-strata-premier-card')).toBe(true);
  });

  it('filters by credit tier eligibility', () => {
    const input = makeInput({ goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'fair' });
    const results = rankQuizResults(cards, input);
    // 'fair' credit (rank 2) can only access cards with creditTierMin fair (2) or building (1)
    expect(results.every((r) => ['fair', 'building'].includes(r.creditTierMin))).toBe(true);
  });

  it('ignores hidden credit filtering for the full planner question set', () => {
    const results = rankQuizResults(
      [
        makeCard({ slug: 'excellent-only', creditTierMin: 'excellent' }),
        makeCard({ slug: 'starter', creditTierMin: 'building' })
      ],
      makeInput({ credit: 'fair' }),
      { questionSet: 'full' }
    );

    expect(results.map((card) => card.slug)).toEqual(['excellent-only', 'starter']);
  });

  it('limits ranked cards to business cards for the business audience', () => {
    const results = rankQuizResults(
      [
        makeCard({ slug: 'personal-card', cardType: 'personal' }),
        makeCard({ slug: 'business-card', cardType: 'business' })
      ],
      makeInput({ audience: 'business' })
    );

    expect(results.map((card) => card.slug)).toEqual(['business-card']);
  });

  it('favors matching goal reward type', () => {
    const input = makeInput({ goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' });
    const results = rankQuizResults(cards, input);
    // cashback-dining should score highest: goal match + category match + fee match
    expect(results[0].slug).toBe('cashback-dining');
  });

  it('favors matching spend category', () => {
    const input = makeInput({ goal: 'travel', spend: 'travel', fee: 'up_to_95', credit: 'good' });
    const results = rankQuizResults(cards, input);
    // travel-points has goal match + category match + fee match
    expect(results[0].slug).toBe('travel-points');
  });

  it('falls back to base offer value ordering for the full planner question set', () => {
    const results = rankQuizResults(
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
      makeInput({ spend: 'dining', credit: 'good' }),
      { questionSet: 'full' }
    );

    expect(results[0]?.slug).toBe('higher-value');
    expect(results[1]?.slug).toBe('fit-but-lower-value');
  });

  it('penalizes annual fee when user wants no fee', () => {
    const input = makeInput({ goal: 'flexibility', spend: 'travel', fee: 'no_fee', credit: 'excellent' });
    const results = rankQuizResults(cards, input);
    // Cards with annualFee > 0 get score penalty
    const freeCards = results.filter((r) => r.annualFee === 0);
    const paidCards = results.filter((r) => r.annualFee > 0);
    if (freeCards.length > 0 && paidCards.length > 0) {
      expect(freeCards[0].score).toBeGreaterThanOrEqual(paidCards[0].score);
    }
  });

  it('includes score property on results', () => {
    const input = makeInput({ goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' });
    const results = rankQuizResults(cards, input);
    results.forEach((r) => {
      expect(typeof r.score).toBe('number');
    });
  });

  it('returns results sorted by score descending', () => {
    const input = makeInput({ goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' });
    const results = rankQuizResults(cards, input);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('returns empty array when no cards are eligible', () => {
    const input = makeInput({ goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'building' });
    // Only 'secured-starter' has creditTierMin 'building'
    const restrictedCards = [
      makeCard({ slug: 'premium-only', creditTierMin: 'excellent' })
    ];
    const results = rankQuizResults(restrictedCards, input);
    expect(results).toHaveLength(0);
  });
});

describe('quizRequestSchema', () => {
  it('maps recent card opening ranges to Chase 5/24 status', () => {
    expect(getChase524StatusFromRecentCardOpenings('two_or_less')).toBe('under_5_24');
    expect(getChase524StatusFromRecentCardOpenings('three_to_four')).toBe('under_5_24');
    expect(getChase524StatusFromRecentCardOpenings('five_or_more')).toBe('at_or_over_5_24');
    expect(getChase524StatusFromRecentCardOpenings(undefined)).toBe('not_sure');
  });

  it('validates a correct request', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      state: 'ny',
      recentCardOpenings24Months: 'three_to_four',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.state).toBe('NY');
      expect(parsed.data.recentCardOpenings24Months).toBe('three_to_four');
      expect(parsed.data.monthlySpend).toBe('from_2500_to_5000');
      expect(parsed.data.ownedCardSlugs).toEqual([]);
      expect(parsed.data.amexLifetimeBlockedSlugs).toEqual([]);
      expect(parsed.data.chase524Status).toBe('not_sure');
      expect(parsed.data.audience).toBe('consumer');
    }
  });

  it('defaults state to OT when location is omitted', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.state).toBe('OT');
      expect(parsed.data.ownedCardSlugs).toEqual([]);
      expect(parsed.data.amexLifetimeBlockedSlugs).toEqual([]);
      expect(parsed.data.chase524Status).toBe('not_sure');
      expect(parsed.data.audience).toBe('consumer');
    }
  });

  it('deduplicates owned card selections', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      ownedCardSlugs: ['chase-sapphire-preferred', 'chase-sapphire-preferred'],
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ownedCardSlugs).toEqual(['chase-sapphire-preferred']);
    }
  });

  it('deduplicates Amex lifetime history selections', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      amexLifetimeBlockedSlugs: ['amex-gold-card', 'amex-gold-card'],
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.amexLifetimeBlockedSlugs).toEqual(['amex-gold-card']);
    }
  });

  it('rejects invalid goal', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'invalid',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      state: 'ny'
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const parsed = quizRequestSchema.safeParse({ goal: 'cashback' });
    expect(parsed.success).toBe(false);
  });

  it('defaults new banking fields when omitted', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.availableCash).toBe('from_2501_to_9999');
      expect(parsed.data.bankAccountPreference).toBe('no_preference');
      expect(parsed.data.ownedBankNames).toEqual([]);
    }
  });

  it('accepts the business audience explicitly', () => {
    const parsed = quizRequestSchema.safeParse({
      audience: 'business',
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced'
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.audience).toBe('business');
    }
  });

  it('deduplicates owned bank name selections', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good',
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced',
      ownedBankNames: ['Chase', 'Chase', 'Wells Fargo']
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ownedBankNames).toEqual(['Chase', 'Wells Fargo']);
    }
  });
});
