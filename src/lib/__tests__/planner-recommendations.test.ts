import { describe, expect, it } from 'vitest';
import type { QuizRequest, QuizResult } from '../quiz-engine';
import {
  buildPlanRecommendationsFromQuiz,
  rankPlannerRecommendationsByPriority,
  rankPlannerRecommendationsByValue,
  toPlannerRecommendationFromBankingBonus,
  toPlannerRecommendationFromCard
} from '../planner-recommendations';
import { getBankingBonusesData } from '../banking-bonuses';

const baseInput: QuizRequest = {
  goal: 'cashback',
  spend: 'dining',
  fee: 'up_to_95',
  credit: 'good',
  directDeposit: 'yes',
  state: 'NY',
  openingCash: 'from_2000_to_10000'
};

describe('toPlannerRecommendationFromCard', () => {
  it('maps card inputs into normalized planner recommendation fields', () => {
    const recommendation = toPlannerRecommendationFromCard({
      slug: 'sample-card',
      name: 'Sample Rewards Card',
      issuer: 'Sample Bank',
      annualFee: 95,
      creditTierMin: 'good',
      bonusValue: 750,
      spendRequired: 4000,
      spendPeriodDays: 90
    });

    expect(recommendation.id).toBe('card:sample-card');
    expect(recommendation.lane).toBe('cards');
    expect(recommendation.kind).toBe('card_bonus');
    expect(recommendation.estimatedNetValue).toBe(655);
    expect(recommendation.detailPath).toBe('/cards/sample-card');
    expect(recommendation.keyRequirements[0]).toContain('$4,000');
  });
});

describe('toPlannerRecommendationFromBankingBonus', () => {
  it('maps banking bonus records into normalized planner recommendation fields', async () => {
    const { bonuses } = await getBankingBonusesData();
    const offer = bonuses.find((bonus) => bonus.slug === 'summit-national-checking-300');
    expect(offer).toBeDefined();
    if (!offer) return;

    const recommendation = toPlannerRecommendationFromBankingBonus(offer);

    expect(recommendation.id).toBe('bank:summit-national-checking-300');
    expect(recommendation.lane).toBe('banking');
    expect(recommendation.kind).toBe('bank_bonus');
    expect(recommendation.estimatedNetValue).toBe(288);
    expect(recommendation.detailPath).toBe('/banking/summit-national-checking-300');
    expect(recommendation.keyRequirements.some((item) => item.includes('direct deposit'))).toBe(true);
  });
});

describe('rankPlannerRecommendationsByValue', () => {
  it('returns recommendations sorted by estimated net value descending', () => {
    const low = toPlannerRecommendationFromCard({
      slug: 'low',
      name: 'Low Value',
      issuer: 'Sample',
      annualFee: 0,
      creditTierMin: 'building',
      bonusValue: 150,
      spendRequired: 500,
      spendPeriodDays: 60
    });

    const high = toPlannerRecommendationFromCard({
      slug: 'high',
      name: 'High Value',
      issuer: 'Sample',
      annualFee: 95,
      creditTierMin: 'excellent',
      bonusValue: 900,
      spendRequired: 5000,
      spendPeriodDays: 90
    });

    const ranked = rankPlannerRecommendationsByValue([low, high]);
    expect(ranked[0].id).toBe('card:high');
    expect(ranked[1].id).toBe('card:low');
  });
});

describe('rankPlannerRecommendationsByPriority', () => {
  it('returns recommendations sorted by priority score descending', () => {
    const low = {
      ...toPlannerRecommendationFromCard({
        slug: 'low-priority',
        name: 'Low Priority',
        issuer: 'Sample',
        annualFee: 0,
        creditTierMin: 'building',
        bonusValue: 200,
        spendRequired: 500,
        spendPeriodDays: 90
      }),
      priorityScore: 120
    };
    const high = {
      ...toPlannerRecommendationFromCard({
        slug: 'high-priority',
        name: 'High Priority',
        issuer: 'Sample',
        annualFee: 95,
        creditTierMin: 'good',
        bonusValue: 600,
        spendRequired: 3000,
        spendPeriodDays: 90
      }),
      priorityScore: 220
    };

    const ranked = rankPlannerRecommendationsByPriority([low, high]);
    expect(ranked[0].id).toBe('card:high-priority');
    expect(ranked[1].id).toBe('card:low-priority');
  });
});

