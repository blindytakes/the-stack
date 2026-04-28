export type OTelExporterEnvStatus = {
  endpointConfigured: boolean;
  headersConfigured: boolean;
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

  return {
    endpointConfigured,
    headersConfigured,
    configured: endpointConfigured && headersConfigured
  };
}
