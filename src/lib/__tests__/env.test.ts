import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AFFILIATE_ALLOWED_HOSTS, getAffiliateEnv } from '../env';

describe('getAffiliateEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the curated issuer allowlist when AFFILIATE_ALLOWED_HOSTS is not configured', () => {
    vi.stubEnv('AFFILIATE_ALLOWED_HOSTS', undefined);

    const result = getAffiliateEnv();

    expect(result).toEqual({
      ok: true,
      config: {
        AFFILIATE_ALLOWED_HOSTS: [...DEFAULT_AFFILIATE_ALLOWED_HOSTS]
      }
    });
  });

  it('uses the curated issuer allowlist when AFFILIATE_ALLOWED_HOSTS is blank', () => {
    vi.stubEnv('AFFILIATE_ALLOWED_HOSTS', '  ');

    const result = getAffiliateEnv();

    expect(result).toEqual({
      ok: true,
      config: {
        AFFILIATE_ALLOWED_HOSTS: [...DEFAULT_AFFILIATE_ALLOWED_HOSTS]
      }
    });
  });
});
