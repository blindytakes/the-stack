# Interview Observability Demo

Use this as the interview talk track for presenting The Stack and its Grafana dashboards.

## Core Positioning

The Stack is a production-shaped personal finance product, not a static portfolio site.

It helps users build a 6-month plan around credit card and banking signup bonuses. The observability layer is designed to answer the same questions an engineer would need to answer after launch:

- Is the app healthy and reliable?
- Are important routes fast enough?
- Are users completing the core planning workflow?
- Are high-intent events such as newsletter signups and outbound offer clicks working?
- Is the AI assistant observable without capturing sensitive user content?

## 5-Minute Demo Flow

1. Start with the product.

   Show the homepage, `/tools/card-finder`, `/plan/results`, `/cards`, and `/banking`. Explain the north-star workflow: users move from landing page to planner, results, offer detail, then action.

2. Open `The Stack Overview`.

   Explain that this is the first operational screen: request rate, error ratio, route latency, throughput, business events, Web Vitals, and API logs.

3. Open `The Stack Product Funnel`.

   Explain the product signals: landing views, tool starts, quiz completions, plan result views, offer detail views, newsletter subscriptions, affiliate clicks, newsletter sync attempts, and tracker-download fallbacks. Call out that the Grafana labels intentionally avoid raw slugs and user identifiers to control cardinality and privacy risk.

4. Open `The Stack API Reliability`.

   Walk through RED metrics: rate, errors, duration. Then show route p95/p99 latency, 429s, status-code throughput, and error logs. This is the dashboard you would use during an incident.

5. Open `The Stack Web Vitals`.

   Show LCP, INP, CLS, and TTFB by route and device, including the threshold bands for good, needs-improvement, and poor experiences. Tie it back to user trust: a finance decision product needs to feel fast and stable.

6. Open `The Stack AI Assistant`.

   Explain that assistant traffic has normal API metrics plus Grafana AI Observability/Sigil metadata. The app defaults to metadata-only capture so model, token, timing, and error telemetry can be observed without exporting raw conversations.

## What To Emphasize

- The app uses shared API instrumentation instead of one-off logging in each route.
- Browser telemetry and server telemetry meet in Grafana.
- Product analytics still go to PostHog, but key funnel events also emit OTel counters for operational visibility.
- Funnel metrics are intentionally low-cardinality: `event`, normalized `path`, `source`, `tool`, and `entity_type`.
- The health endpoint checks database availability and reports whether OTLP, Sigil, and Pyroscope are configured.
- Rate limits are visible as HTTP 429s in the API reliability dashboard.
- Server-confirmed newsletter attempts and tracker fallback downloads are visible separately from browser-only funnel events.

## Strong Interview Lines

- "I wanted the dashboards to reflect the product's actual operating model, not generic vanity charts."
- "I separated reliability signals from product funnel signals, but kept a one-screen overview for triage."
- "For the funnel dashboard, I deliberately avoided labels like raw card slug or email because that creates cardinality and privacy problems."
- "The AI assistant is instrumented with metadata-only observability by default, which lets me see cost, latency, and failure behavior without collecting prompts."
- "If this were a team-owned service, the first alerts I would add are API error ratio, p95 latency, health-check failures, and Web Vitals regressions."

## Dashboard Map

| Dashboard | Purpose | Primary Signals |
| --- | --- | --- |
| The Stack Overview | One-screen operations summary | API rate/errors/latency, business events, Web Vitals, API logs |
| The Stack Product Funnel | Product conversion and high-intent actions | Landing views, tool starts, quiz completions, plan result views, detail views, newsletter, affiliate clicks, newsletter sync attempts, tracker fallbacks |
| The Stack API Reliability | Incident and SLO workflow | RED metrics, p95/p99 route latency, 429s, 4xx/5xx logs |
| The Stack Web Vitals | Frontend user experience | LCP, INP, CLS, TTFB by route and device |
| The Stack AI Assistant | AI feature operations | Assistant route reliability, rate limits, GenAI duration, token usage, time to first token |

## Good Follow-Up Ideas

- Add Grafana Synthetic Monitoring against `/api/health`.
- Add explicit assistant counters for safety blocks, budget stops, and daily rate-limit outcomes.
- Add Prisma query duration metrics if database latency becomes a recurring bottleneck.
- Add alert rules for API error ratio, p95 latency, health status, and Web Vitals p75 thresholds.
