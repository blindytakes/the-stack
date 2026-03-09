import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitPlanQuiz } from '../plan-client';
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
  pace: 'balanced'
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
        schedule: []
      })
    });
    vi.stubGlobal('fetch', fetchMock);
    const { sessionStorage, localStorage } = installWindow();

    const payload = await submitPlanQuiz({
      answers: baseAnswers,
      options: {
        maxBanking: 0
      }
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: baseAnswers,
        options: {
          maxBanking: 0
        }
      })
    });
    expect(payload.savedAt).toBe(123);
    expect(JSON.parse(sessionStorage.getItem('thestack.plan.results.v1')!)).toEqual(payload);
    expect(JSON.parse(localStorage.getItem('thestack.plan.results.backup.v1')!)).toEqual(payload);
  });

  it('throws when the plan request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false
      })
    );
    installWindow();

    await expect(
      submitPlanQuiz({
        answers: baseAnswers
      })
    ).rejects.toThrow('Failed to build plan');
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
          schedule: []
        })
      })
    );
    installWindow();

    await expect(
      submitPlanQuiz({
        answers: baseAnswers
      })
    ).rejects.toThrow('Invalid plan response');
  });
});
