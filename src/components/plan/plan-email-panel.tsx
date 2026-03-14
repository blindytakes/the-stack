'use client';

import { useMemo, useState } from 'react';
import {
  buildPlanEmailBody,
  buildPlanEmailSubject,
  type TimelineMilestone
} from '@/components/plan/plan-results-utils';
import { Button } from '@/components/ui/button';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanEmailPanelProps = {
  recommendations: PlannerRecommendation[];
  milestones: TimelineMilestone[];
  totalValue: number;
  cardsOnlyMode: boolean;
  referenceDate: Date;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PlanEmailPanel({
  recommendations,
  milestones,
  totalValue,
  cardsOnlyMode,
  referenceDate
}: PlanEmailPanelProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'fallback' | 'copied' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const draft = useMemo(
    () => ({
      subject: buildPlanEmailSubject(totalValue, cardsOnlyMode),
      body: buildPlanEmailBody({
        totalValue,
        cardsOnlyMode,
        recommendations,
        milestones,
        referenceDate
      })
    }),
    [cardsOnlyMode, milestones, recommendations, referenceDate, totalValue]
  );

  function validateEmail(input: string) {
    return EMAIL_PATTERN.test(input.trim());
  }

  async function handleSendEmail() {
    const normalizedEmail = email.trim();
    if (!validateEmail(normalizedEmail)) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/email-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedEmail,
          subject: draft.subject,
          body: draft.body
        })
      });

      if (response.ok) {
        setStatus('sent');
        setMessage('Your plan has been emailed. Check your inbox.');
        return;
      }

      // If the API isn't configured (503) or fails, fall back to mailto
      openMailtoDraft(normalizedEmail);
    } catch {
      // Network error — fall back to mailto
      openMailtoDraft(normalizedEmail);
    }
  }

  function openMailtoDraft(normalizedEmail: string) {
    window.location.href = `mailto:${normalizedEmail}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    setStatus('fallback');
    setMessage('Opened a prefilled draft in your email app instead.');
  }

  async function handleCopySummary() {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      setStatus('copied');
      setMessage('Copied the email summary to your clipboard.');
    } catch {
      setStatus('error');
      setMessage('Could not copy the email summary right now.');
    }
  }

  return (
    <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),rgba(255,255,255,0.03))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Take it with you</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">Email this plan to yourself</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Get the 6-month estimate, next actions, and move stack delivered straight to your inbox.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg/35 px-4 py-3 text-sm text-text-secondary">
          Includes:
          <div className="mt-1 text-text-primary">Estimate, next actions, top moves</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== 'idle') {
              setStatus('idle');
              setMessage('');
            }
          }}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-white/10 bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
        />
        <Button
          type="button"
          onClick={handleSendEmail}
          disabled={recommendations.length === 0 || status === 'sending'}
        >
          {status === 'sending' ? 'Sending…' : 'Send to my inbox'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleCopySummary}
          disabled={recommendations.length === 0}
        >
          Copy summary
        </Button>
      </div>

      {message ? (
        <p className={`mt-3 text-sm ${status === 'error' ? 'text-brand-coral' : 'text-brand-teal'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
