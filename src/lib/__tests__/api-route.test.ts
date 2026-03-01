import { describe, expect, it, vi, beforeEach } from 'vitest';

/* ── Mock OTEL + metrics before importing instrumentedApi ── */

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

import { instrumentedApi } from '../api-route';

beforeEach(() => {
  vi.clearAllMocks();
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
