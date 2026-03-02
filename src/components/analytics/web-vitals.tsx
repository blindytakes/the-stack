'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { normalizeVitalPathToRoute } from '@/lib/vitals-path';

type WebVitalPayload = {
  name: 'LCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  path: string;
  device: 'mobile' | 'desktop';
};

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const supported = ['LCP', 'CLS', 'INP', 'TTFB'] as const;
    if (!supported.includes(metric.name as (typeof supported)[number])) {
      return;
    }

    const payload: WebVitalPayload = {
      name: metric.name as WebVitalPayload['name'],
      value: metric.value,
      path: normalizeVitalPathToRoute(window.location.pathname),
      device: window.innerWidth < 640 ? 'mobile' : 'desktop'
    };

    navigator.sendBeacon('/api/vitals', JSON.stringify(payload));
  });

  return null;
}
