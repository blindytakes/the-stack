import { describe, expect, it } from 'vitest';
import { rankQuizResults, quizRequestSchema } from '../quiz-engine';
import type { QuizRequest } from '../quiz-engine';
import type { CardRecord } from '../cards';

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: 'test-card',
    name: 'Test Card',
    issuer: 'TestBank',
    cardType: 'personal',
    rewardType: 'cashback',
    topCategories: ['dining'],
    annualFee: 0,
    creditTierMin: 'good',
    headline: 'A test card',
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

  it('returns at most 3 results', () => {
    const input: QuizRequest = { goal: 'flexibility', spend: 'dining', fee: 'over_95_ok', credit: 'excellent' };
    const results = rankQuizResults(cards, input);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('filters by credit tier eligibility', () => {
    const input: QuizRequest = { goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'fair' };
    const results = rankQuizResults(cards, input);
    // 'fair' credit (rank 2) can only access cards with creditTierMin fair (2) or building (1)
    expect(results.every((r) => ['fair', 'building'].includes(r.creditTierMin))).toBe(true);
  });

  it('favors matching goal reward type', () => {
    const input: QuizRequest = { goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' };
    const results = rankQuizResults(cards, input);
    // cashback-dining should score highest: goal match + category match + fee match
    expect(results[0].slug).toBe('cashback-dining');
  });

  it('favors matching spend category', () => {
    const input: QuizRequest = { goal: 'travel', spend: 'travel', fee: 'up_to_95', credit: 'good' };
    const results = rankQuizResults(cards, input);
    // travel-points has goal match + category match + fee match
    expect(results[0].slug).toBe('travel-points');
  });

  it('penalizes annual fee when user wants no fee', () => {
    const input: QuizRequest = { goal: 'flexibility', spend: 'travel', fee: 'no_fee', credit: 'excellent' };
    const results = rankQuizResults(cards, input);
    // Cards with annualFee > 0 get score penalty
    const freeCards = results.filter((r) => r.annualFee === 0);
    const paidCards = results.filter((r) => r.annualFee > 0);
    if (freeCards.length > 0 && paidCards.length > 0) {
      expect(freeCards[0].score).toBeGreaterThanOrEqual(paidCards[0].score);
    }
  });

  it('includes score property on results', () => {
    const input: QuizRequest = { goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' };
    const results = rankQuizResults(cards, input);
    results.forEach((r) => {
      expect(typeof r.score).toBe('number');
    });
  });

  it('returns results sorted by score descending', () => {
    const input: QuizRequest = { goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'excellent' };
    const results = rankQuizResults(cards, input);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('returns empty array when no cards are eligible', () => {
    const input: QuizRequest = { goal: 'cashback', spend: 'dining', fee: 'no_fee', credit: 'building' };
    // Only 'secured-starter' has creditTierMin 'building'
    const restrictedCards = [
      makeCard({ slug: 'premium-only', creditTierMin: 'excellent' })
    ];
    const results = rankQuizResults(restrictedCards, input);
    expect(results).toHaveLength(0);
  });
});

describe('quizRequestSchema', () => {
  it('validates a correct request', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'cashback',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good'
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid goal', () => {
    const parsed = quizRequestSchema.safeParse({
      goal: 'invalid',
      spend: 'dining',
      fee: 'no_fee',
      credit: 'good'
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const parsed = quizRequestSchema.safeParse({ goal: 'cashback' });
    expect(parsed.success).toBe(false);
  });
});
