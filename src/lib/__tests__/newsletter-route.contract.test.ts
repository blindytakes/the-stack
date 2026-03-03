import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const processNewsletterSubscribeMock = vi.fn();

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

vi.mock('@/lib/services/newsletter-service', () => ({
  newsletterSubscribeInputSchema: z.object({
    email: z.string().email(),
    source: z.string().default('homepage')
  }),
  processNewsletterSubscribe: (...args: unknown[]) =>
    processNewsletterSubscribeMock(...args)
}));

import { POST } from '@/app/api/newsletter/subscribe/route';

describe('/api/newsletter/subscribe route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('rejects invalid origins before body handling', async () => {
    isValidOriginMock.mockReturnValue(false);
    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request origin' });
    expect(processNewsletterSubscribeMock).not.toHaveBeenCalled();
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );
    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(processNewsletterSubscribeMock).not.toHaveBeenCalled();
  });

  it('rejects requests when Turnstile verification fails', async () => {
    verifyTurnstileTokenMock.mockResolvedValue(false);

    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        turnstileToken: 'token'
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Challenge verification failed. Please try again.'
    });
    expect(processNewsletterSubscribeMock).not.toHaveBeenCalled();
  });

  it('maps service errors to JSON error responses', async () => {
    processNewsletterSubscribeMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Newsletter signup is temporarily unavailable'
    });

    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        source: 'homepage',
        turnstileToken: 'token'
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Newsletter signup is temporarily unavailable' });
  });

  it('maps service success payload/status directly', async () => {
    processNewsletterSubscribeMock.mockResolvedValue({
      ok: true,
      status: 201,
      body: {
        message: 'Successfully subscribed!',
        provider: 'none',
        syncStatus: 'skipped'
      }
    });

    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        source: 'homepage',
        turnstileToken: 'token'
      })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({
      message: 'Successfully subscribed!',
      provider: 'none',
      syncStatus: 'skipped'
    });
    expect(processNewsletterSubscribeMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      source: 'homepage'
    });
  });
});
