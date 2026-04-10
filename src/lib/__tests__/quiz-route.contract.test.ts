import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const scoreQuizMock = vi.fn();

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

vi.mock('@/lib/services/quiz-service', () => ({
  scoreQuiz: (...args: unknown[]) => scoreQuizMock(...args)
}));

import { POST } from '@/app/api/quiz/route';

describe('/api/quiz route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns quiz results when service succeeds', async () => {
    scoreQuizMock.mockResolvedValue({
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
            annualFee: 0,
            creditTierMin: 'good',
            headline: 'Test headline',
            totalBenefitsValue: 0,
            plannerBenefitsValue: 0,
            score: 7
          }
        ]
      }
    });

    const req = new Request('http://localhost/api/quiz', {
      method: 'POST',
      body: JSON.stringify({
        goal: 'cashback',
        spend: 'dining',
        fee: 'no_fee',
        credit: 'good',
        directDeposit: 'yes',
        state: 'NY',
        monthlySpend: 'from_2500_to_5000',
        pace: 'balanced'
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results[0].slug).toBe('test-card');
  });

  it('returns 400 when service rejects the request body', async () => {
    scoreQuizMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid payload'
    });

    const req = new Request('http://localhost/api/quiz', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid payload' });
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/quiz', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(scoreQuizMock).not.toHaveBeenCalled();
  });

  it('maps service failures to JSON 500 responses', async () => {
    scoreQuizMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Quiz scoring is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/quiz', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Quiz scoring is temporarily unavailable' });
  });
});
