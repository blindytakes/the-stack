import { describe, expect, it, vi, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import { applyIpRateLimit, getClientIp } from '../rate-limit';

/**
 * Rate-limit unit coverage.
 *
 * Focus:
 * - in-memory fallback enforcement semantics
 * - namespace isolation
 * - custom 429 messaging
 * - IP header precedence used by limiter keys
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('applyIpRateLimit (in-memory fallback)', () => {
  it('allows requests up to the configured limit', async () => {
    const config = {
      namespace: 'test-allow',
      limit: 2,
      window: '1 m' as const
    };
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' }
    });

    const first = await applyIpRateLimit(req, config);
    const second = await applyIpRateLimit(req, config);

    expect(first).toBeNull();
    expect(second).toBeNull();
  });

  it('blocks after limit exceeded and returns 429', async () => {
    const config = {
      namespace: 'test-block',
      limit: 1,
      window: '1 m' as const
    };
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.2' }
    });

    const first = await applyIpRateLimit(req, config);
    const blocked = await applyIpRateLimit(req, config);

    expect(first).toBeNull();
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
  });

  it('returns custom error message when provided', async () => {
    const config = {
      namespace: 'test-msg',
      limit: 1,
      window: '1 m' as const,
      message: 'Custom limit message'
    };
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.3' }
    });

    await applyIpRateLimit(req, config);
    const blocked = await applyIpRateLimit(req, config);

    const body = await blocked!.json();
    expect(body.error).toBe('Custom limit message');
  });

  it('isolates namespaces from each other', async () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.4' }
    });

    await applyIpRateLimit(req, { namespace: 'ns-a', limit: 1, window: '1 m' });
    const crossNs = await applyIpRateLimit(req, { namespace: 'ns-b', limit: 1, window: '1 m' });

    expect(crossNs).toBeNull();
  });

  it('falls back to in-memory limits when Upstash requests fail', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.spyOn(Redis, 'fromEnv').mockImplementation(() => {
      throw new Error('upstash down');
    });

    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.5' }
    });
    const config = {
      namespace: 'test-upstash-fallback',
      limit: 1,
      window: '1 m' as const
    };

    const first = await applyIpRateLimit(req, config);
    const second = await applyIpRateLimit(req, config);

    expect(first).toBeNull();
    expect(second).not.toBeNull();
    expect(second!.status).toBe(429);
  });
});

describe('getClientIp', () => {
  it('prefers x-vercel-forwarded-for over all others', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-vercel-forwarded-for': '198.51.100.5',
        'x-real-ip': '198.51.100.9',
        'x-forwarded-for': '203.0.113.1, 10.0.0.1'
      }
    });

    expect(getClientIp(req)).toBe('198.51.100.5');
  });

  it('falls back to x-real-ip when x-vercel-forwarded-for is absent', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-real-ip': '198.51.100.1',
        'x-forwarded-for': '203.0.113.1'
      }
    });

    expect(getClientIp(req)).toBe('198.51.100.1');
  });

  it('falls back to first x-forwarded-for value as last resort', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 10.0.0.1'
      }
    });

    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('falls back to unknown when no ip headers exist', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});
