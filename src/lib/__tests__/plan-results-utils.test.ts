import { describe, expect, it } from 'vitest';
import { getFeaturedPlanRecommendations } from '../../components/plan/plan-results-utils';
import type { PlannerRecommendation } from '../planner-recommendations';

function makeRecommendation(
  id: string,
  lane: 'cards' | 'banking'
): PlannerRecommendation {
  return {
    id,
    lane,
    kind: lane === 'cards' ? 'card_bonus' : 'bank_bonus',
    title: id,
    provider: lane === 'cards' ? 'Card Issuer' : 'Bank',
    estimatedNetValue: 500,
    priorityScore: 100,
    effort: 'low',
    detailPath: lane === 'cards' ? `/cards/${id}` : `/banking/${id}`,
    keyRequirements: [],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: lane === 'cards' ? 30 : 21
    }
  };
}

describe('getFeaturedPlanRecommendations', () => {
  it('balances the featured set across cards and banking when both lanes are available', () => {
    const recommendations = [
      makeRecommendation('bank-1', 'banking'),
      makeRecommendation('bank-2', 'banking'),
      makeRecommendation('bank-3', 'banking'),
      makeRecommendation('card-1', 'cards'),
      makeRecommendation('card-2', 'cards'),
      makeRecommendation('card-3', 'cards')
    ];

    const featured = getFeaturedPlanRecommendations(recommendations);

    expect(featured.map((item) => item.id)).toEqual(['bank-1', 'bank-2', 'card-1', 'card-2']);
  });

  it('backfills from the stronger lane when the other lane has fewer than two moves', () => {
    const recommendations = [
      makeRecommendation('bank-1', 'banking'),
      makeRecommendation('bank-2', 'banking'),
      makeRecommendation('bank-3', 'banking'),
      makeRecommendation('card-1', 'cards')
    ];

    const featured = getFeaturedPlanRecommendations(recommendations);

    expect(featured.map((item) => item.id)).toEqual(['bank-1', 'bank-2', 'bank-3', 'card-1']);
  });

  it('keeps an included selected offer visible by replacing another move from the same lane', () => {
    const recommendations = [
      makeRecommendation('bank-1', 'banking'),
      makeRecommendation('bank-2', 'banking'),
      makeRecommendation('bank-3', 'banking'),
      makeRecommendation('card-1', 'cards'),
      makeRecommendation('card-2', 'cards'),
      makeRecommendation('card-3', 'cards')
    ];

    const featured = getFeaturedPlanRecommendations(recommendations, {
      selectedRecommendationId: 'bank-3'
    });

    expect(featured.map((item) => item.id)).toEqual(['bank-1', 'bank-3', 'card-1', 'card-2']);
  });
});
