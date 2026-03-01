'use client';

import { useReportWebVitals } from 'next/web-vitals';

type WebVitalPayload = {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  path: string;
  device: 'mobile' | 'desktop';
};

/**
 * Normalize raw pathnames to route templates so OTEL metrics don't explode
 * in cardinality. E.g. /cards/apex-cash-plus → /cards/[slug]
 */
function normalizePathToRoute(pathname: string): string {
  // /cards/<anything> → /cards/[slug]
  if (/^\/cards\/[^/]+$/.test(pathname)) return '/cards/[slug]';
  // /learn/<anything> → /learn/[slug]
  if (/^\/learn\/[^/]+$/.test(pathname)) return '/learn/[slug]';
  return pathname;
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const supported = ['LCP', 'FID', 'CLS', 'INP', 'TTFB'] as const;
    if (!supported.includes(metric.name as (typeof supported)[number])) {
      return;
    }

    const payload: WebVitalPayload = {
      name: metric.name as WebVitalPayload['name'],
      value: metric.value,
      path: normalizePathToRoute(window.location.pathname),
      device: window.innerWidth < 640 ? 'mobile' : 'desktop'
    };

    navigator.sendBeacon('/api/vitals', JSON.stringify(payload));
  });

  return null;
}
