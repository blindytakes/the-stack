import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';
import { createBankingListItem } from '@/lib/__tests__/banking-test-helpers';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const getBankingBonusesDataMock = vi.fn();

vi.mock('@/lib/api-route', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-route')>('@/lib/api-route');
  return {
    ...actual,
    createApiRoute: ({
      requireValidOrigin,
      rateLimit,
      handler
    }: {
      requireValidOrigin?: boolean;
      rateLimit?: unknown;
      handler: (req: Request) => Promise<Response>;
    }) => {
      return async (req: Request) => {
        if (requireValidOrigin && !isValidOriginMock(req)) {
          return Response.json({ error: 'Invalid request origin' }, { status: 400 });
        }

        if (rateLimit) {
          const rateLimited = await applyIpRateLimitMock(req, rateLimit);
          if (rateLimited) {
            return rateLimited;
          }
        }

        return handler(req);
      };
    }
  };
});

vi.mock('@/lib/rate-limit', () => ({
  applyIpRateLimit: (...args: unknown[]) => applyIpRateLimitMock(...args)
}));

vi.mock('@/lib/banking-bonuses', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/banking-bonuses')>();
  return {
    ...actual,
    getBankingBonusesData: (...args: unknown[]) => getBankingBonusesDataMock(...args)
  };
});

import { GET } from '@/app/api/banking/route';

describe('/api/banking route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
    getBankingBonusesDataMock.mockResolvedValue({
      source: 'seed',
      bonuses: [
        createBankingListItem({
          slug: 'high-net-light-deposit',
          bonusAmount: 250,
          estimatedFees: 0,
          estimatedNetValue: 250,
          apyPercent: 3.65,
          apyDisplay: '3.65% APY',
          minimumOpeningDeposit: 1500,
          holdingPeriodDays: 60
        }),
        createBankingListItem({
          slug: 'low-net-no-deposit',
          bonusAmount: 150,
          estimatedFees: 0,
          estimatedNetValue: 150,
          minimumOpeningDeposit: undefined,
          holdingPeriodDays: 45,
          requiredActions: ['Complete five debit purchases']
        }),
        createBankingListItem({
          slug: 'state-limited-offer',
          bonusAmount: 180,
          estimatedFees: 0,
          estimatedNetValue: 180,
          holdingPeriodDays: 45,
          stateRestrictions: ['CA']
        }),
        createBankingListItem({
          slug: 'direct-deposit-offer',
          bonusAmount: 400,
          estimatedFees: 0,
          estimatedNetValue: 400,
          directDeposit: { required: true, minimumAmount: 2000 },
          holdingPeriodDays: 45
        }),
        createBankingListItem({
          slug: 'savings-offer',
          accountType: 'savings',
          bonusAmount: 325,
          estimatedFees: 0,
          estimatedNetValue: 325,
          minimumOpeningDeposit: 5000,
          holdingPeriodDays: 45
        })
      ]
    });
  });

  it('passes through the full query surface and returns actually sorted filtered results', async () => {
    const req = new Request(
      'http://localhost/api/banking?accountType=checking&requiresDirectDeposit=no&apy=3_plus&difficulty=low&timeline=fast&stateLimited=no&sort=low_cash&limit=10&offset=0'
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination).toEqual({
      total: 1,
      limit: 10,
      offset: 0
    });
    expect(body.results.map((offer: BankingBonusListItem) => offer.slug)).toEqual([
      'high-net-light-deposit'
    ]);
    expect(getBankingBonusesDataMock).toHaveBeenCalledTimes(1);
  });
});
