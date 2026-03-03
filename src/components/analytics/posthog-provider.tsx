'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Initializes PostHog on the client side using the standard singleton pattern.
 * Reads NEXT_PUBLIC_* env vars that Next.js inlines at build time.
 *
 * Renders children immediately — PostHog init is a side-effect, not blocking.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

    if (!key || !host) return;
    if ((posthog as { __loaded?: boolean }).__loaded) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie'
    });
  }, []);

  return <>{children}</>;
}
