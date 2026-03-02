'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Script from 'next/script';

/**
 * Client wrapper for Cloudflare Turnstile.
 *
 * Responsibilities:
 * - Lazily load the Turnstile script and explicitly render one widget.
 * - Emit token/expiration events back to the parent form.
 * - Expose `reset()` via ref because tokens are single-use and must be refreshed after submit.
 * - No-op in environments where the site key is intentionally unset.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileHandle = {
  reset: () => void;
};

type TurnstileProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify, onExpire }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire });
    callbacksRef.current = { onVerify, onExpire };

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Parent form calls this after submit attempts to force a fresh token.
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    }));

    function tryRender() {
      if (
        !containerRef.current ||
        !window.turnstile ||
        !siteKey ||
        widgetIdRef.current
      )
        return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => callbacksRef.current.onVerify(token),
        'expired-callback': () => callbacksRef.current.onExpire?.(),
        theme: 'dark',
        size: 'compact'
      });
    }

    useEffect(() => {
      // Remove the widget on unmount to avoid leaking DOM/event handlers.
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, []);

    // Local dev may intentionally omit the key; suppress UI in that case.
    if (!siteKey) return null;

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={tryRender}
        />
        <div ref={containerRef} />
      </>
    );
  }
);
