import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const resolveAffiliateClickRedirectMock = vi.fn();

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

vi.mock('@/lib/services/affiliate-service', () => ({
  resolveAffiliateClickRedirect: (...args: unknown[]) =>
    resolveAffiliateClickRedirectMock(...args)
}));

import { GET } from '@/app/api/affiliate/click/route';

describe('/api/affiliate/click route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns 307 redirect when service resolves a valid target', async () => {
    resolveAffiliateClickRedirectMock.mockReturnValue({
      ok: true,
      redirectUrl: 'https://example.com/offer'
    });

    const req = new Request('http://localhost/api/affiliate/click');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/offer');
  });

  it('returns 400 when service rejects payload', async () => {
    resolveAffiliateClickRedirectMock.mockReturnValue({
      ok: false,
      error: 'Invalid affiliate link payload'
    });

    const req = new Request('http://localhost/api/affiliate/click');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid affiliate link payload' });
  });

  it('passes through precomputed 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/affiliate/click');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(resolveAffiliateClickRedirectMock).not.toHaveBeenCalled();
  });
});
