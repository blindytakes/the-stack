import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSigilEnvStatus } from '../observability-config';

describe('getSigilEnvStatus', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports Sigil configured when endpoint, tenant, and token are set', () => {
    vi.stubEnv('SIGIL_ENDPOINT', 'https://sigil.example.test');
    vi.stubEnv('SIGIL_AUTH_TENANT_ID', '12345');
    vi.stubEnv('SIGIL_AUTH_TOKEN', 'glc_test');
    vi.stubEnv('SIGIL_PROTOCOL', 'http');

    expect(getSigilEnvStatus()).toEqual({
      endpointConfigured: true,
      authTenantConfigured: true,
      authTokenConfigured: true,
      protocol: 'http',
      protocolConfigured: true,
      configured: true
    });
  });

  it('does not report Sigil configured when the token is missing', () => {
    vi.stubEnv('SIGIL_ENDPOINT', 'https://sigil.example.test');
    vi.stubEnv('SIGIL_AUTH_TENANT_ID', '12345');
    vi.stubEnv('SIGIL_AUTH_TOKEN', undefined);

    expect(getSigilEnvStatus()).toMatchObject({
      endpointConfigured: true,
      authTenantConfigured: true,
      authTokenConfigured: false,
      configured: false
    });
  });
});
