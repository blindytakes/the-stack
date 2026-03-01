import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('the-stack');

export const apiDuration = meter.createHistogram('thestack.api.duration', {
  unit: 'ms',
  description: 'API route latency'
});

export const apiErrors = meter.createCounter('thestack.api.errors', {
  description: 'API error count'
});

const newsletterSyncAttempts = meter.createCounter('thestack.newsletter.sync.attempts', {
  description: 'Newsletter provider sync attempts'
});

const newsletterSyncResults = meter.createCounter('thestack.newsletter.sync.results', {
  description: 'Newsletter provider sync result count'
});

const affiliateClicks = meter.createCounter('thestack.affiliate.clicks', {
  description: 'Outbound affiliate/apply clicks'
});

const webVitalHistograms = {
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
} as const;

export function recordApiDuration(route: string, method: string, statusCode: number, durationMs: number) {
  apiDuration.record(durationMs, {
    route,
    method,
    status_code: String(statusCode)
  });
}

export function recordApiError(route: string, errorType: string) {
  apiErrors.add(1, {
    route,
    error_type: errorType
  });
}

export function recordNewsletterSyncAttempt(provider: string, attempt: number) {
  newsletterSyncAttempts.add(1, {
    provider,
    attempt: String(attempt)
  });
}

export function recordNewsletterSyncResult(
  provider: string,
  result: 'subscribed' | 'already_subscribed' | 'failed',
  attempts: number
) {
  newsletterSyncResults.add(1, {
    provider,
    result,
    attempts: String(attempts)
  });
}

export function recordAffiliateClick(cardSlug: string, source: string) {
  affiliateClicks.add(1, {
    card_slug: cardSlug,
    source
  });
}

export function recordWebVital(
  metricName: keyof typeof webVitalHistograms,
  value: number,
  attributes: {
    path: string;
    device: 'mobile' | 'desktop';
  }
) {
  webVitalHistograms[metricName].record(value, attributes);
}
