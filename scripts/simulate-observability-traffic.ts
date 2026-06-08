type StatusCounts = Map<string, number>;

type TrafficOptions = {
  baseUrl: string;
  origin: string;
  iterations: number;
  includeErrors: boolean;
  includeRateLimitBurst: boolean;
};

type RequestResult = {
  label: string;
  status: number | 'ERR';
  ms: number;
  error?: string;
};

const DEFAULT_ITERATIONS = 12;

const funnelEvents = [
  ['landing_view', { path: '/', source: 'homepage' }],
  [
    'tool_started',
    { path: '/tools/card-finder', source: 'homepage', tool: 'card-finder' }
  ],
  [
    'quiz_completed',
    { path: '/tools/card-finder', source: 'card_finder', tool: 'card-finder' }
  ],
  ['plan_results_view', { path: '/plan/results', source: 'card_finder' }],
  [
    'card_detail_view',
    {
      path: '/cards/chase-sapphire-reserve',
      source: 'cards_directory',
      card_slug: 'chase-sapphire-reserve'
    }
  ],
  [
    'banking_detail_view',
    {
      path: '/banking/chase-total-checking',
      source: 'banking_directory',
      bank_slug: 'chase-total-checking'
    }
  ],
  [
    'points_advisor_recommendation_view',
    { path: '/tools/points-advisor', source: 'homepage', tool: 'points-advisor' }
  ],
  ['newsletter_subscribed', { path: '/newsletter', source: 'footer' }],
  [
    'affiliate_click',
    {
      path: '/cards/chase-sapphire-reserve',
      source: 'card_detail',
      card_slug: 'chase-sapphire-reserve'
    }
  ]
] as const;

const vitalNames = ['LCP', 'INP', 'TTFB', 'CLS'] as const;
const vitalPaths = [
  '/',
  '/cards',
  '/banking',
  '/tools/card-finder',
  '/tools/premium-card-calculator',
  '/plan/results'
] as const;

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value?.trim() || process.env.OBSERVABILITY_TRAFFIC_BASE_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

function parseOptions(): TrafficOptions {
  const baseUrl = normalizeBaseUrl(readArg('base-url'));
  return {
    baseUrl,
    origin: readArg('origin')?.trim().replace(/\/+$/, '') || baseUrl,
    iterations: parsePositiveInteger(readArg('iterations'), DEFAULT_ITERATIONS),
    includeErrors: !hasFlag('no-errors'),
    includeRateLimitBurst: hasFlag('rate-limit-burst')
  };
}

function jsonPost(body: unknown, origin: string): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin
    }
  };
}

async function hit(
  options: TrafficOptions,
  label: string,
  path: string,
  init: RequestInit = {}
): Promise<RequestResult> {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${options.baseUrl}${path}`, {
      redirect: 'manual',
      ...init
    });
    await response.arrayBuffer().catch(() => undefined);
    return {
      label,
      status: response.status,
      ms: Math.round(performance.now() - startedAt)
    };
  } catch (error) {
    return {
      label,
      status: 'ERR',
      ms: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildVitalPayload(index: number) {
  const name = vitalNames[index % vitalNames.length];
  return {
    name,
    value: name === 'CLS' ? (index % 8) / 100 : 120 + (index % 30) * 63,
    path: vitalPaths[index % vitalPaths.length],
    device: index % 3 === 0 ? 'mobile' : 'desktop'
  };
}

async function runTraffic(options: TrafficOptions): Promise<RequestResult[]> {
  const results: RequestResult[] = [];

  for (let index = 0; index < options.iterations; index += 1) {
    results.push(await hit(options, 'cards-list', `/api/cards?limit=12&offset=${index % 3}`));
    results.push(await hit(options, 'banking-list', `/api/banking?limit=10&offset=${index % 4}`));
    results.push(await hit(options, 'card-detail', '/api/cards/chase-sapphire-reserve'));

    const [event, properties] = funnelEvents[index % funnelEvents.length];
    results.push(
      await hit(
        options,
        'funnel-event',
        '/api/funnel/events',
        jsonPost({ event, properties }, options.origin)
      )
    );

    results.push(
      await hit(
        options,
        'vitals',
        '/api/vitals',
        jsonPost(buildVitalPayload(index), options.origin)
      )
    );
  }

  results.push(await hit(options, 'health', '/api/health'));
  results.push(
    await hit(options, 'tracker-download', '/api/tools/personal-finance-tracker/download')
  );
  results.push(
    await hit(
      options,
      'affiliate-click',
      '/api/affiliate/click?card_slug=chase-sapphire-reserve&source=card_detail&target=https%3A%2F%2Fwww.chase.com%2Fcredit-cards'
    )
  );

  if (options.includeErrors) {
    results.push(await hit(options, 'card-missing', '/api/cards/not-a-real-card-observability-test'));
    results.push(
      await hit(
        options,
        'vitals-invalid',
        '/api/vitals',
        jsonPost({ name: 'LCP', value: -1, path: '/', device: 'desktop' }, options.origin)
      )
    );
  }

  if (options.includeRateLimitBurst) {
    for (let index = 0; index < 130; index += 1) {
      results.push(
        await hit(
          options,
          'vitals-burst',
          '/api/vitals',
          jsonPost(buildVitalPayload(index), options.origin)
        )
      );
    }
  }

  return results;
}

function summarize(results: RequestResult[]): StatusCounts {
  const counts: StatusCounts = new Map();
  for (const result of results) {
    const key = `${result.label} ${result.status}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function printSummary(options: TrafficOptions, results: RequestResult[]) {
  const counts = summarize(results);
  const latencies = results.map((result) => result.ms).sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.floor((latencies.length - 1) * p)] ?? 0;
  const transportErrors = results.filter((result) => result.status === 'ERR');

  console.log(`base_url ${options.baseUrl}`);
  console.log(`requests_sent ${results.length}`);
  for (const [key, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${key}: ${count}`);
  }
  console.log(
    `latency_ms_min_p50_p95_max ${latencies[0] ?? 0} ${percentile(0.5)} ${percentile(0.95)} ${
      latencies.at(-1) ?? 0
    }`
  );

  if (transportErrors.length > 0) {
    console.log('transport_errors');
    for (const error of transportErrors.slice(0, 10)) {
      console.log(`${error.label}: ${error.error}`);
    }
  }
}

async function main() {
  const options = parseOptions();
  const results = await runTraffic(options);
  printSummary(options, results);
}

void main();

export {};
