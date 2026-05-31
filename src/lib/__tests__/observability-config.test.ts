import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapAssistantUsage } from '@/lib/assistant/observability';
import { getPyroscopeEnvStatus, getSigilEnvStatus } from '../observability-config';

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

describe('getPyroscopeEnvStatus', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires explicit enablement before reporting Pyroscope configured', () => {
    vi.stubEnv('PYROSCOPE_SERVER_ADDRESS', 'https://profiles.example.test');
    vi.stubEnv('PYROSCOPE_BASIC_AUTH_USER', '12345');
    vi.stubEnv('PYROSCOPE_BASIC_AUTH_PASSWORD', 'glc_test');

    expect(getPyroscopeEnvStatus()).toMatchObject({
      enabled: false,
      serverAddressConfigured: true,
      authConfigured: true,
      applicationName: 'the-stack',
      configured: false
    });
  });

  it('reports Pyroscope configured with a server address and basic auth when enabled', () => {
    vi.stubEnv('PYROSCOPE_ENABLED', 'true');
    vi.stubEnv('PYROSCOPE_SERVER_ADDRESS', 'https://profiles.example.test');
    vi.stubEnv('PYROSCOPE_BASIC_AUTH_USER', '12345');
    vi.stubEnv('PYROSCOPE_BASIC_AUTH_PASSWORD', 'glc_test');
    vi.stubEnv('PYROSCOPE_APPLICATION_NAME', 'the-stack-production');

    expect(getPyroscopeEnvStatus()).toEqual({
      enabled: true,
      serverAddressConfigured: true,
      authTokenConfigured: false,
      basicAuthUserConfigured: true,
      basicAuthPasswordConfigured: true,
      authConfigured: true,
      applicationName: 'the-stack-production',
      configured: true
    });
  });

  it('supports bearer token auth for Pyroscope', () => {
    vi.stubEnv('PYROSCOPE_ENABLED', '1');
    vi.stubEnv('PYROSCOPE_SERVER_ADDRESS', 'https://profiles.example.test');
    vi.stubEnv('PYROSCOPE_AUTH_TOKEN', 'profile_token');

    expect(getPyroscopeEnvStatus()).toMatchObject({
      enabled: true,
      authTokenConfigured: true,
      authConfigured: true,
      configured: true
    });
  });
});

describe('mapAssistantUsage', () => {
  it('maps Vercel AI SDK token details to Sigil usage fields', () => {
    expect(
      mapAssistantUsage({
        inputTokens: 100,
        inputTokenDetails: {
          noCacheTokens: 80,
          cacheReadTokens: 15,
          cacheWriteTokens: 5
        },
        outputTokens: 40,
        outputTokenDetails: {
          textTokens: 30,
          reasoningTokens: 10
        },
        totalTokens: 140
      })
    ).toEqual({
      inputTokens: 100,
      outputTokens: 40,
      totalTokens: 140,
      cacheReadInputTokens: 15,
      cacheWriteInputTokens: 5,
      reasoningTokens: 10
    });
  });
});
