import { describe, expect, it } from 'vitest';
import { buildPlanResultsPayload } from '../plan-results-storage';
import {
  buildSelectedOfferIntentHref,
  getSelectedOfferIntentStatus
} from '../selected-offer-intent';

const basePayload = buildPlanResultsPayload({
  answers: {
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
    ownedBankNames: []
  },
  selectedOfferIntent: {
    lane: 'banking',
    slug: 'summit-national-checking-300',
    title: 'Summit National Checking Bonus',
    provider: 'Summit National Bank',
    detailPath: '/banking/summit-national-checking-300',
    sourcePath: '/banking'
  },
  recommendations: [],
  exclusions: []
});

describe('selected-offer-intent', () => {
  it('builds a planner href that preserves the selected offer slug', () => {
    expect(
      buildSelectedOfferIntentHref({ lane: 'cards', slug: 'amex-gold-card' })
    ).toBe('/tools/card-finder?mode=full&selectedLane=cards&selectedSlug=amex-gold-card');
  });

  it('returns included status when the selected offer is in recommendations', () => {
    const result = getSelectedOfferIntentStatus({
      ...basePayload,
      recommendations: [
        {
          id: 'bank:summit-national-checking-300',
          lane: 'banking',
          kind: 'bank_bonus',
          title: 'Summit National Checking Bonus',
          provider: 'Summit National Bank',
          estimatedNetValue: 288,
          priorityScore: 500,
          effort: 'low',
          detailPath: '/banking/summit-national-checking-300',
          keyRequirements: ['Open account'],
          scheduleConstraints: {
            activeDays: 60,
            payoutLagDays: 30,
            requiredDeposit: 100
          }
        }
      ],
      scheduleIssues: []
    });

    expect(result).toEqual({
      status: 'included',
      intent: basePayload.selectedOfferIntent,
      recommendationId: 'bank:summit-national-checking-300'
    });
  });

  it('returns excluded status when the selected offer is hard-filtered', () => {
    const result = getSelectedOfferIntentStatus({
      ...basePayload,
      exclusions: [
        {
          id: 'bank:summit-national-checking-300',
          lane: 'banking',
          title: 'Summit National Checking Bonus',
          provider: 'Summit National Bank',
          reasons: ['existing_bank']
        }
      ],
      scheduleIssues: []
    });

    expect(result?.status).toBe('excluded');
    if (result?.status === 'excluded') {
      expect(result.reasons).toEqual(['existing_bank']);
    }
  });

  it('returns deferred status when the selected offer stays eligible but misses the schedule', () => {
    const result = getSelectedOfferIntentStatus({
      ...basePayload,
      scheduleIssues: [
        {
          recommendationId: 'bank:summit-national-checking-300',
          lane: 'banking',
          reason: 'direct_deposit_slot'
        }
      ]
    });

    expect(result).toEqual({
      status: 'deferred',
      intent: basePayload.selectedOfferIntent,
      recommendationId: 'bank:summit-national-checking-300',
      reason: 'direct_deposit_slot'
    });
  });

  it('returns missing status when the selected offer is not represented in final results', () => {
    const result = getSelectedOfferIntentStatus({
      ...basePayload,
      scheduleIssues: []
    });

    expect(result).toEqual({
      status: 'missing',
      intent: basePayload.selectedOfferIntent,
      recommendationId: 'bank:summit-national-checking-300'
    });
  });
});
