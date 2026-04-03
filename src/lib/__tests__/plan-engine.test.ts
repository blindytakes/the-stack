import { describe, expect, it } from 'vitest';
import { buildPlanSchedule, type SchedulablePlanRecommendation } from '../plan-engine';
import type { QuizRequest } from '../quiz-engine';

function makeInput(overrides: Partial<QuizRequest> = {}): QuizRequest {
  return {
    audience: 'consumer',
    goal: 'cashback',
    spend: 'dining',
    fee: 'up_to_95',
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

function makeRecommendation(
  overrides: Partial<SchedulablePlanRecommendation> = {}
): SchedulablePlanRecommendation {
  return {
    id: 'card:test',
    lane: 'cards',
    priorityScore: 100,
    estimatedNetValue: 500,
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 3000
    },
    ...overrides
  };
}

describe('buildPlanSchedule', () => {
  it('allows cards and banking offers to start together when resources differ', () => {
    const startAt = Date.UTC(2026, 0, 1);
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'card:a',
          lane: 'cards',
          priorityScore: 400,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 30,
            requiredSpend: 3000
          }
        }),
        makeRecommendation({
          id: 'bank:a',
          lane: 'banking',
          priorityScore: 390,
          scheduleConstraints: {
            activeDays: 120,
            payoutLagDays: 21,
            requiredDeposit: 2500,
            requiresDirectDeposit: true
          }
        })
      ],
      makeInput({ pace: 'aggressive' }),
      { startAt, maxCards: 2, maxBanking: 2 }
    );

    expect(result.scheduled).toHaveLength(2);
    expect(result.scheduled[0]?.startAt).toBe(startAt);
    expect(result.scheduled[1]?.startAt).toBe(startAt);
  });

  it('defers a second overlapping card when monthly spend capacity would be exceeded', () => {
    const startAt = Date.UTC(2026, 0, 1);
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'card:a',
          priorityScore: 400,
          estimatedNetValue: 550,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 30,
            requiredSpend: 6000
          }
        }),
        makeRecommendation({
          id: 'card:b',
          priorityScore: 390,
          estimatedNetValue: 650,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 30,
            requiredSpend: 7500
          }
        })
      ],
      makeInput({
        monthlySpend: 'lt_2500',
        pace: 'aggressive'
      }),
      { startAt, maxCards: 2, maxBanking: 0, horizonDays: 365 }
    );

    expect(result.scheduled).toHaveLength(2);
    expect(result.scheduled.map((item) => item.recommendationId).sort()).toEqual(['card:a', 'card:b']);
    expect(result.scheduled[1]?.startAt).toBeGreaterThanOrEqual(result.scheduled[0]!.completeAt);
  });

  it('defers a second direct-deposit banking offer until the first one clears', () => {
    const startAt = Date.UTC(2026, 0, 1);
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:a',
          lane: 'banking',
          priorityScore: 500,
          scheduleConstraints: {
            activeDays: 120,
            payoutLagDays: 21,
            requiredDeposit: 2500,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:b',
          lane: 'banking',
          priorityScore: 450,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiredDeposit: 2000,
            requiresDirectDeposit: true
          }
        })
      ],
      makeInput({ pace: 'aggressive' }),
      { startAt, maxCards: 0, maxBanking: 2, horizonDays: 365 }
    );

    expect(result.scheduled).toHaveLength(2);
    expect(result.scheduled.map((item) => item.recommendationId).sort()).toEqual(['bank:a', 'bank:b']);
    expect(result.scheduled[1]?.startAt).toBeGreaterThanOrEqual(result.scheduled[0]!.completeAt);
  });

  it('allows two banking offers to overlap when only one uses the direct-deposit slot', () => {
    const startAt = Date.UTC(2026, 0, 1);
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:dd',
          lane: 'banking',
          priorityScore: 500,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:no-dd',
          lane: 'banking',
          priorityScore: 420,
          scheduleConstraints: {
            activeDays: 60,
            payoutLagDays: 21,
            requiredDeposit: 2500,
            requiresDirectDeposit: false
          }
        })
      ],
      makeInput(),
      { startAt, maxCards: 0, maxBanking: 2, horizonDays: 180 }
    );

    expect(result.scheduled).toHaveLength(2);
    expect(result.scheduled[0]?.startAt).toBe(startAt);
    expect(result.scheduled[1]?.startAt).toBe(startAt);
  });

  it('returns a timeline overflow issue when an offer cannot fit inside the plan horizon', () => {
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:too-long',
          lane: 'banking',
          priorityScore: 300,
          scheduleConstraints: {
            activeDays: 360,
            payoutLagDays: 30,
            requiredDeposit: 1000
          }
        })
      ],
      makeInput(),
      { maxCards: 0, maxBanking: 1 }
    );

    expect(result.scheduled).toHaveLength(0);
    expect(result.issues).toEqual([
      {
        recommendationId: 'bank:too-long',
        lane: 'banking',
        reason: 'timeline_overflow'
      }
    ]);
  });

  it('chooses the globally better combination instead of the highest-priority single offer', () => {
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:big',
          lane: 'banking',
          priorityScore: 600,
          estimatedNetValue: 500,
          scheduleConstraints: {
            activeDays: 180,
            payoutLagDays: 21,
            requiredDeposit: 1500,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:small-a',
          lane: 'banking',
          priorityScore: 450,
          estimatedNetValue: 320,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiredDeposit: 1500,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:small-b',
          lane: 'banking',
          priorityScore: 440,
          estimatedNetValue: 300,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiredDeposit: 1000,
            requiresDirectDeposit: true
          }
        })
      ],
      makeInput({ pace: 'aggressive' }),
      { maxCards: 0, maxBanking: 2, horizonDays: 240 }
    );

    expect(result.scheduled).toHaveLength(2);
    expect(result.scheduled.map((item) => item.recommendationId).sort()).toEqual([
      'bank:small-a',
      'bank:small-b'
    ]);
  });
});
