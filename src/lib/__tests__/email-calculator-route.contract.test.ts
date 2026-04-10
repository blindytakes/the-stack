import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const sendPremiumCardCalculatorEmailMock = vi.fn();

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

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: (...args: unknown[]) => verifyTurnstileTokenMock(...args)
}));

vi.mock('@/lib/services/email-calculator-service', () => ({
  sendPremiumCardCalculatorEmail: (...args: unknown[]) =>
    sendPremiumCardCalculatorEmailMock(...args)
}));

import { POST } from '@/app/api/email-calculator/route';

function makeValidRequestBody() {
  return {
    to: 'User@Example.com',
    profileId: 'amex-green',
    turnstileToken: 'token',
    scenario: {
      eligibleForBonus: true,
      canMeetSpend: true,
      offerPoints: 40000,
      annualFee: 150,
      selectedRedemptionId: 'transfer-partners',
      centsPerPoint: 2,
      spend: {
        travel: 600,
        transit: 300
      },
      credits: {
        'clear-credit': 150
      },
      benefits: {
        'no-foreign-transaction-fees': 40
      },
      firstYearExtraValue: 0,
      renewalOnlyValue: 0
    }
  };
}

describe('/api/email-calculator route contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidOriginMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue(true);
    applyIpRateLimitMock.mockResolvedValue(null);
  });

  it('rejects invalid origins before body handling', async () => {
    isValidOriginMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request origin' });
    expect(sendPremiumCardCalculatorEmailMock).not.toHaveBeenCalled();
  });

  it('passes through 429 responses from rate limiting', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(sendPremiumCardCalculatorEmailMock).not.toHaveBeenCalled();
  });

  it('rejects invalid request payloads', async () => {
    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify({ to: 'user@example.com' })
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid calculator email request' });
    expect(sendPremiumCardCalculatorEmailMock).not.toHaveBeenCalled();
  });

  it('rejects requests when Turnstile verification fails', async () => {
    verifyTurnstileTokenMock.mockResolvedValue(false);

    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Challenge verification failed. Please try again.'
    });
    expect(sendPremiumCardCalculatorEmailMock).not.toHaveBeenCalled();
  });

  it('maps service errors to JSON error responses', async () => {
    sendPremiumCardCalculatorEmailMock.mockResolvedValue({
      ok: false,
      status: 502,
      error: 'Could not send the calculator email right now. Please try again.'
    });

    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({
      error: 'Could not send the calculator email right now. Please try again.'
    });
  });

  it('maps service success payload/status directly', async () => {
    sendPremiumCardCalculatorEmailMock.mockResolvedValue({
      ok: true,
      status: 200,
      body: { message: 'Your calculator results have been emailed. Check your inbox.' }
    });

    const req = new Request('http://localhost/api/email-calculator', {
      method: 'POST',
      body: JSON.stringify(makeValidRequestBody())
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      message: 'Your calculator results have been emailed. Check your inbox.'
    });
    expect(sendPremiumCardCalculatorEmailMock).toHaveBeenCalledWith({
      to: 'user@example.com',
      profileId: 'amex-green',
      scenario: makeValidRequestBody().scenario
    });
  });
});
