import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authorizeHealthCheck } from '../health-auth';

describe('authorizeHealthCheck', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('HEALTH_CHECK_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows requests when no token is configured outside production', () => {
    const req = new Request('http://localhost/api/health');
    expect(authorizeHealthCheck(req)).toEqual({ ok: true });
  });

  it('rejects requests in production when token is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost/api/health');
    expect(authorizeHealthCheck(req)).toEqual({
      ok: false,
      status: 503,
      reason: 'HEALTH_CHECK_TOKEN is not configured'
    });
  });

  it('accepts a valid bearer token', () => {
    vi.stubEnv('HEALTH_CHECK_TOKEN', 'super-secret');
    const req = new Request('http://localhost/api/health', {
      headers: { authorization: 'Bearer super-secret' }
    });
    expect(authorizeHealthCheck(req)).toEqual({ ok: true });
  });

  it('accepts a valid x-health-token header', () => {
    vi.stubEnv('HEALTH_CHECK_TOKEN', 'super-secret');
    const req = new Request('http://localhost/api/health', {
      headers: { 'x-health-token': 'super-secret' }
    });
    expect(authorizeHealthCheck(req)).toEqual({ ok: true });
  });

  it('rejects an invalid token', () => {
    vi.stubEnv('HEALTH_CHECK_TOKEN', 'super-secret');
    const req = new Request('http://localhost/api/health', {
      headers: { authorization: 'Bearer wrong-token' }
    });
    expect(authorizeHealthCheck(req)).toEqual({
      ok: false,
      status: 401,
      reason: 'Unauthorized'
    });
  });

  it('rejects malformed authorization header values', () => {
    vi.stubEnv('HEALTH_CHECK_TOKEN', 'super-secret');
    const req = new Request('http://localhost/api/health', {
      headers: { authorization: 'Token super-secret' }
    });
    expect(authorizeHealthCheck(req)).toEqual({
      ok: false,
      status: 401,
      reason: 'Unauthorized'
    });
  });
});
