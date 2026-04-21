import { describe, expect, it } from 'vitest';
import type { CardRecord } from '../cards';
import type { RankedCardResult } from '../planner/ranking-engine';
import { rankPlannerResults } from '../planner/ranking-engine';
import type {
  CardsOnlyPlannerContext,
  FullPlannerContext
} from '../planner/schemas';
import { createBankingListItem } from './banking-test-helpers';
import {
  buildPlanRecommendations,
  rankPlannerRecommendationsByPriority
} from '../planner-recommendations';
import { getBankingBonusesData } from '../banking-bonuses';

function makeFullInput(overrides: Partial<FullPlannerContext> = {}): FullPlannerContext {
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

function makeCardsOnlyInput(
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

function makeCardRecord(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: 'test-card',
    name: 'Test Card',
    issuer: 'Test Bank',
    imageAssetType: 'text_fallback',
    cardType: 'personal',
    rewardType: 'cashback',
    topCategories: ['dining'],
    annualFee: 0,
    creditTierMin: 'good',
    headline: 'Test headline',
    totalBenefitsValue: 0,
    plannerBenefitsValue: 0,
    ...overrides
  };
}

describe('rankPlannerRecommendationsByPriority', () => {
  it('returns recommendations sorted by priority score descending', () => {
    const low = {
      id: 'card:low-priority',
      lane: 'cards' as const,
      kind: 'card_bonus' as const,
      title: 'Low Priority',
      provider: 'Sample',
      imageAssetType: 'text_fallback' as const,
      estimatedNetValue: 200,
      priorityScore: 120,
      effort: 'low' as const,
      detailPath: '/cards/low-priority',
      timelineDays: 90,
      keyRequirements: ['Spend $500 within 1 month'],
      scheduleConstraints: {
        activeDays: 90,
        payoutLagDays: 30,
        requiredSpend: 500
      },
      valueBreakdown: {
        headlineValue: 200,
        headlineLabel: 'Welcome bonus',
        annualFee: 0,
        benefitAdjustment: 0
      }
    };
    const high = {
      id: 'card:high-priority',
      lane: 'cards' as const,
      kind: 'card_bonus' as const,
      title: 'High Priority',
      provider: 'Sample',
      imageAssetType: 'text_fallback' as const,
      estimatedNetValue: 600,
      priorityScore: 220,
      effort: 'medium' as const,
      detailPath: '/cards/high-priority',
      timelineDays: 90,
      keyRequirements: ['Spend $3,000 within 3 months'],
      scheduleConstraints: {
        activeDays: 90,
        payoutLagDays: 30,
        requiredSpend: 3000
      },
      valueBreakdown: {
        headlineValue: 600,
        headlineLabel: 'Welcome bonus',
        annualFee: 95,
        benefitAdjustment: 0
      }
    };

    const ranked = rankPlannerRecommendationsByPriority([low, high]);
    expect(ranked[0].id).toBe('card:high-priority');
    expect(ranked[1].id).toBe('card:low-priority');
  });
});

describe('buildPlanRecommendations', () => {
  it('builds both card and banking lanes from planner and banking seed data', async () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'sample-card',
        name: 'Sample Card',
        issuer: 'Sample Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 95,
        creditTierMin: 'good',
        headline: 'Sample headline',
        score: 8,
        bestSignUpBonusValue: 800,
        bestSignUpBonusSpendRequired: 4000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 600,
        plannerBenefitsValue: 250
      }
    ];

    const bankingBonuses = (await getBankingBonusesData()).bonuses;
    const bundle = buildPlanRecommendations(cards, bankingBonuses, makeFullInput(), {
      maxCards: 1,
      maxBanking: 1
    });

    expect(bundle.recommendations).toHaveLength(2);
    const cardRecommendation = bundle.recommendations.find((item) => item.lane === 'cards');
    const bankingRecommendation = bundle.recommendations.find((item) => item.lane === 'banking');

    expect(cardRecommendation).toMatchObject({
      id: 'card:sample-card',
      kind: 'card_bonus',
      detailPath: '/cards/sample-card',
      estimatedNetValue: 830
    });
    expect(cardRecommendation?.valueBreakdown).toEqual({
      headlineValue: 800,
      headlineLabel: 'Welcome bonus',
      benefitAdjustment: 125,
      annualFee: 95
    });
    expect(cardRecommendation?.keyRequirements[0]).toContain('$4,000');

    expect(bankingRecommendation).toBeDefined();
    expect(bankingRecommendation?.lane).toBe('banking');
    expect(bankingRecommendation?.kind).toBe('bank_bonus');
    expect(bankingRecommendation?.detailPath).toContain('/banking/');
    expect(bankingRecommendation?.valueBreakdown?.headlineLabel).toBe('Bank bonus');
    expect(bundle.schedule).toHaveLength(2);
    // Remaining banking bonuses that didn't make the cut appear in scheduleIssues
    // rather than exclusions (no hard-filter exclusion reasons apply with directDeposit: 'yes')
    expect(bundle.scheduleIssues.length).toBeGreaterThan(0);
  });

  it('applies banking hard filters and returns exclusion reasons', async () => {
    const cards: RankedCardResult[] = [];
    const bankingBonuses = (await getBankingBonusesData()).bonuses;

    const bundle = buildPlanRecommendations(
      cards,
      bankingBonuses,
      makeFullInput({ directDeposit: 'no' }),
      { maxBanking: 5 }
    );

    expect(bundle.recommendations.some((item) => item.lane === 'banking')).toBe(true);
    expect(
      bundle.exclusions.some((item) => item.reasons.includes('direct_deposit_required'))
    ).toBe(true);
  });

  it('keeps only business banking offers when the planner audience is business', () => {
    const bundle = buildPlanRecommendations(
      [],
      [
        createBankingListItem({
          slug: 'personal-offer',
          customerType: 'personal'
        }),
        createBankingListItem({
          slug: 'business-offer',
          customerType: 'business'
        })
      ],
      makeFullInput({ audience: 'business' }),
      { maxBanking: 5 }
    );

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['bank:business-offer']);
  });

  it('keeps only personal banking offers when the planner audience is consumer', () => {
    const bundle = buildPlanRecommendations(
      [],
      [
        createBankingListItem({
          slug: 'personal-offer',
          customerType: 'personal'
        }),
        createBankingListItem({
          slug: 'business-offer',
          customerType: 'business'
        })
      ],
      makeFullInput(),
      { maxBanking: 5 }
    );

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['bank:personal-offer']);
  });

  it('excludes bank offers that are not available in the selected state', async () => {
    const cards: RankedCardResult[] = [];
    const bankingBonuses = (await getBankingBonusesData()).bonuses;

    const bundle = buildPlanRecommendations(
      cards,
      bankingBonuses,
      makeFullInput({ state: 'NY' }),
      { maxBanking: 5 }
    );

    expect(
      bundle.exclusions.some(
        (item) =>
          item.id === 'bank:maple-street-checking-225' &&
          item.reasons.includes('state_restricted')
      )
    ).toBe(true);
  });

  it('keeps only the strongest eligible offer per bank in planner output', () => {
    const cards: RankedCardResult[] = [];
    const bankingBonuses = [
      createBankingListItem({
        slug: 'same-bank-low',
        bankName: 'Example Bank',
        offerName: 'Example Low',
        bonusAmount: 300,
        estimatedNetValue: 300
      }),
      createBankingListItem({
        slug: 'same-bank-high',
        bankName: 'Example Bank',
        offerName: 'Example High',
        bonusAmount: 600,
        estimatedNetValue: 600,
        minimumOpeningDeposit: 5000
      }),
      createBankingListItem({
        slug: 'other-bank',
        bankName: 'Other Bank',
        offerName: 'Other Bank Offer',
        bonusAmount: 350,
        estimatedNetValue: 350
      })
    ];

    const bundle = buildPlanRecommendations(cards, bankingBonuses, makeFullInput(), {
      maxBanking: 3
    });

    expect(bundle.recommendations.filter((item) => item.lane === 'banking').map((item) => item.id)).toContain(
      'bank:same-bank-high'
    );
    expect(
      bundle.recommendations.filter((item) => item.lane === 'banking').map((item) => item.id)
    ).not.toContain('bank:same-bank-low');
  });

  it('applies card hard filters and excludes mismatched offers', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'premium-card',
        name: 'Premium Card',
        issuer: 'Premium Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'points',
        topCategories: ['travel'],
        annualFee: 550,
        creditTierMin: 'excellent',
        headline: 'Premium',
        score: 7,
        bestSignUpBonusValue: 1000,
        bestSignUpBonusSpendRequired: 5000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 1200,
        plannerBenefitsValue: 250
      },
      {
        slug: 'no-bonus-card',
        name: 'No Bonus Card',
        issuer: 'Basic Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'building',
        headline: 'No bonus',
        score: 6,
        bestSignUpBonusValue: 0,
        bestSignUpBonusSpendRequired: 0,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      }
    ];

    const bundle = buildPlanRecommendations(cards, [], makeCardsOnlyInput({ credit: 'good' }));

    // Premium card excluded for credit tier (requires excellent, user has good)
    // No-bonus card excluded for having no signup bonus
    expect(bundle.exclusions.some((item) => item.reasons.includes('credit_tier'))).toBe(true);
    expect(bundle.exclusions.some((item) => item.reasons.includes('no_signup_bonus'))).toBe(true);
  });

  it('does not exclude cards by hidden credit defaults for the full planner question set', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'premium-card',
        name: 'Premium Card',
        issuer: 'Premium Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'points',
        topCategories: ['travel'],
        annualFee: 550,
        creditTierMin: 'excellent',
        headline: 'Premium',
        score: 0,
        bestSignUpBonusValue: 1000,
        bestSignUpBonusSpendRequired: 5000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 1200,
        plannerBenefitsValue: 250
      }
    ];

    const bundle = buildPlanRecommendations(
      cards,
      [],
      makeFullInput(),
      {
        maxCards: 1,
        maxBanking: 0
      }
    );

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['card:premium-card']);
    expect(bundle.exclusions.some((item) => item.reasons.includes('credit_tier'))).toBe(false);
  });

  it('skips cards the user already has open', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'owned-card',
        name: 'Owned Card',
        issuer: 'Sample Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'good',
        headline: 'Owned',
        score: 9,
        bestSignUpBonusValue: 500,
        bestSignUpBonusSpendRequired: 1000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      },
      {
        slug: 'new-card',
        name: 'New Card',
        issuer: 'Sample Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'good',
        headline: 'New',
        score: 8,
        bestSignUpBonusValue: 400,
        bestSignUpBonusSpendRequired: 1000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      }
    ];

    const bundle = buildPlanRecommendations(
      cards,
      [],
      makeCardsOnlyInput({ ownedCardSlugs: ['owned-card'] })
    );

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['card:new-card']);
  });

  it('excludes prior Amex cards under the lifetime rule', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'amex-gold-card',
        name: 'American Express Gold Card',
        issuer: 'American Express',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'points',
        topCategories: ['dining'],
        annualFee: 325,
        creditTierMin: 'good',
        headline: 'Amex Gold',
        score: 9,
        bestSignUpBonusValue: 900,
        bestSignUpBonusSpendRequired: 6000,
        bestSignUpBonusSpendPeriodDays: 180,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      }
    ];

    const bundle = buildPlanRecommendations(
      cards,
      [],
      makeCardsOnlyInput({ amexLifetimeBlockedSlugs: ['amex-gold-card'] })
    );

    expect(bundle.recommendations).toHaveLength(0);
    expect(bundle.exclusions.some((item) => item.reasons.includes('amex_lifetime_rule'))).toBe(true);
  });

  it('excludes Chase cards when the user is at or over 5/24', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'chase-sapphire-preferred',
        name: 'Chase Sapphire Preferred Card',
        issuer: 'Chase',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'points',
        topCategories: ['travel'],
        annualFee: 95,
        creditTierMin: 'good',
        headline: 'Chase Sapphire Preferred',
        score: 9,
        bestSignUpBonusValue: 750,
        bestSignUpBonusSpendRequired: 4000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      }
    ];

    const bundle = buildPlanRecommendations(
      cards,
      [],
      makeCardsOnlyInput({ chase524Status: 'at_or_over_5_24' })
    );

    expect(bundle.recommendations).toHaveLength(0);
    expect(bundle.exclusions.some((item) => item.reasons.includes('chase_5_24'))).toBe(true);
  });

  it('excludes banking offers when the user already banks there', async () => {
    const bankingBonuses = (await getBankingBonusesData()).bonuses;
    const summitOffer = bankingBonuses.find((b) => b.slug === 'summit-national-checking-300');
    expect(summitOffer).toBeDefined();

    const bundle = buildPlanRecommendations(
      [],
      bankingBonuses,
      makeFullInput({ ownedBankNames: ['Summit National Bank'] }),
      { maxBanking: 5 }
    );

    expect(
      bundle.exclusions.some(
        (item) =>
          item.id === 'bank:summit-national-checking-300' &&
          item.reasons.includes('existing_bank')
      )
    ).toBe(true);
  });

  it('excludes banking offers when opening deposit exceeds available cash', async () => {
    const bankingBonuses = (await getBankingBonusesData()).bonuses;
    // atlas-online-savings-250 requires $15,000 opening deposit
    const atlasOffer = bankingBonuses.find((b) => b.slug === 'atlas-online-savings-250');
    expect(atlasOffer).toBeDefined();

    const bundle = buildPlanRecommendations(
      [],
      bankingBonuses,
      makeFullInput({ availableCash: 'from_2501_to_9999' }),
      { maxBanking: 5 }
    );

    expect(
      bundle.exclusions.some(
        (item) =>
          item.id === 'bank:atlas-online-savings-250' &&
          item.reasons.includes('insufficient_cash')
      )
    ).toBe(true);
  });

  it('does not exclude banking offers when available cash covers the deposit', async () => {
    const bankingBonuses = (await getBankingBonusesData()).bonuses;

    const bundle = buildPlanRecommendations(
      [],
      bankingBonuses,
      makeFullInput({ availableCash: 'at_least_10000' }),
      { maxBanking: 5 }
    );

    expect(
      bundle.exclusions.some(
        (item) =>
          item.id === 'bank:atlas-online-savings-250' &&
          item.reasons.includes('insufficient_cash')
      )
    ).toBe(false);
  });

  it('prioritizes a selected eligible offer within the same lane', () => {
    const cards: RankedCardResult[] = [
      {
        slug: 'top-card',
        name: 'Top Card',
        issuer: 'Sample Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'good',
        headline: 'Top',
        score: 10,
        bestSignUpBonusValue: 700,
        bestSignUpBonusSpendRequired: 3000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      },
      {
        slug: 'selected-card',
        name: 'Selected Card',
        issuer: 'Sample Bank',
        imageAssetType: 'text_fallback',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'good',
        headline: 'Selected',
        score: 4,
        bestSignUpBonusValue: 400,
        bestSignUpBonusSpendRequired: 1000,
        bestSignUpBonusSpendPeriodDays: 90,
        totalBenefitsValue: 0,
        plannerBenefitsValue: 0
      }
    ];

    const bundle = buildPlanRecommendations(cards, [], makeCardsOnlyInput(), {
      maxCards: 1,
      maxBanking: 0,
      selectedOfferIntent: {
        lane: 'cards',
        slug: 'selected-card',
        title: 'Selected Card',
        provider: 'Sample Bank',
        detailPath: '/cards/selected-card',
        sourcePath: '/cards'
      }
    });

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['card:selected-card']);
  });

  it('keeps a selected eligible personal card reachable in consumer full-planner mode', () => {
    const rankedCards = rankPlannerResults(
      [
        ...Array.from({ length: 12 }, (_, index) =>
          makeCardRecord({
            slug: `higher-value-card-${index}`,
            name: `Higher Value Card ${index}`,
            issuer: 'Sample Bank',
            bestSignUpBonusValue: 1000 - index * 10,
            bestSignUpBonusSpendRequired: 3000,
            bestSignUpBonusSpendPeriodDays: 90
          })
        ),
        makeCardRecord({
          slug: 'selected-card',
          name: 'Selected Card',
          issuer: 'Sample Bank',
          bestSignUpBonusValue: 250,
          bestSignUpBonusSpendRequired: 1000,
          bestSignUpBonusSpendPeriodDays: 90
        })
      ],
      makeFullInput()
    );

    const bundle = buildPlanRecommendations(rankedCards, [], makeFullInput(), {
      maxCards: 1,
      maxBanking: 0,
      selectedOfferIntent: {
        lane: 'cards',
        slug: 'selected-card',
        title: 'Selected Card',
        provider: 'Sample Bank',
        detailPath: '/cards/selected-card',
        sourcePath: '/cards'
      }
    });

    expect(bundle.recommendations.map((item) => item.id)).toEqual(['card:selected-card']);
  });
});
