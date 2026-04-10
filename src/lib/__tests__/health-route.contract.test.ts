import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const authorizeHealthCheckMock = vi.fn();
const runHealthCheckMock = vi.fn();

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

vi.mock('@/lib/services/health-service', () => ({
  runHealthCheck: (...args: unknown[]) => runHealthCheckMock(...args)
}));

vi.mock('@/lib/health-auth', () => ({
  authorizeHealthCheck: (...args: unknown[]) => authorizeHealthCheckMock(...args)
}));

import { GET } from '@/app/api/health/route';

describe('/api/health route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    authorizeHealthCheckMock.mockReturnValue({ ok: true });
  });

  it('rejects unauthorized requests before calling health service', async () => {
    authorizeHealthCheckMock.mockReturnValue({
      ok: false,
      status: 401,
      reason: 'Unauthorized'
    });

    const req = new Request('http://localhost/api/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.status).toBe('degraded');
    expect(body.reason).toBe('Unauthorized');
    expect(runHealthCheckMock).not.toHaveBeenCalled();
  });

  it('returns ok payload from health service', async () => {
    runHealthCheckMock.mockResolvedValue({
      status: 200,
      body: { status: 'ok', timestamp: '2026-03-03T00:00:00.000Z' }
    });

    const req = new Request('http://localhost/api/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', timestamp: '2026-03-03T00:00:00.000Z' });
  });

  it('returns degraded payload/status from health service', async () => {
    runHealthCheckMock.mockResolvedValue({
      status: 503,
      body: {
        status: 'degraded',
        timestamp: '2026-03-03T00:00:00.000Z',
        reason: 'DATABASE_URL is not configured'
      }
    });

    const req = new Request('http://localhost/api/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      status: 'degraded',
      timestamp: '2026-03-03T00:00:00.000Z',
      reason: 'DATABASE_URL is not configured'
    });
  });
});
