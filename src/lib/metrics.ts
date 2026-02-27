import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('the-stack');

export const apiDuration = meter.createHistogram('thestack.api.duration', {
  unit: 'ms',
  description: 'API route latency'
});

export const apiErrors = meter.createCounter('thestack.api.errors', {
  description: 'API error count'
});

const webVitalHistograms = {
  LCP: meter.createHistogram('thestack.web.lcp', {
    unit: 'ms',
    description: 'Largest Contentful Paint'
  }),
  FID: meter.createHistogram('thestack.web.fid', {
    unit: 'ms',
    description: 'First Input Delay'
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
