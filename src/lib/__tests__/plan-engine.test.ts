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

  it('expands the candidate pool when the initial banking cut cannot fill the lane', () => {
    const startAt = Date.UTC(2026, 0, 1);
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:dd-a',
          lane: 'banking',
          priorityScore: 600,
          estimatedNetValue: 500,
          scheduleConstraints: {
            activeDays: 140,
            payoutLagDays: 30,
            requiredDeposit: 4000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:dd-b',
          lane: 'banking',
          priorityScore: 590,
          estimatedNetValue: 490,
          scheduleConstraints: {
            activeDays: 130,
            payoutLagDays: 30,
            requiredDeposit: 3000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:dd-c',
          lane: 'banking',
          priorityScore: 580,
          estimatedNetValue: 480,
          scheduleConstraints: {
            activeDays: 120,
            payoutLagDays: 30,
            requiredDeposit: 2000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:dd-d',
          lane: 'banking',
          priorityScore: 570,
          estimatedNetValue: 470,
          scheduleConstraints: {
            activeDays: 110,
            payoutLagDays: 30,
            requiredDeposit: 1000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:flex-a',
          lane: 'banking',
          priorityScore: 250,
          estimatedNetValue: 260,
          scheduleConstraints: {
            activeDays: 45,
            payoutLagDays: 14,
            requiredDeposit: 1000,
            requiresDirectDeposit: false
          }
        }),
        makeRecommendation({
          id: 'bank:flex-b',
          lane: 'banking',
          priorityScore: 240,
          estimatedNetValue: 240,
          scheduleConstraints: {
            activeDays: 60,
            payoutLagDays: 14,
            requiredDeposit: 500,
            requiresDirectDeposit: false
          }
        })
      ],
      makeInput(),
      { startAt, maxCards: 0, maxBanking: 3, horizonDays: 180 }
    );

    expect(result.scheduled).toHaveLength(3);
    expect(result.scheduled.map((item) => item.recommendationId).sort()).toEqual([
      'bank:dd-a',
      'bank:flex-a',
      'bank:flex-b'
    ]);
    expect(result.diagnostics.initialPoolLimits.banking).toBe(4);
    expect(result.diagnostics.finalPoolLimits.banking).toBe(6);
    expect(result.diagnostics.poolExpansionRounds).toBe(1);
    expect(
      result.issues
        .filter((item) => item.recommendationId.startsWith('bank:dd-'))
        .every((item) => item.reason === 'lane_limit')
    ).toBe(true);
  });

  it('labels pool-stage cuts separately from final lane-limit decisions', () => {
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:top',
          lane: 'banking',
          priorityScore: 500,
          estimatedNetValue: 400,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiredDeposit: 3000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:mid',
          lane: 'banking',
          priorityScore: 480,
          estimatedNetValue: 390,
          scheduleConstraints: {
            activeDays: 95,
            payoutLagDays: 21,
            requiredDeposit: 2000,
            requiresDirectDeposit: true
          }
        }),
        makeRecommendation({
          id: 'bank:pool-cut',
          lane: 'banking',
          priorityScore: 470,
          estimatedNetValue: 380,
          scheduleConstraints: {
            activeDays: 100,
            payoutLagDays: 21,
            requiredDeposit: 1000,
            requiresDirectDeposit: true
          }
        })
      ],
      makeInput(),
      { maxCards: 0, maxBanking: 1, horizonDays: 120 }
    );

    expect(result.scheduled.map((item) => item.recommendationId)).toEqual(['bank:top']);
    expect(result.issues).toContainEqual({
      recommendationId: 'bank:mid',
      lane: 'banking',
      reason: 'lane_limit'
    });
    expect(result.issues).toContainEqual({
      recommendationId: 'bank:pool-cut',
      lane: 'banking',
      reason: 'candidate_pool_limit'
    });
  });

  it('labels dominated offers separately from pool-limit cuts', () => {
    const result = buildPlanSchedule(
      [
        makeRecommendation({
          id: 'bank:strong',
          lane: 'banking',
          priorityScore: 500,
          estimatedNetValue: 400,
          scheduleConstraints: {
            activeDays: 60,
            payoutLagDays: 14,
            requiredDeposit: 500,
            requiresDirectDeposit: false
          }
        }),
        makeRecommendation({
          id: 'bank:dominated',
          lane: 'banking',
          priorityScore: 450,
          estimatedNetValue: 350,
          scheduleConstraints: {
            activeDays: 90,
            payoutLagDays: 21,
            requiredDeposit: 1000,
            requiresDirectDeposit: true
          }
        })
      ],
      makeInput(),
      { maxCards: 0, maxBanking: 1, horizonDays: 120 }
    );

    expect(result.scheduled.map((item) => item.recommendationId)).toEqual(['bank:strong']);
    expect(result.issues).toContainEqual({
      recommendationId: 'bank:dominated',
      lane: 'banking',
      reason: 'dominated_offer'
    });
  });
});
