import { db } from '@/lib/db';
import { getNewsletterProviderStatus } from '@/lib/newsletter/provider';
import { isDatabaseUrlConfigured } from '@/lib/config/server';
import { getOTelExporterEnvStatus, getSigilEnvStatus } from '@/lib/observability-config';

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
    };
  };
};

function buildObservabilityStatus() {
  const otel = getOTelExporterEnvStatus();
  const sigil = getSigilEnvStatus();

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
    sigilProtocol: sigil.protocol
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
