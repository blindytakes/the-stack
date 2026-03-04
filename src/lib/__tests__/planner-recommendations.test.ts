import { describe, expect, it } from 'vitest';
import type { QuizResult } from '../quiz-engine';
import {
  buildPlanRecommendationsFromQuiz,
  rankPlannerRecommendationsByValue,
  toPlannerRecommendationFromBankingBonus,
  toPlannerRecommendationFromCard
} from '../planner-recommendations';
import { getBankingBonusesData } from '../banking-bonuses';

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
  it('maps banking bonus records into normalized planner recommendation fields', () => {
    const { bonuses } = getBankingBonusesData();
    const offer = bonuses.find((bonus) => bonus.slug === 'summit-national-checking-300');
    expect(offer).toBeDefined();
    if (!offer) return;

    const recommendation = toPlannerRecommendationFromBankingBonus(offer);

    expect(recommendation.id).toBe('bank:summit-national-checking-300');
    expect(recommendation.lane).toBe('banking');
    expect(recommendation.kind).toBe('bank_bonus');
    expect(recommendation.estimatedNetValue).toBe(288);
    expect(recommendation.detailPath).toBe('/banking?offer=summit-national-checking-300');
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

describe('buildPlanRecommendationsFromQuiz', () => {
  it('builds both card and banking lanes from quiz and banking seed data', () => {
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

    const bankingBonuses = getBankingBonusesData().bonuses;
    const recommendations = buildPlanRecommendationsFromQuiz(cards, bankingBonuses, {
      maxCards: 1,
      maxBanking: 1
    });

    expect(recommendations).toHaveLength(2);
    expect(recommendations.some((item) => item.lane === 'cards')).toBe(true);
    expect(recommendations.some((item) => item.lane === 'banking')).toBe(true);
  });
});