describe('buildPlanRecommendationsFromQuiz', () => {
  it('builds both card and banking lanes from quiz and banking seed data', async () => {
    const cards: QuizResult[] = [
      {
        slug: 'sample-card',
        name: 'Sample Card',
        issuer: 'Sample Bank',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 95,
        creditTierMin: 'good',
        headline: 'Sample headline',
        score: 8,
        bestSignUpBonusValue: 800,
        bestSignUpBonusSpendRequired: 4000,
        bestSignUpBonusSpendPeriodDays: 90
      }
    ];

    const bankingBonuses = (await getBankingBonusesData()).bonuses;
    const bundle = buildPlanRecommendationsFromQuiz(cards, bankingBonuses, baseInput, {
      maxCards: 1,
      maxBanking: 1
    });

    expect(bundle.recommendations).toHaveLength(2);
    expect(bundle.recommendations.some((item) => item.lane === 'cards')).toBe(true);
    expect(bundle.recommendations.some((item) => item.lane === 'banking')).toBe(true);
    expect(bundle.exclusions.some((item) => item.lane === 'banking')).toBe(true);
  });

  it('applies banking hard filters and returns exclusion reasons', async () => {
    const cards: QuizResult[] = [];
    const bankingBonuses = (await getBankingBonusesData()).bonuses;

    const bundle = buildPlanRecommendationsFromQuiz(
      cards,
      bankingBonuses,
      {
        ...baseInput,
        directDeposit: 'no',
        openingCash: 'lt_2000'
      },
      { maxBanking: 5 }
    );

    expect(bundle.recommendations.some((item) => item.lane === 'banking')).toBe(true);
    expect(
      bundle.exclusions.some((item) => item.reasons.includes('direct_deposit_required'))
    ).toBe(true);
    expect(
      bundle.exclusions.some((item) => item.reasons.includes('opening_deposit_too_high'))
    ).toBe(true);
  });

  it('applies card hard filters and excludes mismatched offers', () => {
    const cards: QuizResult[] = [
      {
        slug: 'premium-card',
        name: 'Premium Card',
        issuer: 'Premium Bank',
        cardType: 'personal',
        rewardType: 'points',
        topCategories: ['travel'],
        annualFee: 550,
        creditTierMin: 'excellent',
        headline: 'Premium',
        score: 7,
        bestSignUpBonusValue: 1000,
        bestSignUpBonusSpendRequired: 5000,
        bestSignUpBonusSpendPeriodDays: 90
      },
      {
        slug: 'no-bonus-card',
        name: 'No Bonus Card',
        issuer: 'Basic Bank',
        cardType: 'personal',
        rewardType: 'cashback',
        topCategories: ['dining'],
        annualFee: 0,
        creditTierMin: 'building',
        headline: 'No bonus',
        score: 6,
        bestSignUpBonusValue: 0,
        bestSignUpBonusSpendRequired: 0,
        bestSignUpBonusSpendPeriodDays: 90
      }
    ];

    const bundle = buildPlanRecommendationsFromQuiz(cards, [], {
      ...baseInput,
      fee: 'no_fee',
      credit: 'good'
    });

    expect(bundle.recommendations).toHaveLength(0);
    expect(bundle.exclusions.some((item) => item.reasons.includes('fee_preference'))).toBe(true);
    expect(bundle.exclusions.some((item) => item.reasons.includes('credit_tier'))).toBe(true);
    expect(bundle.exclusions.some((item) => item.reasons.includes('no_signup_bonus'))).toBe(true);
  });
});
