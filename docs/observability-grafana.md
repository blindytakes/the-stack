# Grafana Observability

The app already registers OpenTelemetry through `instrumentation.ts` and exports API metrics, business-event counters, web vitals, structured API logs, and traces through Vercel's Next.js OTEL integration.

## Current Coverage

- `instrumentation.ts` registers service name `the-stack` and enables OTLP log and metric exporters when OTLP endpoint and headers are configured.
- `src/lib/api-route.ts` wraps API routes with latency histograms, error counters, and JSON log records.
- `src/lib/metrics.ts` defines app metrics for API latency/errors, newsletter syncs, affiliate clicks, and web vitals.
- `src/components/analytics/web-vitals.tsx` sends LCP, CLS, INP, and TTFB beacons to `/api/vitals`.
- `src/app/api/health/route.ts` exposes health status and reports whether the OTLP exporter env is configured.

## Grafana Cloud Setup

1. In Grafana Cloud, open the stack and go to **OpenTelemetry > Configure**.
2. Generate an OTLP API token and copy the environment variables Grafana provides.
3. Set these variables in the deployment environment:

```bash
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=https://<your-grafana-otlp-endpoint>/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-instance-id-and-token>
```

4. Redeploy the app so Next.js runs `instrumentation.ts` with the OTLP env present.
5. Hit `/api/health` with the configured health token and confirm:

```json
{
  "observability": {
    "otelExporterConfigured": true,
    "otelEndpointConfigured": true,
    "otelHeadersConfigured": true,
    "otelProtocolConfigured": true,
    "otelProtocol": "http/protobuf"
  }
}
```

6. Import `observability/grafana/the-stack-overview-dashboard.json` in Grafana via **Dashboards > New > Import**.
7. Select the stack's Prometheus/Mimir data source for metrics and Loki data source for logs.
8. Keep the dashboard label variables at their Grafana Cloud OTLP defaults unless Explore shows different labels:
   - `Metric Service Label`: `service_name`
   - `Log Service Label`: `service_name`

Metrics are exported every 60 seconds, so generate traffic and wait at least one export interval before treating an empty dashboard as a failure.

## Local Smoke Test

Run the app and check whether this checkout is actually configured to export telemetry:

```bash
npm run dev
curl -i http://localhost:3000/api/health
```

If `HEALTH_CHECK_TOKEN` is configured, pass either `Authorization: Bearer <token>` or `x-health-token: <token>`.

The health response should include:

```json
{
  "observability": {
    "otelExporterConfigured": true,
    "otelEndpointConfigured": true,
    "otelHeadersConfigured": true,
    "otelProtocolConfigured": true,
    "otelProtocol": "http/protobuf"
  }
}
```

If any of those values are `false`, the app can run but telemetry will not reach Grafana Cloud from that environment.

To generate test telemetry after OTLP env vars are set:

```bash
curl -i http://localhost:3000/api/cards
curl -i http://localhost:3000/api/vitals \
  -X POST \
  -H 'content-type: application/json' \
  --data '{"name":"LCP","value":1234,"path":"/","device":"desktop"}'
```

Then check Grafana Explore for `thestack_api_duration_milliseconds_count` in the metrics data source and `{service_name="the-stack"}` in the logs data source. If logs only appear under `job`, switch the dashboard's `Log Service Label` variable to `job`.

## Expected Grafana Metric Names

Grafana Cloud stores OTLP metrics in Prometheus-compatible form. Dots become underscores, metric attributes become labels, counters receive `_total`, and millisecond histograms receive a `_milliseconds` unit suffix.

| App instrument | Grafana metric |
| --- | --- |
| `thestack.api.duration` | `thestack_api_duration_milliseconds_bucket/count/sum` |
| `thestack.api.errors` | `thestack_api_errors_total` |
| `thestack.newsletter.sync.attempts` | `thestack_newsletter_sync_attempts_total` |
| `thestack.newsletter.sync.results` | `thestack_newsletter_sync_results_total` |
| `thestack.affiliate.clicks` | `thestack_affiliate_clicks_total` |
| `thestack.web.lcp` | `thestack_web_lcp_milliseconds_bucket/count/sum` |
| `thestack.web.inp` | `thestack_web_inp_milliseconds_bucket/count/sum` |
| `thestack.web.ttfb` | `thestack_web_ttfb_milliseconds_bucket/count/sum` |
| `thestack.web.cls` | `thestack_web_cls_bucket/count/sum` |

The dashboard defaults metric and log queries to `service_name="the-stack"` because this Grafana Cloud stack exposes existing OTLP services under the `service_name` label in Explore. If imported dashboards are empty but Explore shows The Stack under `job`, switch the dashboard's `Metric Service Label` variable to `job`.

## First Alerts To Add

- API error ratio over 5% for 10 minutes.
- API p95 latency over 1000 ms for 10 minutes.
- Health check status is not 200 for 5 minutes.
- Web vitals p75 LCP over 2500 ms or INP over 200 ms for 30 minutes.
- Newsletter sync failures greater than zero over 30 minutes.

## Gaps To Close Later

- Use Grafana Alloy or an OpenTelemetry Collector in production if telemetry volume grows or if retries, redaction, sampling, or resource enrichment become necessary.
- Add DB query duration/error metrics around Prisma calls if database latency becomes a common incident source.
- Add route-level conversion counters for plan creation, calculator email capture, and newsletter signups if Grafana should become the source of truth for funnel monitoring.
- Add uptime checks in Grafana Synthetic Monitoring against `/api/health` using `Authorization: Bearer <HEALTH_CHECK_TOKEN>`.
