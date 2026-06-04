import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const ingestFunnelEventMock = vi.fn();
const isValidOriginMock = vi.fn();

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

vi.mock('@/lib/services/funnel-event-service', () => ({
  ingestFunnelEvent: (...args: unknown[]) => ingestFunnelEventMock(...args)
}));

import { POST } from '@/app/api/funnel/events/route';

describe('/api/funnel/events route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyIpRateLimitMock.mockResolvedValue(null);
    ingestFunnelEventMock.mockReturnValue({ ok: true });
    isValidOriginMock.mockReturnValue(true);
  });

  it('rejects invalid origins before body handling', async () => {
    isValidOriginMock.mockReturnValue(false);

    const res = await POST(
      new Request('http://localhost/api/funnel/events', {
        method: 'POST',
        body: JSON.stringify({ event: 'landing_view' })
      })
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid request origin' });
    expect(ingestFunnelEventMock).not.toHaveBeenCalled();
  });

  it('passes through rate-limit responses before body handling', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const res = await POST(
      new Request('http://localhost/api/funnel/events', {
        method: 'POST',
        body: JSON.stringify({ event: 'landing_view' })
      })
    );

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: 'Too many requests' });
    expect(ingestFunnelEventMock).not.toHaveBeenCalled();
  });

  it('returns 204 when ingestion succeeds', async () => {
    const payload = {
      event: 'landing_view',
      properties: {
        path: '/',
        source: 'homepage'
      }
    };

    const res = await POST(
      new Request('http://localhost/api/funnel/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );

    expect(res.status).toBe(204);
    expect(ingestFunnelEventMock).toHaveBeenCalledWith(payload);
  });

  it('maps invalid ingestion results to 400', async () => {
    ingestFunnelEventMock.mockReturnValue({ ok: false, error: 'Invalid payload' });

    const res = await POST(
      new Request('http://localhost/api/funnel/events', {
        method: 'POST',
        body: JSON.stringify({ event: 'not-real' })
      })
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid payload' });
  });
});
