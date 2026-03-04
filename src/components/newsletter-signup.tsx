'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { getTurnstileSiteKey } from '@/lib/config/public';

/**
 * Newsletter signup form UI.
 *
 * Flow:
 * - Collect email + source metadata.
 * - Collect Turnstile token when challenge UI is shown.
 * - POST to `/api/newsletter/subscribe`.
 * - Reset Turnstile in `finally` so each submit uses a fresh token.
 */

type NewsletterSignupProps = {
  source?: string;
  heading?: string;
  description?: string;
  compact?: boolean;
};

const TURNSTILE_REQUIRED_MESSAGE = 'Please complete the security check to subscribe.';

export function NewsletterSignup({
  source = 'homepage',
  heading = 'Stay in the loop',
  description = 'Get weekly bonus plays, APY opportunities, and fee-avoidance strategy.',
  compact = false
}: NewsletterSignupProps) {
  const turnstileEnabled = Boolean(getTurnstileSiteKey());
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(() => !compact && turnstileEnabled);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setStatus((current) => (current === 'error' ? 'idle' : current));
    setMessage((current) => (current === TURNSTILE_REQUIRED_MESSAGE ? '' : current));
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (turnstileEnabled && !turnstileToken) {
      setShowTurnstile(true);
      setStatus('error');
      setMessage(TURNSTILE_REQUIRED_MESSAGE);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          ...(turnstileToken ? { turnstileToken } : {})
        })
      });

      let data: { error?: string; message?: string };
      try {
        data = await res.json();
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(data.message ?? 'Successfully subscribed!');
      trackFunnelEvent('newsletter_subscribed', { source });
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Could not connect. Please try again.');
    } finally {
      // Turnstile tokens are single-use — reset the widget so retries
      // get a fresh token instead of resubmitting a consumed one.
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }

  if (status === 'success') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm text-brand-teal">{message}</p>
      </motion.div>
    );
  }

  return (
    <div>
      {!compact && (
        <>
          <h3 className="font-heading text-2xl text-text-primary">{heading}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </>
      )}
      <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? '' : 'mt-4'}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => {
            if (compact && turnstileEnabled) {
              setShowTurnstile(true);
            }
          }}
          placeholder="Enter your email"
          required
          className="flex-1 rounded-full border border-white/10 bg-bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Subscribe'}
        </Button>
      </form>
      {showTurnstile && (
        <div className="mt-3">
          <Turnstile
            ref={turnstileRef}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
          />
        </div>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-brand-coral">{message}</p>
      )}
    </div>
  );
}
