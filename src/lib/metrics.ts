import { metrics, type Counter, type Histogram } from '@opentelemetry/api';

type WebVitalName = 'LCP' | 'CLS' | 'INP' | 'TTFB';

type AppMetrics = {
  apiDuration: Histogram;
  apiErrors: Counter;
  newsletterSyncAttempts: Counter;
  newsletterSyncResults: Counter;
  affiliateClicks: Counter;
  webVitalHistograms: Record<WebVitalName, Histogram>;
};

let appMetrics: AppMetrics | null = null;

function getAppMetrics() {
  if (appMetrics) return appMetrics;

  const meter = metrics.getMeter('the-stack');

  appMetrics = {
    apiDuration: meter.createHistogram('thestack.api.duration', {
      unit: 'ms',
      description: 'API route latency'
    }),
    apiErrors: meter.createCounter('thestack.api.errors', {
      description: 'API error count'
    }),
    newsletterSyncAttempts: meter.createCounter('thestack.newsletter.sync.attempts', {
      description: 'Newsletter provider sync attempts'
    }),
    newsletterSyncResults: meter.createCounter('thestack.newsletter.sync.results', {
      description: 'Newsletter provider sync result count'
    }),
    affiliateClicks: meter.createCounter('thestack.affiliate.clicks', {
      description: 'Outbound affiliate/apply clicks'
    }),
    webVitalHistograms: {
      LCP: meter.createHistogram('thestack.web.lcp', {
        unit: 'ms',
        description: 'Largest Contentful Paint'
      }),
      CLS: meter.createHistogram('thestack.web.cls', {
        description: 'Cumulative Layout Shift'
      }),
      INP: meter.createHistogram('thestack.web.inp', {
        unit: 'ms',
        description: 'Interaction to Next Paint'
      }),
      TTFB: meter.createHistogram('thestack.web.ttfb', {
        unit: 'ms',
        description: 'Time to First Byte'
      })
    }
  };

  return appMetrics;
}

export function recordApiDuration(route: string, method: string, statusCode: number, durationMs: number) {
  getAppMetrics().apiDuration.record(durationMs, {
    route,
    method,
    status_code: String(statusCode)
  });
}

export function recordApiError(route: string, errorType: string) {
  getAppMetrics().apiErrors.add(1, {
    route,
    error_type: errorType
  });
}

export function recordNewsletterSyncAttempt(provider: string, attempt: number) {
  getAppMetrics().newsletterSyncAttempts.add(1, {
    provider,
    attempt: String(attempt)
  });
}

export function recordNewsletterSyncResult(
  provider: string,
  result: 'subscribed' | 'already_subscribed' | 'failed',
  attempts: number
) {
  getAppMetrics().newsletterSyncResults.add(1, {
    provider,
    result,
    attempts: String(attempts)
  });
}

export function recordAffiliateClick(cardSlug: string, source: string) {
  getAppMetrics().affiliateClicks.add(1, {
    card_slug: cardSlug,
    source
  });
}

export function recordWebVital(
  metricName: WebVitalName,
  value: number,
  attributes: {
    path: string;
    device: 'mobile' | 'desktop';
  }
) {
  getAppMetrics().webVitalHistograms[metricName].record(value, attributes);
}
