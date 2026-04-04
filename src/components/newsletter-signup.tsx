'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { getTurnstileSiteKey } from '@/lib/config/public';
import type { TrackedSource } from '@/lib/tracking';

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
  source?: TrackedSource;
  eyebrow?: string;
  heading?: string;
  description?: string;
  compact?: boolean;
  size?: 'default' | 'large';
  valueBullets?: string[];
  showConsultationOption?: boolean;
  consultationLabel?: string;
  consultationSource?: TrackedSource;
  finePrint?: string;
  submitLabel?: string;
};

const TURNSTILE_REQUIRED_MESSAGE = 'Please complete the security check to subscribe.';

export function NewsletterSignup({
  source = 'homepage',
  eyebrow,
  heading = 'Get Bonus Plays',
  description = 'Bonus offers, timing tips, and free tools. Curated, not sponsored.',
  compact = false,
  size = 'default',
  valueBullets = [],
  showConsultationOption = false,
  consultationLabel = "I'm interested in a 1:1 strategy consultation",
  consultationSource,
  finePrint,
  submitLabel = 'Subscribe'
}: NewsletterSignupProps) {
  const turnstileEnabled = Boolean(getTurnstileSiteKey());
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'warning' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState('');
  const [consultationInterest, setConsultationInterest] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const largeSize = size === 'large';
  const formClassName = compact
    ? `flex w-full flex-col gap-3 sm:flex-row sm:items-center ${largeSize ? 'sm:gap-4' : ''}`
    : 'mt-4 flex flex-col gap-3 sm:flex-row sm:items-center';
  const inputClassName = `min-w-0 w-full flex-1 border border-white/10 bg-bg-surface text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none ${
    largeSize ? 'rounded-full px-5 py-3.5 text-sm md:text-base' : 'rounded-full px-4 py-2 text-sm'
  }`;
  const buttonClassName = `${compact ? 'w-full sm:w-auto' : 'sm:self-start'} shrink-0 whitespace-nowrap ${
    largeSize ? 'px-6 py-3.5 text-sm md:text-base' : ''
  }`;

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
    const submitSource =
      showConsultationOption && consultationInterest && consultationSource
        ? consultationSource
        : source;

    if (turnstileEnabled && !turnstileToken) {
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
          source: submitSource,
          ...(turnstileToken ? { turnstileToken } : {})
        })
      });

      let data: { error?: string; message?: string; warning?: string };
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

      if (data.warning) {
        setStatus('warning');
        setMessage(data.warning);
        return;
      }

      setStatus('success');
      setMessage(data.message ?? 'Successfully subscribed!');
      trackFunnelEvent('newsletter_subscribed', { source: submitSource });
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
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">{eyebrow}</p>
          )}
          <h3 className="font-heading text-2xl text-text-primary">{heading}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
          {valueBullets.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {valueBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </>
      )}
      <form
        onSubmit={handleSubmit}
        className={formClassName}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className={inputClassName}
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          className={buttonClassName}
        >
          {status === 'loading' ? 'Joining...' : submitLabel}
        </Button>
      </form>
      {showConsultationOption && !compact && (
        <label className="mt-3 flex items-start gap-2 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={consultationInterest}
            onChange={(e) => setConsultationInterest(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-bg-surface text-brand-teal focus:ring-brand-teal"
          />
          <span>{consultationLabel}</span>
        </label>
      )}
      {finePrint && !compact && (
        <p className="mt-3 text-xs text-text-muted">{finePrint}</p>
      )}
      {turnstileEnabled && (
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
      {status === 'warning' && (
        <p className="mt-2 text-sm text-brand-gold">{message}</p>
      )}
    </div>
  );
}
