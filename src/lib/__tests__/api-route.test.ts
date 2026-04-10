import { describe, expect, it, vi, beforeEach } from 'vitest';

/* ── Mock OTEL + metrics before importing instrumentedApi ── */

const applyIpRateLimitMock = vi.fn();
const isValidOriginMock = vi.fn();

vi.mock('@opentelemetry/api-logs', () => ({
  logs: {
    getLogger: () => ({ emit: vi.fn() })
  },
  SeverityNumber: { INFO: 9, WARN: 13, ERROR: 17 }
}));

vi.mock('@/lib/metrics', () => ({
  recordApiDuration: vi.fn(),
  recordApiError: vi.fn()
}));

vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
  return {
    ...actual,
    applyIpRateLimit: (...args: unknown[]) => applyIpRateLimitMock(...args)
  };
});

vi.mock('@/lib/turnstile', () => ({
  isValidOrigin: (...args: unknown[]) => isValidOriginMock(...args)
}));

import { createApiRoute, instrumentedApi, jsonFromServiceResult } from '../api-route';

beforeEach(() => {
  vi.clearAllMocks();
  applyIpRateLimitMock.mockResolvedValue(null);
  isValidOriginMock.mockReturnValue(true);
});

describe('instrumentedApi', () => {
  it('returns the handler response on success', async () => {
    const handler = async () => Response.json({ ok: true }, { status: 200 });
    const res = await instrumentedApi('/test', 'GET', handler);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('passes through 4xx responses from the handler', async () => {
    const handler = async () => Response.json({ error: 'bad' }, { status: 400 });
    const res = await instrumentedApi('/test', 'GET', handler);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'bad' });
  });

  it('returns JSON 500 when handler throws (not HTML)', async () => {
    const handler = async (): Promise<Response> => {
      throw new Error('kaboom');
    };
    const res = await instrumentedApi('/test', 'POST', handler);

    // Must be 500
    expect(res.status).toBe(500);

    // Must be parseable JSON with { error: string }
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('records error metrics when handler throws', async () => {
    const { recordApiError, recordApiDuration } = await import('@/lib/metrics');

    const handler = async (): Promise<Response> => {
      throw new Error('kaboom');
    };
    await instrumentedApi('/test', 'POST', handler);

    expect(recordApiError).toHaveBeenCalledWith('/test', 'Error');
    expect(recordApiDuration).toHaveBeenCalledWith('/test', 'POST', 500, expect.any(Number));
  });

  it('records metrics on successful response', async () => {
    const { recordApiDuration } = await import('@/lib/metrics');

    const handler = async () => Response.json({ ok: true }, { status: 200 });
    await instrumentedApi('/test', 'GET', handler);

    expect(recordApiDuration).toHaveBeenCalledWith('/test', 'GET', 200, expect.any(Number));
  });

  it('records error metrics when handler returns 5xx', async () => {
    const { recordApiError } = await import('@/lib/metrics');

    const handler = async () => Response.json({ error: 'oops' }, { status: 503 });
    await instrumentedApi('/test', 'GET', handler);

    expect(recordApiError).toHaveBeenCalledWith('/test', 'Http5xxResponse');
  });
});

describe('jsonFromServiceResult', () => {
  it('maps data responses to 200 JSON payloads', async () => {
    const res = jsonFromServiceResult({
      ok: true,
      data: { ok: true }
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('preserves explicit success status/body responses', async () => {
    const res = jsonFromServiceResult({
      ok: true,
      status: 201,
      body: { id: 'plan_123' }
    });

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ id: 'plan_123' });
  });

  it('maps 400 failures to bad requests', async () => {
    const res = jsonFromServiceResult({
      ok: false,
      status: 400,
      error: 'Invalid payload'
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid payload' });
  });

  it('maps non-400 failures to JSON errors', async () => {
    const res = jsonFromServiceResult({
      ok: false,
      status: 503,
      error: 'Temporarily unavailable'
    });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Temporarily unavailable' });
  });
});

describe('createApiRoute', () => {
  const rateLimit = {
    namespace: 'test',
    limit: 1,
    window: '1 m' as const
  };

  it('rejects invalid origins before running the handler', async () => {
    isValidOriginMock.mockReturnValue(false);
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const route = createApiRoute({
      route: '/test',
      method: 'POST',
      requireValidOrigin: true,
      handler
    });

    const res = await route(new Request('http://localhost/test', { method: 'POST' }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid request origin' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes through rate-limit responses before running the handler', async () => {
    applyIpRateLimitMock.mockResolvedValue(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    );
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const route = createApiRoute({
      route: '/test',
      method: 'GET',
      rateLimit,
      handler
    });

    const res = await route(new Request('http://localhost/test'));

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: 'Too many requests' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('runs the handler when origin and rate-limit checks pass', async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const route = createApiRoute({
      route: '/test',
      method: 'GET',
      requireValidOrigin: true,
      rateLimit,
      handler
    });

    const res = await route(new Request('http://localhost/test'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(applyIpRateLimitMock).toHaveBeenCalledWith(expect.any(Request), rateLimit);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
