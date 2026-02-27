import { registerOTel } from '@vercel/otel';

export function register() {
  const hasOtlpEndpoint = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  const hasOtlpHeaders = Boolean(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  if (!hasOtlpEndpoint || !hasOtlpHeaders) {
    console.warn(
      '[otel] OTLP exporter env vars are not fully configured. Metrics/traces will not reach Grafana Cloud yet.'
    );
    registerOTel({ serviceName: 'the-stack' });
    return;
  }

  // Only create the OTLP log exporter when credentials are present.
  // Dynamic imports avoid failed HTTP requests in local dev without Grafana config.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');

  registerOTel({
    serviceName: 'the-stack',
    logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter())
  });
}
