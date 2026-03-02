import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstileToken, isValidOrigin } from '../turnstile';

/**
 * Turnstile helper unit coverage.
 *
 * Focus:
 * - production vs non-production behavior when secret is absent
 * - success/failure/error outcomes from Cloudflare verification calls
 * - Origin/Host matching behavior for request validation
 */

describe('verifyTurnstileToken', () => {
  beforeEach(() => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns true when TURNSTILE_SECRET_KEY is unset in non-production', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    const req = new Request('http://localhost');

    expect(await verifyTurnstileToken(undefined, req)).toBe(true);
  });

  it('returns false when TURNSTILE_SECRET_KEY is unset in production', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost');

    expect(await verifyTurnstileToken('some-token', req)).toBe(false);
  });

  it('returns false when token is undefined and secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const req = new Request('http://localhost');

    expect(await verifyTurnstileToken(undefined, req)).toBe(false);
  });

  it('returns true when Cloudflare responds with success', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }))
    );
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    });

    expect(await verifyTurnstileToken('valid-token', req)).toBe(true);
  });

  it('returns false when Cloudflare responds with failure', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false }))
    );
    const req = new Request('http://localhost');

    expect(await verifyTurnstileToken('bad-token', req)).toBe(false);
  });

  it('returns false when fetch throws (network error)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'));
    const req = new Request('http://localhost');

    expect(await verifyTurnstileToken('token', req)).toBe(false);
  });
});

describe('isValidOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when Origin host matches Host header', () => {
    const req = new Request('http://localhost', {
      headers: {
        origin: 'https://thestack.com',
        host: 'thestack.com'
      }
    });
    expect(isValidOrigin(req)).toBe(true);
  });

  it('returns false when Origin host differs from Host', () => {
    const req = new Request('http://localhost', {
      headers: {
        origin: 'https://evil.com',
        host: 'thestack.com'
      }
    });
    expect(isValidOrigin(req)).toBe(false);
  });

  it('returns false when Origin is missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost', {
      headers: { host: 'thestack.com' }
    });
    expect(isValidOrigin(req)).toBe(false);
  });

  it('returns true when Origin is missing in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new Request('http://localhost');
    expect(isValidOrigin(req)).toBe(true);
  });
});
