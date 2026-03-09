import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const getCardDetailMock = vi.fn();

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

vi.mock('@/lib/services/cards-service', () => ({
  getCardDetail: (...args: unknown[]) => getCardDetailMock(...args)
}));

import { GET } from '@/app/api/cards/[slug]/route';

describe('/api/cards/[slug] route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('returns card detail when service succeeds', async () => {
    getCardDetailMock.mockResolvedValue({
      ok: true,
      data: {
        card: {
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
          plannerBenefitsValue: 0,
          foreignTxFee: 0,
          rewards: [],
          signUpBonuses: [],
          benefits: [],
          transferPartners: []
        }
      }
    });

    const req = new Request('http://localhost/api/cards/test-card');
    const res = await GET(req, { params: Promise.resolve({ slug: 'test-card' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.card.slug).toBe('test-card');
    expect(getCardDetailMock).toHaveBeenCalledWith('test-card');
  });

  it('returns service error payloads for missing cards', async () => {
    getCardDetailMock.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Card not found'
    });

    const req = new Request('http://localhost/api/cards/missing-card');
    const res = await GET(req, { params: Promise.resolve({ slug: 'missing-card' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Card not found' });
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/cards/test-card');
    const res = await GET(req, { params: Promise.resolve({ slug: 'test-card' }) });
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(getCardDetailMock).not.toHaveBeenCalled();
  });

  it('maps service failures to JSON error responses', async () => {
    getCardDetailMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Card data is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/cards/test-card');
    const res = await GET(req, { params: Promise.resolve({ slug: 'test-card' }) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Card data is temporarily unavailable' });
  });
});
