import { beforeEach, describe, expect, it, vi } from 'vitest';
import { planResponseSchema } from '@/lib/plan-contract';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const buildPlanMock = vi.fn();

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

vi.mock('@/lib/services/plan-service', () => ({
  buildPlan: (...args: unknown[]) => buildPlanMock(...args)
}));

import { POST } from '@/app/api/plan/route';

describe('/api/plan route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns generated plan data when service succeeds', async () => {
    buildPlanMock.mockResolvedValue({
      ok: true,
      data: {
        generatedAt: 123,
        recommendations: [],
        exclusions: [],
        schedule: [],
        scheduleIssues: []
      }
    });

    const req = new Request('http://localhost/api/plan', {
      method: 'POST',
      body: JSON.stringify({
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
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(planResponseSchema.parse(body).generatedAt).toBe(123);
    expect(buildPlanMock).toHaveBeenCalled();
  });

  it('returns 400 when service rejects the request body', async () => {
    buildPlanMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid payload'
    });

    const req = new Request('http://localhost/api/plan', {
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

    const req = new Request('http://localhost/api/plan', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(buildPlanMock).not.toHaveBeenCalled();
  });

  it('maps service failures to JSON 500 responses', async () => {
    buildPlanMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Plan generation is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/plan', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Plan generation is temporarily unavailable' });
  });
});
