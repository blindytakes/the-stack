# Grafana Observability

The app already registers OpenTelemetry through `src/instrumentation.ts` and exports API metrics, business-event counters, web vitals, structured API logs, and traces through Vercel's Next.js OTEL integration.

## Current Coverage

- `src/instrumentation.ts` registers service name `the-stack` and enables OTLP log and metric exporters when OTLP endpoint and headers are configured.
- `src/lib/api-route.ts` wraps API routes with latency histograms, error counters, and JSON log records.
- `src/lib/metrics.ts` defines app metrics for API latency/errors, product funnel events, newsletter syncs, affiliate clicks, and web vitals.
- `src/app/api/funnel/events/route.ts` accepts same-origin browser funnel beacons and exports low-cardinality product-event counters to Grafana.
- `src/components/analytics/web-vitals.tsx` sends LCP, CLS, INP, and TTFB beacons to `/api/vitals`.
- `src/app/api/health/route.ts` exposes health status and reports whether the OTLP exporter env is configured.
- `src/app/api/assistant/route.ts` instruments Vercel AI SDK `streamText` calls with Grafana AI Observability when Sigil env vars are configured.
- `src/lib/profiling.ts` starts the Pyroscope Node.js profiler when `PYROSCOPE_ENABLED=true` and Grafana Cloud Profiles credentials are configured.

## Grafana Cloud Setup

1. In Grafana Cloud, open the stack and go to **OpenTelemetry > Configure**.
2. Generate an OTLP API token and copy the environment variables Grafana provides.
3. Set these variables in the deployment environment:

```bash
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=https://<your-grafana-otlp-endpoint>/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-instance-id-and-token>
```

4. Redeploy the app so Next.js runs `src/instrumentation.ts` with the OTLP env present.
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

6. Import the dashboard JSON files in `observability/grafana` via **Dashboards > New > Import**:
   - `the-stack-overview-dashboard.json`
   - `the-stack-product-funnel-dashboard.json`
   - `the-stack-api-reliability-dashboard.json`
   - `the-stack-web-vitals-dashboard.json`
   - `the-stack-ai-assistant-dashboard.json`
7. Select the stack's Prometheus/Mimir data source for metrics and Loki data source for logs.
8. Keep the dashboard label variables at their Grafana Cloud OTLP defaults unless Explore shows different labels:
   - `Metric Service Label`: `service_name`
   - `Log Service Label`: `service_name`

Metrics are exported every 60 seconds, so generate traffic and wait at least one export interval before treating an empty dashboard as a failure.

## AI Observability Setup

Grafana AI Observability is exposed as Sigil in SDKs and environment variables.

1. In Grafana Cloud, go to **Observability > AI Observability** and enable the plugin.
2. Open the AI Observability configuration page and copy:
   - API URL -> `SIGIL_ENDPOINT`
   - Instance ID -> `SIGIL_AUTH_TENANT_ID`
3. In **Cloud access policy**, create a token with `sigil:write`. If using the same token for OTLP, also include `metrics:write`, `traces:write`, and `logs:write`.
4. Set these production and preview env vars in Vercel:

```bash
SIGIL_ENDPOINT=https://<your-sigil-api-url>
SIGIL_PROTOCOL=http
SIGIL_AUTH_MODE=basic
SIGIL_AUTH_TENANT_ID=<ai-observability-instance-id>
SIGIL_AUTH_TOKEN=<glc-token-with-sigil-write>
SIGIL_CONTENT_CAPTURE_MODE=metadata_only
```

5. Redeploy the app, open the assistant, and send a real prompt.
6. In Grafana, open **Observability > AI Observability > Conversations**. The generation should appear within a few seconds.

The app defaults to `metadata_only` capture for privacy and free-tier volume control. That preserves model, token, timing, trace, and error metadata without exporting raw user prompts or model responses. Use `SIGIL_CONTENT_CAPTURE_MODE=no_tool_content` or `full` only when you intentionally want conversation text captured in Grafana.

The health endpoint reports Sigil configuration without exposing secrets:

