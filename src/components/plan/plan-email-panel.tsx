'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TimelineMilestone } from '@/components/plan/plan-results-utils';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { getTurnstileSiteKey } from '@/lib/config/public';
import {
  buildReferenceDateKey,
  type PlanSnapshotData
} from '@/lib/plan-email';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanEmailPanelProps = {
  recommendations: PlannerRecommendation[];
  milestones: TimelineMilestone[];
  totalValue: number;
  cardsOnlyMode: boolean;
  referenceDate: Date;
  secondaryAction?: ReactNode;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_REQUIRED_MESSAGE = 'Please complete the security check to send your plan.';

export function PlanEmailPanel({
  recommendations,
  milestones,
  totalValue,
  cardsOnlyMode,
  referenceDate,
  secondaryAction
}: PlanEmailPanelProps) {
  const turnstileEnabled = Boolean(getTurnstileSiteKey());
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const planSnapshot = useMemo<PlanSnapshotData>(
    () => ({
      totalValue,
      cardsOnlyMode,
      recommendations: recommendations.slice(0, 12).map((recommendation) => ({
        lane: recommendation.lane,
        provider: recommendation.provider,
        title: recommendation.title,
        estimatedNetValue: recommendation.estimatedNetValue,
        effort: recommendation.effort,
        detailPath: recommendation.detailPath,
        keyRequirements: recommendation.keyRequirements.slice(0, 2),
        valueBreakdown: recommendation.valueBreakdown
          ? { annualFee: recommendation.valueBreakdown.annualFee }
          : undefined,
        scheduleConstraints: {
          requiredDeposit: recommendation.scheduleConstraints.requiredDeposit,
          requiresDirectDeposit:
            recommendation.scheduleConstraints.requiresDirectDeposit
        }
      })),
      milestones: milestones.slice(0, 60).map((milestone) => ({
        label: milestone.label,
        title: milestone.title,
        date: milestone.date,
        dateKey: buildReferenceDateKey(milestone.date)
      }))
    }),
    [cardsOnlyMode, milestones, recommendations, totalValue]
  );

  useEffect(() => {
    setPlanId(null);
  }, [planSnapshot]);

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

  async function ensureSavedPlanId(): Promise<string> {
    if (planId) return planId;

    const response = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planSnapshot)
    });

    let data: { error?: string; planId?: string } = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok || !data.planId) {
      throw new Error(data.error ?? 'Could not save the plan right now.');
    }

    setPlanId(data.planId);
    return data.planId;
  }

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
      const savedPlanId = await ensureSavedPlanId();
      const response = await fetch('/api/email-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedEmail,
          planId: savedPlanId,
          referenceDateKey: buildReferenceDateKey(referenceDate),
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
        setMessage(data.message ?? 'Your plan has been emailed. Check your inbox.');
        setEmail('');
        return;
      }

      setStatus('error');
      setMessage(data.error ?? 'Could not send the plan email right now.');
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
    <div className="mt-4 rounded-[1.45rem] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(45,212,191,0.07),rgba(255,255,255,0.025))] px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(500px,680px)] lg:items-center lg:gap-5">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-text-secondary">Take it with you</p>
          <h3 className="mt-1.5 text-xl font-semibold text-text-primary">Send This Plan to Your Inbox</h3>
          <p className="mt-1.5 text-[15px] leading-6 text-text-secondary">
            Get your steps, timing, and value summary in one email.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              className="min-w-0 flex-1 rounded-full border border-white/[0.12] bg-bg-surface px-5 py-4 text-base text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={recommendations.length === 0 || status === 'sending'}
                className="px-7 py-3.5 text-base"
              >
                {status === 'sending' ? 'Sending…' : 'Send to my inbox'}
              </Button>
              {secondaryAction ? <div className="shrink-0">{secondaryAction}</div> : null}
            </div>
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
        <p className={`mt-3 text-sm ${status === 'error' ? 'text-brand-coral' : 'text-brand-teal'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
