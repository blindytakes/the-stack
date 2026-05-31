import { db } from '@/lib/db';
import { getNewsletterProviderStatus } from '@/lib/newsletter/provider';
import { isDatabaseUrlConfigured } from '@/lib/config/server';
import {
  getOTelExporterEnvStatus,
  getPyroscopeEnvStatus,
  getSigilEnvStatus
} from '@/lib/observability-config';

export type HealthCheckResult = {
  status: 200 | 503;
  body: {
    status: 'ok' | 'degraded';
    timestamp: string;
    reason?: string;
    observability: {
      otelExporterConfigured: boolean;
      otelEndpointConfigured: boolean;
      otelHeadersConfigured: boolean;
      otelProtocolConfigured: boolean;
      otelProtocol: string | null;
      sigilConfigured: boolean;
      sigilEndpointConfigured: boolean;
      sigilAuthTenantConfigured: boolean;
      sigilAuthTokenConfigured: boolean;
      sigilProtocolConfigured: boolean;
      sigilProtocol: string | null;
      pyroscopeEnabled: boolean;
      pyroscopeConfigured: boolean;
      pyroscopeServerAddressConfigured: boolean;
      pyroscopeAuthConfigured: boolean;
      pyroscopeApplicationName: string;
    };
  };
};

function buildObservabilityStatus() {
  const otel = getOTelExporterEnvStatus();
  const sigil = getSigilEnvStatus();
  const pyroscope = getPyroscopeEnvStatus();

  return {
    otelExporterConfigured: otel.configured,
    otelEndpointConfigured: otel.endpointConfigured,
    otelHeadersConfigured: otel.headersConfigured,
    otelProtocolConfigured: otel.protocolConfigured,
    otelProtocol: otel.protocol,
    sigilConfigured: sigil.configured,
    sigilEndpointConfigured: sigil.endpointConfigured,
    sigilAuthTenantConfigured: sigil.authTenantConfigured,
    sigilAuthTokenConfigured: sigil.authTokenConfigured,
    sigilProtocolConfigured: sigil.protocolConfigured,
    sigilProtocol: sigil.protocol,
    pyroscopeEnabled: pyroscope.enabled,
    pyroscopeConfigured: pyroscope.configured,
    pyroscopeServerAddressConfigured: pyroscope.serverAddressConfigured,
    pyroscopeAuthConfigured: pyroscope.authConfigured,
    pyroscopeApplicationName: pyroscope.applicationName
  };
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const newsletter = getNewsletterProviderStatus();
  const timestamp = new Date().toISOString();
  const observability = buildObservabilityStatus();

  if (!isDatabaseUrlConfigured()) {
    return {
      status: 503,
      body: {
        status: 'degraded',
        timestamp,
        reason: 'DATABASE_URL is not configured',
        observability
      }
    };
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: newsletter.ok ? 200 : 503,
      body: {
        status: newsletter.ok ? 'ok' : 'degraded',
        timestamp,
        observability
      }
    };
  } catch (error) {
    console.error('[/api/health] DB health check failed:', error);
    return {
      status: 503,
      body: {
        status: 'degraded',
        timestamp,
        observability
      }
    };
  }
}
