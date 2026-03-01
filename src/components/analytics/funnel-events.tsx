'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export type FunnelEventName =
  | 'landing_view'
  | 'tool_started'
  | 'quiz_completed'
  | 'card_detail_view'
  | 'newsletter_subscribed'
  | 'affiliate_click';

export type FunnelEventProperties = {
  source?: string;
  path?: string;
  card_slug?: string;
  tool?: string;
};

export function trackFunnelEvent(
  event: FunnelEventName,
  properties: FunnelEventProperties = {}
) {
  if (typeof window === 'undefined') return;

  try {
    if (!(posthog as { __loaded?: boolean }).__loaded) return;
    posthog.capture(event, {
      path: window.location.pathname,
      ...properties
    });
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
