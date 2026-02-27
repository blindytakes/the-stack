'use client';

import { useReportWebVitals } from 'next/web-vitals';

type WebVitalPayload = {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  path: string;
  device: 'mobile' | 'desktop';
};

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const supported = ['LCP', 'FID', 'CLS', 'INP', 'TTFB'] as const;
    if (!supported.includes(metric.name as (typeof supported)[number])) {
      return;
    }

    const payload: WebVitalPayload = {
      name: metric.name as WebVitalPayload['name'],
      value: metric.value,
      path: window.location.pathname,
      device: window.innerWidth < 640 ? 'mobile' : 'desktop'
    };

    navigator.sendBeacon('/api/vitals', JSON.stringify(payload));
  });

  return null;
}
