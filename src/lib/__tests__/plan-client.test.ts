import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitPlanQuiz } from '../plan-client';
import type { SelectedOfferIntent } from '../plan-contract';
import type { QuizRequest } from '../quiz-engine';

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

const baseAnswers: QuizRequest = {
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
  ownedBankNames: []
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

  it('posts plan inputs and saves the returned payload to storage', async () => {
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

    const payload = await submitPlanQuiz({
      answers: baseAnswers,
      options: {
        maxBanking: 0
      },
      selectedOfferIntent
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: baseAnswers,
        options: {
          maxBanking: 0
        },
        selectedOfferIntent
      })
    });
    expect(payload.savedAt).toBe(123);
    expect(payload.selectedOfferIntent).toEqual(selectedOfferIntent);
    expect(payload.scheduleIssues).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem('thestack.plan.results.v1')!)).toEqual(payload);
    expect(JSON.parse(localStorage.getItem('thestack.plan.results.backup.v1')!)).toEqual(payload);
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
      submitPlanQuiz({
        answers: baseAnswers
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
      submitPlanQuiz({
        answers: baseAnswers
      })
    ).rejects.toThrow('Plan generation returned an unexpected response.');
  });
});
