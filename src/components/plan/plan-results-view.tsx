'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
type TimelineEntry = {
  id: string;
  lane: 'cards' | 'banking';
  title: string;
  startDate: Date;
  completeDate: Date;
  payoutDate: Date;
};
const TIMELINE_DAYS = 365;

function formatValue(value: number) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString()}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function toTimelinePercent(planStart: Date, date: Date) {
  const day = diffDays(planStart, date);
  return Math.max(0, Math.min(100, (day / TIMELINE_DAYS) * 100));
}

function monthLabels(planStart: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const d = new Date(planStart);
    d.setMonth(d.getMonth() + index);
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  });
}

function scheduleLane(
  items: PlannerRecommendation[],
  planStart: Date,
  lane: 'cards' | 'banking'
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let cursor = new Date(planStart);

  for (const item of items) {
    const requirementDays = item.timelineDays ?? 90;
    const payoutLagDays = lane === 'cards' ? 30 : 21;
    const completeDate = addDays(cursor, requirementDays);
    const payoutDate = addDays(completeDate, payoutLagDays);

    entries.push({
      id: item.id,
      lane,
      title: item.title,
      startDate: new Date(cursor),
      completeDate,
      payoutDate
    });

    cursor = completeDate;
  }

  return entries;
}

function buildTimelineEntries(recommendations: PlannerRecommendation[], planStart: Date): TimelineEntry[] {
  const cards = recommendations.filter((item) => item.lane === 'cards');
  const banking = recommendations.filter((item) => item.lane === 'banking');
  return [...scheduleLane(cards, planStart, 'cards'), ...scheduleLane(banking, planStart, 'banking')].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

function toIcsDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildTimelineIcs(entries: TimelineEntry[]) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Stack//Bonus Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const entry of entries) {
    const milestones = [
      { label: 'Open account/card', date: entry.startDate },
      { label: 'Complete requirements', date: entry.completeDate },
      { label: 'Bonus expected', date: entry.payoutDate }
    ];

    for (const milestone of milestones) {
      const start = toIcsDate(milestone.date);
      const end = toIcsDate(addDays(milestone.date, 1));
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${escapeIcsText(`${entry.id}-${milestone.label}@thestackhq.com`)}`);
      lines.push(`DTSTAMP:${toIcsDate(new Date())}T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${escapeIcsText(`${milestone.label}: ${entry.title}`)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(`Lane: ${entry.lane}`)}`);
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadTimelineCalendar(entries: TimelineEntry[]) {
  if (entries.length === 0) return;
  const ics = buildTimelineIcs(entries);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'the-stack-bonus-plan.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
        Effort: {item.effort}
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
  onClear,
  cardsOnlyMode
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
  cardsOnlyMode: boolean;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const labels = useMemo(() => monthLabels(planStart), [planStart]);
  const prioritized = useMemo(
    () => rankPlannerRecommendationsByPriority(payload.recommendations),
    [payload.recommendations]
  );
  const scopedRecommendations = useMemo(
    () => (cardsOnlyMode ? prioritized.filter((item) => item.lane === 'cards') : prioritized),
    [cardsOnlyMode, prioritized]
  );
  const cardLane = scopedRecommendations.filter((item) => item.lane === 'cards');
  const bankingLane = scopedRecommendations.filter((item) => item.lane === 'banking');
  const cardExclusions = payload.exclusions.filter((item) => item.lane === 'cards');
  const bankingExclusions = cardsOnlyMode
    ? []
    : payload.exclusions.filter((item) => item.lane === 'banking');
  const totalValue = scopedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const cardValue = cardLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const bankingValue = bankingLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const doNow = cardsOnlyMode
    ? cardLane.slice(0, 2)
    : rankPlannerRecommendationsByPriority([
        ...(cardLane[0] ? [cardLane[0]] : []),
        ...(bankingLane[0] ? [bankingLane[0]] : [])
      ]);
  const doNext = cardsOnlyMode
    ? cardLane.slice(2)
    : rankPlannerRecommendationsByPriority([
        ...cardLane.slice(1),
        ...bankingLane.slice(1)
      ]);
  const timelineEntries = useMemo(
    () => buildTimelineEntries(scopedRecommendations, planStart),
    [scopedRecommendations, planStart]
  );

  return (
    <div>
      <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">12-Month Plan Value</p>
        <p className="mt-2 font-heading text-4xl text-text-primary">{formatValue(totalValue)}</p>
        <p className="mt-2 text-sm text-text-secondary">
          {cardsOnlyMode
            ? `Card bonuses: ${formatValue(cardValue)}`
            : `Card bonuses: ${formatValue(cardValue)} • Banking bonuses: ${formatValue(bankingValue)}`}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-2xl text-text-primary">Start Today</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Start earning your money now with these highest-priority actions.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-text-primary">Execution Timeline</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Follow this schedule to open each offer, finish requirements, and track expected payout windows.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => downloadTimelineCalendar(timelineEntries)}
            disabled={timelineEntries.length === 0}
          >
            Add to Calendar
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-bg-surface p-4">
          <div className="grid min-w-[640px] grid-cols-12 gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {labels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {timelineEntries.map((entry) => {
              const startPct = toTimelinePercent(planStart, entry.startDate);
              const completePct = toTimelinePercent(planStart, entry.completeDate);
              const payoutPct = toTimelinePercent(planStart, entry.payoutDate);
              const barWidth = Math.max(3, completePct - startPct);

              return (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-bg/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{entry.title}</p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-text-muted">
                      {entry.lane === 'cards' ? 'Card' : 'Banking'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Open by {formatShortDate(entry.startDate)} • Complete by {formatShortDate(entry.completeDate)} • Bonus expected {formatShortDate(entry.payoutDate)}
                  </p>
                  <div className="relative mt-3 h-3 rounded-full bg-bg-elevated">
                    <div
                      className={`absolute top-0 h-3 rounded-full ${entry.lane === 'cards' ? 'bg-brand-gold/70' : 'bg-brand-teal/70'}`}
                      style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                    />
                    <span
                      className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-brand-teal"
                      style={{ left: `${payoutPct}%`, transform: 'translate(-50%, -50%)' }}
                      aria-hidden
                    />
                  </div>
                </div>
              );
            })}
            {timelineEntries.length === 0 && (
              <p className="text-sm text-text-muted">No timeline items yet. Build recommendations first.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl text-text-primary">
          {cardsOnlyMode ? 'Card Bonus Track' : 'Lane Breakdown'}
        </h2>
        {cardsOnlyMode ? (
          <div className="mt-4 space-y-4">
            {cardLane.length === 0 ? (
              <EmptyLaneCard lane="cards" exclusions={cardExclusions} />
            ) : (
              cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
            )}
          </div>
        ) : (
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
        )}
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
        <Link href={cardsOnlyMode ? '/cards#card-plan' : '/tools/card-finder'}>
          <Button variant="ghost">
            {cardsOnlyMode ? 'Adjust Card Plan' : 'Adjust My Plan'}
          </Button>
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
  const searchParams = useSearchParams();
  const cardsOnlyMode = searchParams.get('mode') === 'cards_only';
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
        source: cardsOnlyMode
          ? 'cards_only_path'
          : loaded.status === 'fresh'
            ? loaded.source
            : 'local_recovery',
        path: '/plan/results',
        tool: cardsOnlyMode ? 'cards_only_path' : 'card_finder'
      });
    }
  }, [cardsOnlyMode]);

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
            ? cardsOnlyMode
              ? 'Your previous card-only plan expired. Build a fresh plan to get up-to-date recommendations.'
              : 'Your previous plan expired. Build a fresh plan to get up-to-date recommendations.'
            : cardsOnlyMode
              ? 'Build a plan first to view your personalized credit card bonus actions.'
              : 'Build a plan first to view your personalized card and banking bonus actions.'}
        </p>
        <div className="mt-6">
          <Link href={cardsOnlyMode ? '/cards#card-plan' : '/tools/card-finder'}>
            <Button>{cardsOnlyMode ? 'Build My Card-Only Plan' : 'Start My Bonus Plan'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <h1 className="font-heading text-4xl text-text-primary">
        {cardsOnlyMode ? 'Your 12-Month Card Plan' : 'Your 12-Month Bonus Plan'}
      </h1>
      <p className="mt-3 text-sm text-text-secondary">
        {cardsOnlyMode
          ? 'Credit card bonuses in one focused 12-month execution roadmap.'
          : 'Card bonuses and banking bonuses in one coordinated action plan.'}
      </p>
      {state.status === 'recovered' && (
        <p className="mt-3 text-sm text-brand-gold">
          Recovered your latest saved plan from this browser.
        </p>
      )}
      <PlanSummary
        payload={state.payload}
        onClear={handleClearPlan}
        cardsOnlyMode={cardsOnlyMode}
      />
    </div>
  );
}
