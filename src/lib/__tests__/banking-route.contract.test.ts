import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const getBankingBonusesListMock = vi.fn();

vi.mock('@/lib/api-route', () => ({
  instrumentedApi: (
    _route: string,
    _method: string,
    handler: () => Promise<Response>
  ) => handler()
}));

vi.mock('@/lib/rate-limit', () => ({
  applyIpRateLimit: (...args: unknown[]) => applyIpRateLimitMock(...args)
}));

vi.mock('@/lib/services/banking-service', () => ({
  getBankingBonusesList: (...args: unknown[]) => getBankingBonusesListMock(...args)
}));

import { GET } from '@/app/api/banking/route';

describe('/api/banking route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns results and pagination when service succeeds', async () => {
    getBankingBonusesListMock.mockResolvedValue({
      ok: true,
      data: {
        results: [
          {
            slug: 'test-bonus',
            bankName: 'Test Bank',
            offerName: 'Test Offer',
            accountType: 'checking',
            headline: 'Test headline',
            bonusAmount: 300,
            estimatedFees: 0,
            directDeposit: { required: false },
            requiredActions: ['Open account'],
            isActive: true,
            estimatedNetValue: 300
          }
        ],
        source: 'seed',
        pagination: {
          total: 1,
          limit: 20,
          offset: 0
        }
      }
    });

    const req = new Request(
      'http://localhost/api/banking?accountType=checking&requiresDirectDeposit=no&difficulty=low&cashRequirement=light&timeline=fast&stateLimited=no&state=ny&sort=easy&limit=20&offset=0'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.results[0].slug).toBe('test-bonus');
    expect(getBankingBonusesListMock).toHaveBeenCalledWith({
      accountType: 'checking',
      requiresDirectDeposit: 'no',
      difficulty: 'low',
      cashRequirement: 'light',
      timeline: 'fast',
      stateLimited: 'no',
      state: 'ny',
      sort: 'easy',
      limit: '20',
      offset: '0'
    });
  });

  it('returns 400 when service rejects query params', async () => {
    getBankingBonusesListMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid query params'
    });

    const req = new Request('http://localhost/api/banking?limit=bad');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid query params' });
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/banking');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(getBankingBonusesListMock).not.toHaveBeenCalled();
  });

  it('maps service errors to non-400 JSON responses', async () => {
    getBankingBonusesListMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Banking offer data is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/banking');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Banking offer data is temporarily unavailable' });
  });
});
