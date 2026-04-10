'use client';

import { useCallback, useRef, useState } from 'react';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { getTurnstileSiteKey } from '@/lib/config/public';
import type {
  PremiumCardCalculation,
  PremiumCardProfile,
  PremiumCardScenario
} from '@/lib/premium-card-calculator';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_REQUIRED_MESSAGE =
  'Please complete the security check to email your calculator results.';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

type PremiumCardEmailPanelProps = {
  profile: PremiumCardProfile;
  scenario: PremiumCardScenario;
  result: PremiumCardCalculation;
};

export function PremiumCardEmailPanel({
  profile,
  scenario,
  result
}: PremiumCardEmailPanelProps) {
  const turnstileEnabled = Boolean(getTurnstileSiteKey());
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  function validateEmail(input: string) {
    return EMAIL_PATTERN.test(input.trim());
  }

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setStatus((current) => (current === 'error' ? 'idle' : current));
    setMessage((current) =>
      current === TURNSTILE_REQUIRED_MESSAGE ? '' : current
    );
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  async function handleSendEmail() {
    const normalizedEmail = email.trim();
    if (!validateEmail(normalizedEmail)) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setShowTurnstile(true);
      setStatus('error');
      setMessage(TURNSTILE_REQUIRED_MESSAGE);
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/email-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedEmail,
          profileId: profile.id,
          scenario,
          ...(turnstileToken ? { turnstileToken } : {})
        })
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
        setStatus('sent');
        setMessage(
          data.message ?? 'Your calculator results have been emailed. Check your inbox.'
        );
        setEmail('');
        return;
      }

      setStatus('error');
      setMessage(data.error ?? 'Could not send the calculator email right now.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not connect. Please try again.'
      );
    } finally {
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="mt-5 rounded-[1.35rem] border border-white/[0.09] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.1),rgba(255,255,255,0.03))] px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-center lg:gap-5">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-text-secondary">
            Take it with you
          </p>
          <h3 className="mt-1.5 text-xl font-semibold text-text-primary">
            Email This Calculator Snapshot
          </h3>
          <p className="mt-1.5 text-[15px] leading-6 text-text-secondary">
            Send your {profile.shortName} run to yourself, including the modeled
            inputs and the current {formatCurrency(result.expectedValueYear1)} year-one estimate.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              value={email}
              autoFocus
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== 'idle') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-white/[0.12] bg-bg-surface px-5 py-4 text-base text-text-primary placeholder:text-text-muted transition focus:border-[rgb(var(--card-accent-rgb))] focus:outline-none"
            />
            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={status === 'sending'}
              className="px-7 py-3.5 text-base"
            >
              {status === 'sending' ? 'Sending…' : 'Send to my inbox'}
            </Button>
          </div>
        </div>
      </div>

      {showTurnstile ? (
        <div className="mt-3">
          <Turnstile
            ref={turnstileRef}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
          />
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-3 text-sm ${
            status === 'error' ? 'text-brand-coral' : 'text-brand-teal'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
