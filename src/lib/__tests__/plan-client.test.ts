import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitPlannerIntake } from '../plan-client';
import type { SelectedOfferIntent } from '../plan-contract';

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

const baseRequest = {
  mode: 'full' as const,
  answers: {
    audience: 'consumer' as const,
    monthlySpend: 'from_2500_to_5000' as const,
    state: 'NY',
    availableCash: 'from_2501_to_9999' as const,
    ownedCardSlugs: [],
    ownedBankNames: []
  }
};

const selectedOfferIntent: SelectedOfferIntent = {
  lane: 'banking',
  slug: 'summit-national-checking-300',
  title: 'Summit National Checking Bonus',
  provider: 'Summit National Bank',
  detailPath: '/banking/summit-national-checking-300',
  sourcePath: '/banking'
};

describe('plan-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts mode-specific planner inputs and saves normalized planner context to storage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: 123,
        recommendations: [],
        exclusions: [],
        schedule: [],
        scheduleIssues: []
      })
    });
    vi.stubGlobal('fetch', fetchMock);
    const { sessionStorage, localStorage } = installWindow();
    const request = {
      ...baseRequest,
      options: {
        maxBanking: 2
      },
      selectedOfferIntent
    };

    const payload = await submitPlannerIntake(request);
    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe('/api/plan');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(init.body)).toEqual(request);
    expect(payload.savedAt).toBe(123);
    expect(payload.selectedOfferIntent).toEqual(selectedOfferIntent);
    expect(payload.scheduleIssues).toEqual([]);
    expect(payload.plannerContext).toEqual({
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
    });
    expect(JSON.parse(sessionStorage.getItem('thestack.plan.results.v2')!)).toEqual(payload);
    expect(JSON.parse(localStorage.getItem('thestack.plan.results.backup.v2')!)).toEqual(payload);
  });

  it('throws when the plan request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: {
          get: () => 'application/json'
        },
        json: async () => ({
          error: 'Too many plan requests. Please try again soon.'
        })
      })
    );
    installWindow();

    await expect(
      submitPlannerIntake({
        ...baseRequest
      })
    ).rejects.toThrow('Too many plan requests. Please try again soon.');
  });

  it('throws when the plan response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generatedAt: 123,
          recommendations: 'bad',
          exclusions: [],
          schedule: [],
          scheduleIssues: []
        })
      })
    );
    installWindow();

    await expect(
      submitPlannerIntake({
        ...baseRequest
      })
    ).rejects.toThrow('Plan generation returned an unexpected response.');
  });

  it('accepts relative asset paths in plan responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generatedAt: 123,
          recommendations: [
            {
              id: 'card:alaska-airlines-visa-signature',
              lane: 'cards',
              kind: 'card_bonus',
              title: 'Alaska Airlines Visa Signature',
              provider: 'Bank of America',
              imageUrl: '/card-logos/alaska-airlines.svg',
              imageAssetType: 'card_art',
              estimatedNetValue: 500,
              priorityScore: 100,
              effort: 'low',
              detailPath: '/cards/alaska-airlines-visa-signature',
              timelineDays: 90,
              keyRequirements: ['Spend $3,000 within 3 months'],
              scheduleConstraints: {
                activeDays: 90,
                payoutLagDays: 30,
                requiredSpend: 3000
              }
            }
          ],
          exclusions: [],
          schedule: [],
          scheduleIssues: []
        })
      })
    );
    installWindow();

    const payload = await submitPlannerIntake({
      ...baseRequest
    });

    expect(payload.recommendations[0]?.imageUrl).toBe('/card-logos/alaska-airlines.svg');
  });
});
