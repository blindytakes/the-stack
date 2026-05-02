import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const getPersonalFinanceTrackerDownloadMock = vi.fn();

vi.mock('@/lib/api-route', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-route')>('@/lib/api-route');
  return {
    ...actual,
    createApiRoute: ({
      rateLimit,
      handler
    }: {
      rateLimit?: unknown;
      handler: (req: Request) => Promise<Response>;
    }) => {
      return async (req: Request) => {
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

vi.mock('@/lib/services/personal-finance-tracker-service', () => ({
  getPersonalFinanceTrackerDownload: (...args: unknown[]) =>
    getPersonalFinanceTrackerDownloadMock(...args)
}));

import { GET } from '@/app/api/tools/personal-finance-tracker/download/route';

describe('/api/tools/personal-finance-tracker/download route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns the spreadsheet download response from the service', async () => {
    getPersonalFinanceTrackerDownloadMock.mockResolvedValue({
      ok: true,
      body: new Uint8Array([0x50, 0x4b]).buffer,
      headers: {
        'Content-Disposition':
          'attachment; filename="the-stack-personal-finance-tracker.xlsx"',
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    const res = await GET(new Request('http://localhost/api/tools/personal-finance-tracker/download'));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="the-stack-personal-finance-tracker.xlsx"'
    );
    expect(res.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  it('maps service errors to JSON error responses', async () => {
    getPersonalFinanceTrackerDownloadMock.mockResolvedValue({
      ok: false,
      status: 503,
      error: 'Personal finance tracker download is not configured.'
    });

    const res = await GET(new Request('http://localhost/api/tools/personal-finance-tracker/download'));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      error: 'Personal finance tracker download is not configured.'
    });
  });

  it('passes through precomputed 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const res = await GET(new Request('http://localhost/api/tools/personal-finance-tracker/download'));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(getPersonalFinanceTrackerDownloadMock).not.toHaveBeenCalled();
  });
});
