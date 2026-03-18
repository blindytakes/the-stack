import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildPlanResultsPayload,
  clearPlanResults,
  loadPlanResults,
  savePlanResults
} from '../plan-results-storage';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    }
  };
}

function installWindow() {
  const sessionStorage = createMemoryStorage();
  const localStorage = createMemoryStorage();
  vi.stubGlobal('window', {
    sessionStorage,
    localStorage
  });
  return { sessionStorage, localStorage };
}

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
  recommendations: [
    {
      id: 'card:test',
      lane: 'cards',
      kind: 'card_bonus',
      title: 'Test Card',
      provider: 'Test Bank',
      estimatedNetValue: 500,
      valueBreakdown: {
        headlineValue: 750,
        headlineLabel: 'Welcome bonus',
        benefitAdjustment: 125,
        annualFee: 375
      },
      priorityScore: 620,
      effort: 'medium',
      detailPath: '/cards/test',
      timelineDays: 90,
      keyRequirements: ['Spend $4,000 in 3 months'],
      scheduleConstraints: {
        activeDays: 90,
        payoutLagDays: 30,
        requiredSpend: 4000
      }
    }
  ],
  exclusions: [],
  schedule: [
    {
      recommendationId: 'card:test',
      lane: 'cards',
      startAt: Date.now(),
      completeAt: Date.now() + 1000,
      payoutAt: Date.now() + 2000
    }
  ]
});

describe('plan-results-storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and loads fresh plan results from session storage', () => {
    installWindow();

    savePlanResults(basePayload);
    const loaded = loadPlanResults();

    expect(loaded.status).toBe('fresh');
    if (loaded.status === 'fresh') {
      expect(loaded.source).toBe('session');
      expect(loaded.payload.answers.goal).toBe('cashback');
    }
  });

  it('recovers from local storage when session payload is missing', () => {
    const { localStorage } = installWindow();
    localStorage.setItem('thestack.plan.results.backup.v1', JSON.stringify(basePayload));

    const loaded = loadPlanResults();
    expect(loaded.status).toBe('recovered');
  });

  it('marks stale payloads as stale', () => {
    const { sessionStorage } = installWindow();
    sessionStorage.setItem(
      'thestack.plan.results.v1',
      JSON.stringify({
        ...basePayload,
        savedAt: Date.now() - 1000 * 60 * 60 * 48
      })
    );

    const loaded = loadPlanResults();
    expect(loaded.status).toBe('stale');
  });

  it('clears saved plan keys', () => {
    const { sessionStorage, localStorage } = installWindow();
    sessionStorage.setItem('thestack.plan.results.v1', JSON.stringify(basePayload));
    localStorage.setItem('thestack.plan.results.backup.v1', JSON.stringify(basePayload));

    clearPlanResults();

    expect(sessionStorage.getItem('thestack.plan.results.v1')).toBeNull();
    expect(localStorage.getItem('thestack.plan.results.backup.v1')).toBeNull();
  });
});
