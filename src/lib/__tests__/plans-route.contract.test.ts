import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const savePlanSnapshotMock = vi.fn();

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

vi.mock('@/lib/turnstile', () => ({
  isValidOrigin: (...args: unknown[]) => isValidOriginMock(...args)
}));

vi.mock('@/lib/services/plan-snapshot-service', () => ({
  savePlanSnapshot: (...args: unknown[]) => savePlanSnapshotMock(...args)
}));

import { POST } from '@/app/api/plans/route';

function makeValidRequestBody() {
  return {
    totalValue: 1400,
    cardsOnlyMode: false,
    recommendations: [
      {
        provider: 'Chase',
        title: 'Sapphire Preferred',
        estimatedNetValue: 900,
        effort: 'medium',
        valueBreakdown: { annualFee: 95 },
        scheduleConstraints: {
          requiresDirectDeposit: false
        }
      }
    ],
    milestones: [
      {
        label: 'Apply/open by',
        title: 'Sapphire Preferred',
        date: '2026-03-20T12:00:00.000Z'
      }
    ]
  };
}

describe('/api/plans route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('rejects invalid origins before body handling', async () => {
    isValidOriginMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/plans', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request origin' });
    expect(savePlanSnapshotMock).not.toHaveBeenCalled();
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/plans', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(savePlanSnapshotMock).not.toHaveBeenCalled();
  });

  it('maps service 400 errors to bad requests', async () => {
    savePlanSnapshotMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid payload'
    });

    const req = new Request('http://localhost/api/plans', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid payload' });
  });

  it('maps service success payload/status directly', async () => {
    savePlanSnapshotMock.mockResolvedValue({
      ok: true,
      status: 201,
      body: { planId: 'plan_123' }
    });

    const req = new Request('http://localhost/api/plans', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ planId: 'plan_123' });
    expect(savePlanSnapshotMock).toHaveBeenCalledWith(makeValidRequestBody());
  });
});
