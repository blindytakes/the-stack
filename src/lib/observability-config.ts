export type OTelExporterEnvStatus = {
  endpointConfigured: boolean;
  headersConfigured: boolean;
  protocol: string | null;
  protocolConfigured: boolean;
  configured: boolean;
};

export type SigilEnvStatus = {
  endpointConfigured: boolean;
  authTenantConfigured: boolean;
  authTokenConfigured: boolean;
  protocol: string | null;
  protocolConfigured: boolean;
  configured: boolean;
};

export function getOTelExporterEnvStatus(): OTelExporterEnvStatus {
  const endpointConfigured = Boolean(
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT
  );
  const headersConfigured = Boolean(
    process.env.OTEL_EXPORTER_OTLP_HEADERS ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS ||
      process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS ||
      process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS
  );
  const protocol =
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||
    process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL ||
    process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL ||
    process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL ||
    null;

  return {
    endpointConfigured,
    headersConfigured,
    protocol,
    protocolConfigured: Boolean(protocol),
    configured: endpointConfigured && headersConfigured
  };
}

export function getSigilEnvStatus(): SigilEnvStatus {
  const endpointConfigured = Boolean(process.env.SIGIL_ENDPOINT?.trim());
  const authTenantConfigured = Boolean(process.env.SIGIL_AUTH_TENANT_ID?.trim());
  const authTokenConfigured = Boolean(process.env.SIGIL_AUTH_TOKEN?.trim());
  const protocol = process.env.SIGIL_PROTOCOL?.trim() || null;

  return {
    endpointConfigured,
    authTenantConfigured,
    authTokenConfigured,
    protocol,
    protocolConfigured: Boolean(protocol),
    configured: endpointConfigured && authTenantConfigured && authTokenConfigured
  };
}
