import { registerOTel } from '@vercel/otel';

export function register() {
  const hasOtlpEndpoint = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  const hasOtlpHeaders = Boolean(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  if (!hasOtlpEndpoint || !hasOtlpHeaders) {
    console.warn(
      '[otel] OTLP exporter env vars are not fully configured. Metrics/traces will not reach Grafana Cloud yet.'
    );
  }

  registerOTel({
    serviceName: 'the-stack'
  });
}
