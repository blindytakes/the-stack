import { registerOTel } from '@vercel/otel';
import { getOTelExporterEnvStatus } from '@/lib/observability-config';

export function register() {
  const otelEnv = getOTelExporterEnvStatus();

  if (!otelEnv.configured) {
    console.warn(
      '[otel] OTLP exporter env vars are not fully configured. Metrics/traces/logs will not reach Grafana Cloud yet.'
    );
    registerOTel({ serviceName: 'the-stack' });
    return;
  }

  // Only create OTLP exporters when credentials are present.
  // Dynamic imports avoid failed HTTP requests in local dev without Grafana config.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

  registerOTel({
    serviceName: 'the-stack',
    logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: 60000
    })
  });
}
