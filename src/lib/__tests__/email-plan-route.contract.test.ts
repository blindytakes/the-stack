import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const sendSavedPlanEmailMock = vi.fn();

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

vi.mock('@/lib/turnstile', () => ({
  isValidOrigin: (...args: unknown[]) => isValidOriginMock(...args),
  verifyTurnstileToken: (...args: unknown[]) => verifyTurnstileTokenMock(...args)
}));

vi.mock('@/lib/services/email-plan-service', () => ({
  sendSavedPlanEmail: (...args: unknown[]) => sendSavedPlanEmailMock(...args)
}));

import { POST } from '@/app/api/email-plan/route';

function makeValidRequestBody() {
  return {
    to: 'User@Example.com',
    planId: 'plan_123',
    referenceDateKey: '2026-03-19',
    turnstileToken: 'token'
  };
}

describe('/api/email-plan route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('rejects invalid origins before body handling', async () => {
    isValidOriginMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request origin' });
    expect(sendSavedPlanEmailMock).not.toHaveBeenCalled();
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(sendSavedPlanEmailMock).not.toHaveBeenCalled();
  });

  it('rejects invalid request payloads', async () => {
    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify({ to: 'user@example.com' })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid email plan request' });
    expect(sendSavedPlanEmailMock).not.toHaveBeenCalled();
  });

  it('rejects requests when Turnstile verification fails', async () => {
    verifyTurnstileTokenMock.mockResolvedValue(false);

    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Challenge verification failed. Please try again.'
    });
    expect(sendSavedPlanEmailMock).not.toHaveBeenCalled();
  });

  it('maps service errors to JSON error responses', async () => {
    sendSavedPlanEmailMock.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Plan not found'
    });

    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Plan not found' });
  });

  it('maps service success payload/status directly', async () => {
    sendSavedPlanEmailMock.mockResolvedValue({
      ok: true,
      status: 200,
      body: { message: 'Your plan has been emailed. Check your inbox.' }
    });

    const req = new Request('http://localhost/api/email-plan', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      message: 'Your plan has been emailed. Check your inbox.'
    });
    expect(sendSavedPlanEmailMock).toHaveBeenCalledWith({
      to: 'user@example.com',
      planId: 'plan_123',
      referenceDateKey: '2026-03-19'
    });
  });
});
