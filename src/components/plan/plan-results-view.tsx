'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import {
  clearPlanResults,
  loadPlanResults,
  type PlanResultsLoadResult,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import {
  rankPlannerRecommendationsByPriority,
  type PlannerRecommendation,
  type PlannerExcludedOffer,
  type PlannerExclusionReason
} from '@/lib/planner-recommendations';

type LoadState = { status: 'loading' } | PlanResultsLoadResult;

function formatValue(value: number) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString()}`;
}

const exclusionActions: Record<PlannerExclusionReason, string> = {
  no_signup_bonus: 'Focus on offers with active welcome bonuses only.',
  fee_preference: 'Loosen your annual-fee preference to see more high-upside card options.',
  credit_tier: 'Raise approval odds first with utilization and on-time payment improvements.',
  direct_deposit_required: 'Routing payroll direct deposit unlocks most checking bonuses.',
  state_restricted: 'Some bank bonuses are limited by state eligibility rules.',
  opening_deposit_too_high: 'More opening cash unlocks larger savings and bundle bonuses.'
};

function RecommendationCard({ item }: { item: PlannerRecommendation }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{item.provider}</p>
      <h3 className="mt-2 text-lg font-semibold text-text-primary">{item.title}</h3>
      <p className="mt-2 text-sm text-text-secondary">
        Estimated net value: <span className="font-semibold text-brand-teal">{formatValue(item.estimatedNetValue)}</span>
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Fit score: {item.priorityScore} • Effort: {item.effort}
        {item.timelineDays ? ` • timeline: ${item.timelineDays} days` : ''}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
        {item.keyRequirements.slice(0, 3).map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
      <Link
        href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
        className="mt-4 inline-block text-sm font-semibold text-brand-teal transition hover:underline"
      >
        View details
      </Link>
    </article>
  );
}

function EmptyLaneCard({
  lane,
  exclusions
}: {
  lane: 'cards' | 'banking';
  exclusions: PlannerExcludedOffer[];
}) {
  const label = lane === 'cards' ? 'Card Bonuses' : 'Banking Bonuses';
  const fallback =
    lane === 'cards'
      ? 'Adjust fee and credit filters to unlock more card bonus paths.'
      : 'Adjust direct deposit, state, and opening cash filters to unlock more bank bonus paths.';
  const reasonActions = Array.from(
    new Set(
      exclusions.flatMap((offer) => offer.reasons.map((reason) => exclusionActions[reason]))
    )
  ).slice(0, 3);
  const unlockActions = reasonActions.length > 0 ? reasonActions : [fallback];

  return (
    <article className="rounded-2xl border border-dashed border-white/20 bg-bg-surface p-5">
      <h3 className="text-lg font-semibold text-text-primary">{label}: Not a fit right now</h3>
      <p className="mt-2 text-sm text-text-secondary">
        {exclusions.length > 0
          ? `${exclusions.length} offers were filtered out by your current inputs.`
          : 'No matching offers were found for this lane yet.'}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
        {unlockActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </article>
  );
}

function PlanSummary({
  payload,
  onClear
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
}) {
  const prioritized = useMemo(
    () => rankPlannerRecommendationsByPriority(payload.recommendations),
    [payload.recommendations]
  );
  const cardLane = prioritized.filter((item) => item.lane === 'cards');
  const bankingLane = prioritized.filter((item) => item.lane === 'banking');
  const cardExclusions = payload.exclusions.filter((item) => item.lane === 'cards');
  const bankingExclusions = payload.exclusions.filter((item) => item.lane === 'banking');
  const totalValue = prioritized.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const doNow = rankPlannerRecommendationsByPriority([
    ...(cardLane[0] ? [cardLane[0]] : []),
    ...(bankingLane[0] ? [bankingLane[0]] : [])
  ]);
  const doNext = rankPlannerRecommendationsByPriority([
    ...cardLane.slice(1),
    ...bankingLane.slice(1)
  ]);

  return (
    <div>
      <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">12-Month Plan Value</p>
        <p className="mt-2 font-heading text-4xl text-text-primary">{formatValue(totalValue)}</p>
        <p className="mt-2 text-sm text-text-secondary">
          Card bonuses: {formatValue(cardLane.reduce((sum, item) => sum + item.estimatedNetValue, 0))} • Banking bonuses:{' '}
          {formatValue(bankingLane.reduce((sum, item) => sum + item.estimatedNetValue, 0))}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-2xl text-text-primary">Do Now</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Start with these highest-priority actions to capture value quickly.
        </p>
        <div className={`mt-4 grid gap-4 ${doNow.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {doNow.length > 0 ? (
            doNow.map((item) => <RecommendationCard key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-text-muted">No do-now recommendations are available yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl text-text-primary">Lane Breakdown</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Card Bonus Track</h3>
            {cardLane.length === 0 ? (
              <EmptyLaneCard lane="cards" exclusions={cardExclusions} />
            ) : (
              cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Bank Bonus Track</h3>
            {bankingLane.length === 0 ? (
              <EmptyLaneCard lane="banking" exclusions={bankingExclusions} />
            ) : (
              bankingLane.map((item) => <RecommendationCard key={item.id} item={item} />)
            )}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl text-text-primary">Do Next</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Queue these after you complete the do-now steps and timeline requirements.
        </p>
        <div className={`mt-4 grid gap-4 ${doNext.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {doNext.length > 0 ? (
            doNext.map((item) => <RecommendationCard key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-text-muted">No follow-up actions yet.</p>
          )}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/tools/card-finder">
          <Button variant="ghost">Adjust My Plan</Button>
        </Link>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          Clear Saved Plan
        </button>
      </div>
    </div>
  );
}

export function PlanResultsView() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function handleClearPlan() {
    clearPlanResults();
    setState({ status: 'missing' });
  }

  useEffect(() => {
    const loaded = loadPlanResults();
    setState(loaded);

    if (loaded.status === 'fresh' || loaded.status === 'recovered') {
      trackFunnelEvent('plan_results_view', {
        source: loaded.status === 'fresh' ? loaded.source : 'local_recovery',
        path: '/plan/results'
      });
    }
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8">
        <p className="text-sm text-text-secondary">Loading your plan…</p>
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'stale') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
        <h1 className="font-heading text-3xl text-text-primary">Your plan is not available</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
          {state.status === 'stale'
            ? 'Your previous plan expired. Build a fresh plan to get up-to-date recommendations.'
            : 'Build a plan first to view your personalized card and banking bonus actions.'}
        </p>
        <div className="mt-6">
          <Link href="/tools/card-finder">
            <Button>Build My Bonus Plan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <h1 className="font-heading text-4xl text-text-primary">Your 12-Month Bonus Plan</h1>
      <p className="mt-3 text-sm text-text-secondary">
        Card bonuses and banking bonuses in one coordinated action plan.
      </p>
      {state.status === 'recovered' && (
        <p className="mt-3 text-sm text-brand-gold">
          Recovered your latest saved plan from this browser.
        </p>
      )}
      <PlanSummary payload={state.payload} onClear={handleClearPlan} />
    </div>
  );
}
