import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAffiliateEnvMock = vi.fn();
const recordAffiliateClickMock = vi.fn();
const isDevelopmentEnvMock = vi.fn();

vi.mock('@/lib/env', () => ({
  getAffiliateEnv: () => getAffiliateEnvMock()
}));

vi.mock('@/lib/metrics', () => ({
  recordAffiliateClick: (...args: unknown[]) => recordAffiliateClickMock(...args)
}));

vi.mock('@/lib/config/runtime', () => ({
  isDevelopmentEnv: () => isDevelopmentEnvMock()
}));

import { resolveAffiliateClickRedirect } from '@/lib/services/affiliate-service';

describe('resolveAffiliateClickRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDevelopmentEnvMock.mockReturnValue(false);
  });

  it('redirects when the target host is on the configured allowlist', () => {
    getAffiliateEnvMock.mockReturnValue({
      ok: true,
      config: {
        AFFILIATE_ALLOWED_HOSTS: ['creditcards.chase.com']
      }
    });

    const result = resolveAffiliateClickRedirect(
      'http://localhost/api/affiliate/click?card_slug=chase-sapphire-preferred&source=card_detail&target=https%3A%2F%2Fcreditcards.chase.com%2Frewards-credit-cards%2Fsapphire%2Fpreferred'
    );

    expect(result).toEqual({
      ok: true,
      redirectUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred'
    });
    expect(recordAffiliateClickMock).toHaveBeenCalledWith(
      'chase-sapphire-preferred',
      'card_detail'
    );
  });

  it('rejects targets outside the configured allowlist', () => {
    getAffiliateEnvMock.mockReturnValue({
      ok: true,
      config: {
        AFFILIATE_ALLOWED_HOSTS: ['creditcards.chase.com']
      }
    });

    const result = resolveAffiliateClickRedirect(
      'http://localhost/api/affiliate/click?card_slug=chase-sapphire-preferred&source=card_detail&target=https%3A%2F%2Fevil.example%2Foffer'
    );

    expect(result).toEqual({
      ok: false,
      error: 'Invalid or unapproved target URL'
    });
    expect(recordAffiliateClickMock).not.toHaveBeenCalled();
  });

  it('falls back to the target host in development when the allowlist env is missing', () => {
    getAffiliateEnvMock.mockReturnValue({
      ok: false,
      errors: ['Required']
    });
    isDevelopmentEnvMock.mockReturnValue(true);

    const result = resolveAffiliateClickRedirect(
      'http://localhost/api/affiliate/click?card_slug=citi-custom-cash-card&source=card_detail&target=https%3A%2F%2Fwww.citi.com%2Fcredit-cards%2Fciti-custom-cash-credit-card'
    );

    expect(result).toEqual({
      ok: true,
      redirectUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card'
    });
    expect(recordAffiliateClickMock).toHaveBeenCalledWith(
      'citi-custom-cash-card',
      'card_detail'
    );
  });

  it('fails closed outside development when the allowlist env is missing', () => {
    getAffiliateEnvMock.mockReturnValue({
      ok: false,
      errors: ['Required']
    });

    const result = resolveAffiliateClickRedirect(
      'http://localhost/api/affiliate/click?card_slug=citi-custom-cash-card&source=card_detail&target=https%3A%2F%2Fwww.citi.com%2Fcredit-cards%2Fciti-custom-cash-credit-card'
    );

    expect(result).toEqual({
      ok: false,
      error: 'Affiliate tracking is unavailable'
    });
    expect(recordAffiliateClickMock).not.toHaveBeenCalled();
  });
});
