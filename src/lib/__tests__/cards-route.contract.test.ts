import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const getCardsListMock = vi.fn();

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

vi.mock('@/lib/services/cards-service', () => ({
  getCardsList: (...args: unknown[]) => getCardsListMock(...args)
}));

import { GET } from '@/app/api/cards/route';

describe('/api/cards route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns results and pagination when service succeeds', async () => {
    getCardsListMock.mockResolvedValue({
      ok: true,
      data: {
        results: [
          {
            slug: 'test-card',
            name: 'Test Card',
            issuer: 'Test Bank',
            cardType: 'personal',
            rewardType: 'cashback',
            topCategories: ['dining'],
            annualFee: 95,
            creditTierMin: 'good',
            headline: 'Test headline',
            totalBenefitsValue: 0,
            plannerBenefitsValue: 0
          }
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0
        }
      }
    });

    const req = new Request('http://localhost/api/cards?issuer=Test&limit=20&offset=0');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results[0].slug).toBe('test-card');
    expect(body.pagination.total).toBe(1);
    expect(getCardsListMock).toHaveBeenCalledWith({
      issuer: 'Test',
      category: undefined,
      maxFee: undefined,
      limit: '20',
      offset: '0'
    });
  });

  it('returns 400 when service rejects query params', async () => {
    getCardsListMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid query params'
    });

    const req = new Request('http://localhost/api/cards?limit=bad');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid query params' });
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/cards');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(getCardsListMock).not.toHaveBeenCalled();
  });

  it('maps service failures to non-400 JSON responses', async () => {
    getCardsListMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Card data is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/cards');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Card data is temporarily unavailable' });
  });
});
