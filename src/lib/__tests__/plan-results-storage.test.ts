import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function createThrowingStorage() {
  return {
    getItem() {
      throw new Error('Storage unavailable');
    },
    setItem() {
      throw new Error('Storage unavailable');
    },
    removeItem() {
      throw new Error('Storage unavailable');
    }
  };
}

function installWindow(overrides?: {
  sessionStorage?: ReturnType<typeof createMemoryStorage> | ReturnType<typeof createThrowingStorage>;
  localStorage?: ReturnType<typeof createMemoryStorage> | ReturnType<typeof createThrowingStorage>;
}) {
  const sessionStorage = overrides?.sessionStorage ?? createMemoryStorage();
  const localStorage = overrides?.localStorage ?? createMemoryStorage();
  vi.stubGlobal('window', {
    sessionStorage,
    localStorage
  });
  return { sessionStorage, localStorage };
}

const basePayload = buildPlanResultsPayload({
  plannerContext: {
    mode: 'full',
    audience: 'consumer',
    monthlySpend: 'from_2500_to_5000',
    directDeposit: 'yes',
    state: 'NY',
    ownedCardSlugs: [],
    availableCash: 'from_2501_to_9999',
    ownedBankNames: [],
    amexLifetimeBlockedSlugs: [],
    chase524Status: 'not_sure'
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
  selectedOfferIntent: {
    lane: 'cards',
    slug: 'test',
    title: 'Test Card',
    provider: 'Test Bank',
    detailPath: '/cards/test',
    sourcePath: '/cards'
  },
  schedule: [
    {
      recommendationId: 'card:test',
      lane: 'cards',
      startAt: Date.now(),
      completeAt: Date.now() + 1000,
      payoutAt: Date.now() + 2000
    }
  ],
  scheduleIssues: [
    {
      recommendationId: 'card:test',
      lane: 'cards',
      reason: 'lane_limit'
    }
  ]
});

describe('plan-results-storage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('saves and loads fresh plan results from session storage', () => {
    installWindow();

    savePlanResults(basePayload);
    const loaded = loadPlanResults();

    expect(loaded.status).toBe('fresh');
    if (loaded.status === 'fresh') {
      expect(loaded.source).toBe('session');
      expect(loaded.payload.plannerContext.mode).toBe('full');
      expect(loaded.payload.plannerContext.audience).toBe('consumer');
      expect(loaded.payload.selectedOfferIntent?.slug).toBe('test');
      expect(loaded.payload.scheduleIssues[0]?.reason).toBe('lane_limit');
    }
  });

  it('ignores unsupported stored payload versions', () => {
    const { sessionStorage } = installWindow();
    sessionStorage.setItem(
      'thestack.plan.results.v2',
      JSON.stringify({
        version: 1,
        savedAt: basePayload.savedAt,
        answers: {
          audience: 'consumer',
          goal: 'cashback',
          spend: 'dining',
          fee: 'up_to_95',
          credit: 'good',
          ownedCardSlugs: [],
          amexLifetimeBlockedSlugs: [],
          chase524Status: 'not_sure',
          directDeposit: 'no',
          state: 'OT',
          monthlySpend: 'from_2500_to_5000',
          pace: 'balanced',
          availableCash: 'from_2501_to_9999',
          ownedBankNames: []
        },
        selectedOfferIntent: basePayload.selectedOfferIntent,
        recommendations: basePayload.recommendations,
        consideredRecommendations: basePayload.consideredRecommendations,
        exclusions: basePayload.exclusions,
        schedule: basePayload.schedule,
        scheduleIssues: basePayload.scheduleIssues
      })
    );

    const loaded = loadPlanResults();
    expect(loaded.status).toBe('missing');
  });

  it('recovers from local storage when session payload is missing', () => {
    const { localStorage } = installWindow();
    localStorage.setItem('thestack.plan.results.backup.v2', JSON.stringify(basePayload));

    const loaded = loadPlanResults();
    expect(loaded.status).toBe('recovered');
  });

  it('falls back to local storage when session storage is unavailable', () => {
    const localStorage = createMemoryStorage();
    installWindow({
      sessionStorage: createThrowingStorage(),
      localStorage
    });

    savePlanResults(basePayload);
    const loaded = loadPlanResults();

    expect(loaded.status).toBe('recovered');
  });

  it('throws when no browser storage is writable', () => {
    installWindow({
      sessionStorage: createThrowingStorage(),
      localStorage: createThrowingStorage()
    });

    expect(() => savePlanResults(basePayload)).toThrow(
      'Could not save your plan in this browser. Please allow site storage and try again.'
    );
  });

  it('marks stale payloads as stale', () => {
    const { sessionStorage } = installWindow();
    sessionStorage.setItem(
      'thestack.plan.results.v2',
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
    sessionStorage.setItem('thestack.plan.results.v2', JSON.stringify(basePayload));
    localStorage.setItem('thestack.plan.results.backup.v2', JSON.stringify(basePayload));

    clearPlanResults();

    expect(sessionStorage.getItem('thestack.plan.results.v2')).toBeNull();
    expect(localStorage.getItem('thestack.plan.results.backup.v2')).toBeNull();
  });
});
