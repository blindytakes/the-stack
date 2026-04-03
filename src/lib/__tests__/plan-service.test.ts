import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCardsDataMock = vi.fn();
const getBankingBonusesDataMock = vi.fn();
const buildPlanRecommendationsFromQuizMock = vi.fn();

function makeDiagnostics() {
  return {
    requestLimits: {
      maxCards: 5,
      maxBanking: 4,
      horizonDays: 180
    },
    initialPoolLimits: {
      cards: 0,
      banking: 0
    },
    finalPoolLimits: {
      cards: 0,
      banking: 0
    },
    lanePoolSizes: {
      cards: 0,
      banking: 0
    },
    poolExpansionRounds: 0,
    scheduledRecommendationIds: [],
    topRejected: []
  };
}

vi.mock('@/lib/cards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/cards')>();
  return {
    ...actual,
    getCardsData: (...args: unknown[]) => getCardsDataMock(...args)
  };
});

vi.mock('@/lib/banking-bonuses', () => ({
  getBankingBonusesData: (...args: unknown[]) => getBankingBonusesDataMock(...args)
}));

vi.mock('@/lib/planner-recommendations', () => ({
  buildPlanRecommendationsFromQuiz: (...args: unknown[]) =>
    buildPlanRecommendationsFromQuizMock(...args)
}));

import { buildPlan } from '@/lib/services/plan-service';

describe('plan-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects null JSON payloads', async () => {
    const result = await buildPlan(null);

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid JSON'
    });
  });

  it('rejects invalid request shapes', async () => {
    const result = await buildPlan({ answers: { goal: 'cashback' } });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid payload'
    });
  });

  it('builds a server-side plan using pace defaults and request overrides', async () => {
    getCardsDataMock.mockResolvedValue({
      cards: [
        {
          slug: 'test-card',
          name: 'Test Card',
          issuer: 'Test Bank',
          cardType: 'personal',
          rewardType: 'cashback',
          topCategories: ['dining'],
          annualFee: 0,
          creditTierMin: 'good',
          headline: 'Test headline',
          totalBenefitsValue: 0,
          plannerBenefitsValue: 0,
          bestSignUpBonusValue: 500,
          bestSignUpBonusSpendRequired: 3000,
          bestSignUpBonusSpendPeriodDays: 90
        }
      ],
      source: 'db'
    });
    getBankingBonusesDataMock.mockResolvedValue({
      bonuses: [
        {
          slug: 'test-bank',
          bankName: 'Bank Co',
          offerName: 'Checking Bonus',
          accountType: 'checking',
          headline: 'Bank headline',
          bonusAmount: 300,
          estimatedFees: 0,
          estimatedNetValue: 300,
          directDeposit: { required: false },
          requiredActions: ['Open account'],
          isActive: true
        }
      ],
      source: 'seed'
    });
    buildPlanRecommendationsFromQuizMock.mockReturnValue({
      recommendations: [],
      exclusions: [],
      schedule: [],
      scheduleIssues: [],
      diagnostics: makeDiagnostics()
    });

    const result = await buildPlan({
      answers: {
        goal: 'cashback',
        spend: 'dining',
        fee: 'no_fee',
        credit: 'good',
        directDeposit: 'yes',
        state: 'NY',
        monthlySpend: 'from_2500_to_5000',
        pace: 'balanced'
      },
      options: {
        maxBanking: 0
      },
      selectedOfferIntent: {
        lane: 'cards',
        slug: 'test-card',
        title: 'Test Card',
        provider: 'Test Bank',
        detailPath: '/cards/test-card',
        sourcePath: '/cards'
      }
    });

    expect(result.ok).toBe(true);
    expect(buildPlanRecommendationsFromQuizMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'test-card',
          score: expect.any(Number)
        })
      ]),
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'test-bank'
        })
      ]),
      expect.objectContaining({
        pace: 'balanced'
      }),
      expect.objectContaining({
        startAt: expect.any(Number),
        maxCards: 5,
        maxBanking: 0,
        selectedOfferIntent: expect.objectContaining({
          lane: 'cards',
          slug: 'test-card'
        })
      })
    );
  });

  it('maps invalid generated plan payloads to a 500 result', async () => {
    getCardsDataMock.mockResolvedValue({
      cards: [],
      source: 'db'
    });
    getBankingBonusesDataMock.mockResolvedValue({
      bonuses: [],
      source: 'seed'
    });
    buildPlanRecommendationsFromQuizMock.mockReturnValue({
      recommendations: [
        {
          id: 'broken-recommendation'
        }
      ],
      exclusions: [],
      schedule: [],
      scheduleIssues: [],
      diagnostics: makeDiagnostics()
    });

    const result = await buildPlan({
      answers: {
        goal: 'cashback',
        spend: 'dining',
        fee: 'no_fee',
        credit: 'good',
        directDeposit: 'yes',
        state: 'NY',
        monthlySpend: 'from_2500_to_5000',
        pace: 'balanced'
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'Plan generation is temporarily unavailable'
    });
  });

  it('accepts relative asset paths in generated recommendation images', async () => {
    getCardsDataMock.mockResolvedValue({
      cards: [],
      source: 'db'
    });
    getBankingBonusesDataMock.mockResolvedValue({
      bonuses: [],
      source: 'seed'
    });
    buildPlanRecommendationsFromQuizMock.mockReturnValue({
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
      scheduleIssues: [],
      diagnostics: makeDiagnostics()
    });

    const result = await buildPlan({
      answers: {
        goal: 'cashback',
        spend: 'dining',
        fee: 'no_fee',
        credit: 'good',
        directDeposit: 'yes',
        state: 'NY',
        monthlySpend: 'from_2500_to_5000',
        pace: 'balanced'
      }
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        recommendations: [
          expect.objectContaining({
            imageUrl: '/card-logos/alaska-airlines.svg'
          })
        ]
      }
    });
  });

  it('maps internal failures to a 500 result', async () => {
    getCardsDataMock.mockRejectedValue(new Error('db down'));

    const result = await buildPlan({
      answers: {
        goal: 'cashback',
        spend: 'dining',
        fee: 'no_fee',
        credit: 'good',
        directDeposit: 'yes',
        state: 'NY',
        monthlySpend: 'from_2500_to_5000',
        pace: 'balanced'
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'Plan generation is temporarily unavailable'
    });
  });
});