```json
{
  "observability": {
    "sigilConfigured": true,
    "sigilEndpointConfigured": true,
    "sigilAuthTenantConfigured": true,
    "sigilAuthTokenConfigured": true,
    "sigilProtocolConfigured": true,
    "sigilProtocol": "http"
  }
}
```

## Pyroscope Profiling Setup

Profiling is disabled by default and only starts in the Node.js runtime when explicitly enabled. This avoids loading the native profiler in local/dev or edge paths unintentionally.

1. In Grafana Cloud, open the stack details and locate the Profiles / Pyroscope configuration values.
2. Set these production and preview env vars in Vercel:

```bash
PYROSCOPE_ENABLED=true
PYROSCOPE_APPLICATION_NAME=the-stack
PYROSCOPE_SERVER_ADDRESS=https://<your-grafana-profiles-url>
PYROSCOPE_BASIC_AUTH_USER=<stack-user-id>
PYROSCOPE_BASIC_AUTH_PASSWORD=<profiles-token-or-password>
```

If your Pyroscope endpoint supports bearer auth, you can set `PYROSCOPE_AUTH_TOKEN` instead of the basic auth user/password pair.

3. Redeploy the app.
4. Generate server-side traffic that executes API routes or dynamic server rendering.
5. In Grafana, open **Profiles** or **Explore**, select the Pyroscope data source, and query the `the-stack` application.

The Node SDK starts wall and heap profiling. The app also forces `wall.collectCpuTime=true` so CPU time is included in wall profiles. On Vercel this profiles Node.js function execution while a function instance is alive; static CDN hits, browser rendering, and edge-runtime code are outside this profile.

The health endpoint reports Pyroscope status without exposing secrets:

```json
{
  "observability": {
    "pyroscopeEnabled": true,
    "pyroscopeConfigured": true,
    "pyroscopeServerAddressConfigured": true,
    "pyroscopeAuthConfigured": true,
    "pyroscopeApplicationName": "the-stack"
  }
}
```

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
curl -i http://localhost:3000/api/funnel/events \
  -X POST \
  -H 'content-type: application/json' \
  --data '{"event":"tool_started","properties":{"path":"/tools/card-finder","source":"homepage","tool":"card-finder"}}'
```

Then check Grafana Explore for `thestack_api_duration_milliseconds_count` in the metrics data source and `{service_name="the-stack"}` in the logs data source. If metrics or logs only appear under `job`, switch the dashboard's matching service-label variable to `job`.

## Expected Grafana Metric Names

Grafana Cloud stores OTLP metrics in Prometheus-compatible form. Dots become underscores, metric attributes become labels, counters receive `_total`, and millisecond histograms receive a `_milliseconds` unit suffix.

| App instrument | Grafana metric |
| --- | --- |
| `thestack.api.duration` | `thestack_api_duration_milliseconds_bucket/count/sum` |
| `thestack.api.errors` | `thestack_api_errors_total` |
| `thestack.funnel.events` | `thestack_funnel_events_total` |
| `thestack.newsletter.sync.attempts` | `thestack_newsletter_sync_attempts_total` |
| `thestack.newsletter.sync.results` | `thestack_newsletter_sync_results_total` |
| `thestack.affiliate.clicks` | `thestack_affiliate_clicks_total` |
| `thestack.web.lcp` | `thestack_web_lcp_milliseconds_bucket/count/sum` |
| `thestack.web.inp` | `thestack_web_inp_milliseconds_bucket/count/sum` |
| `thestack.web.ttfb` | `thestack_web_ttfb_milliseconds_bucket/count/sum` |
| `thestack.web.cls` | `thestack_web_cls_bucket/count/sum` |

Grafana AI Observability also emits GenAI metrics through OTLP when providers are configured:

| AI Observability metric | Purpose |
| --- | --- |
| `gen_ai_client_operation_duration` | LLM operation latency |
| `gen_ai_client_token_usage` | Input/output/total token usage |
| `gen_ai_client_time_to_first_token` | Streaming time to first token |
| `gen_ai_client_tool_calls_per_operation` | Tool call count per generation |

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
- Add explicit assistant block counters for safety, rate-limit, and monthly budget outcomes if those need to show in the same dashboard as model generations.
