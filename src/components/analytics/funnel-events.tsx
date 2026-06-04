'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export type FunnelEventName =
  | 'landing_view'
  | 'tool_started'
  | 'quiz_completed'
  | 'plan_results_view'
  | 'card_detail_view'
  | 'banking_detail_view'
  | 'points_advisor_recommendation_view'
  | 'newsletter_subscribed'
  | 'affiliate_click';

export type FunnelEventProperties = {
  source?: string;
  path?: string;
  card_slug?: string;
  bank_slug?: string;
  tool?: string;
  program?: string;
  goal?: string;
  recommendation?: string;
};

const FUNNEL_EVENT_ENDPOINT = '/api/funnel/events';

function emitGrafanaFunnelEvent(event: FunnelEventName, properties: FunnelEventProperties) {
  const payload = JSON.stringify({
    event,
    properties
  });

  try {
    if ('sendBeacon' in navigator) {
      const body = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(FUNNEL_EVENT_ENDPOINT, body);
      return;
    }

    void fetch(FUNNEL_EVENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload,
      keepalive: true
    }).catch((error) => {
      console.warn('[analytics] grafana funnel event failed', {
        event,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  } catch (error) {
    console.warn('[analytics] grafana funnel event failed', {
      event,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export function trackFunnelEvent(
  event: FunnelEventName,
  properties: FunnelEventProperties = {}
) {
  if (typeof window === 'undefined') return;

  const eventProperties = {
    path: window.location.pathname,
    ...properties
  };

  emitGrafanaFunnelEvent(event, eventProperties);

  try {
    if ((posthog as { __loaded?: boolean }).__loaded) {
      posthog.capture(event, eventProperties);
    }
  } catch (error) {
    console.warn('[analytics] posthog capture failed', {
      event,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export function TrackFunnelEventOnView({
  event,
  properties
}: {
  event: FunnelEventName;
  properties?: FunnelEventProperties;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackFunnelEvent(event, properties);
  }, [event, properties]);

  return null;
}
