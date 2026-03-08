import { beforeEach, describe, expect, it, vi } from 'vitest';

const buildPlanMock = vi.fn();

vi.mock('@/lib/api-route', () => ({
  instrumentedApi: (
    _route: string,
    _method: string,
    handler: () => Promise<Response>
  ) => handler()
}));

vi.mock('@/lib/services/plan-service', () => ({
  buildPlan: (...args: unknown[]) => buildPlanMock(...args)
}));

import { POST } from '@/app/api/plan/route';

describe('/api/plan route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          openingCash: 'from_2000_to_10000',
          monthlySpend: 'from_2500_to_5000',
          pace: 'balanced'
        }
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.generatedAt).toBe(123);
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
