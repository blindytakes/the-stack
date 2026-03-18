'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  buildScheduledTimelineEntries,
  buildTimelineEntriesFallback,
  buildTimelineMilestones,
  downloadTimelineCalendar,
  formatShortDate,
  formatValue,
  diffDays,
  type TimelineEntry
} from '@/components/plan/plan-results-utils';
import { PlanEmailPanel } from '@/components/plan/plan-email-panel';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';

import {
  clearPlanResults,
  loadPlanResults,
  type PlanResultsLoadResult,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import { getDemoPlanPayload } from '@/lib/plan-demo-fixture';
import {
  rankPlannerRecommendationsByPriority,
  type PlannerRecommendation
} from '@/lib/planner-recommendations';

type LoadState = { status: 'loading' } | PlanResultsLoadResult;

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* ─────────────────────────────────────────────────────────
 * Helper: plain-english "what to do" for any recommendation
 * ───────────────────────────────────────────────────────── */

function whatToDoText(item: PlannerRecommendation): string {
  if (item.kind === 'card_bonus') {
    const spend = item.scheduleConstraints.requiredSpend;
    const days = item.scheduleConstraints.activeDays;
    const months = days ? Math.round(days / 30) : 3;
    if (spend) {
      return `Apply → spend $${spend.toLocaleString()} in ${months} month${months === 1 ? '' : 's'} → earn your bonus`;
    }
    return `Apply → meet the spending requirement → earn your bonus`;
  }

  // Bank bonus
  const deposit = item.scheduleConstraints.requiredDeposit;
  const days = item.scheduleConstraints.activeDays;
  const months = days ? Math.round(days / 30) : 3;
  const needsDD = item.scheduleConstraints.requiresDirectDeposit;

  if (deposit && needsDD) {
    return `Open account → deposit $${deposit.toLocaleString()} → set up direct deposit → keep funds for ${months} month${months === 1 ? '' : 's'}`;
  }
  if (deposit) {
    return `Open account → deposit $${deposit.toLocaleString()} → keep funds for ${months} month${months === 1 ? '' : 's'}`;
  }
  if (needsDD) {
    return `Open account → set up direct deposit → meet requirements`;
  }
  return `Open account → meet the bonus requirements`;
}

function monthlySpendText(item: PlannerRecommendation): string | null {
  if (item.kind !== 'card_bonus') return null;
  const spend = item.scheduleConstraints.requiredSpend;
  const days = item.scheduleConstraints.activeDays;
  if (!spend || !days) return null;
  const months = Math.max(1, Math.round(days / 30));
  const monthly = Math.round(spend / months);
  return `$${monthly.toLocaleString()}/mo`;
}

/* ─────────────────────────────────────────────────────────
 * Mini timeline — compact Gantt overview
 * ───────────────────────────────────────────────────────── */

function MiniTimeline({
  entries,
  recommendations
}: {
  entries: TimelineEntry[];
  recommendations: PlannerRecommendation[];
}) {
  // Find the full date range across all entries
  const earliest = entries.reduce(
    (min, e) => (e.startDate < min ? e.startDate : min),
    entries[0].startDate
  );
  const latest = entries.reduce(
    (max, e) => (e.payoutDate > max ? e.payoutDate : max),
    entries[0].payoutDate
  );
  const totalDays = Math.max(1, diffDays(earliest, latest));

  // Build month labels along the axis
  const monthLabels: { label: string; left: number }[] = [];
  const cursor = new Date(earliest);
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1); // start from next full month
  while (cursor <= latest) {
    const pct = (diffDays(earliest, cursor) / totalDays) * 100;
    monthLabels.push({
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(cursor),
      left: pct
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Map recommendation IDs to step numbers
  const stepNumbers = new Map(recommendations.map((r, i) => [r.id, i + 1]));
  const recommendationsById = new Map(recommendations.map((r) => [r.id, r]));

  return (
    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      {/* Month axis */}
      <div className="relative mb-3 h-4">
        {monthLabels.map((m) => (
          <span
            key={m.label}
            className="absolute text-[10px] uppercase tracking-[0.15em] text-text-muted"
            style={{ left: `${m.left}%`, transform: 'translateX(-50%)' }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {entries.map((entry) => {
          const startPct = (diffDays(earliest, entry.startDate) / totalDays) * 100;
          const widthPct = Math.max(2, (diffDays(entry.startDate, entry.completeDate) / totalDays) * 100);
          const rec = recommendationsById.get(entry.id);
          const step = stepNumbers.get(entry.id) ?? 0;
          const barColor = entry.lane === 'cards'
            ? 'bg-brand-gold/40'
            : 'bg-brand-teal/40';
          const dotColor = entry.lane === 'cards'
            ? 'bg-brand-gold'
            : 'bg-brand-teal';

          return (
            <div key={entry.id} className="relative flex items-center gap-3">
              {/* Step number */}
              <span className="w-4 shrink-0 text-right text-[10px] font-semibold text-text-muted">
                {step}
              </span>

              {/* Bar track */}
              <div className="relative h-3 flex-1 rounded-full bg-white/[0.03]">
                {/* Active period bar */}
                <div
                  className={`absolute top-0 h-3 rounded-full ${barColor}`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
                {/* Payout dot */}
                <span
                  className={`absolute top-1/2 h-2 w-2 rounded-full ${dotColor}`}
                  style={{
                    left: `${(diffDays(earliest, entry.payoutDate) / totalDays) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>

              {/* Short name */}
              <span className="hidden w-24 truncate text-[10px] text-text-muted sm:inline">
                {rec?.provider ?? ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Month grid lines */}
      <div className="relative mt-1 h-px">
        {monthLabels.map((m) => (
          <span
            key={`line-${m.label}`}
            className="absolute top-0 h-px w-px bg-white/10"
            style={{ left: `${m.left}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Step Card — one move in the plan
 * ───────────────────────────────────────────────────────── */

function StepCard({
  item,
  entry,
  stepNumber
}: {
  item: PlannerRecommendation;
  entry: TimelineEntry | undefined;
  stepNumber: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const breakdown = item.valueBreakdown;
  const headlineValue = breakdown?.headlineValue ?? item.estimatedNetValue;
  const netValue = item.estimatedNetValue;
  const fee = breakdown?.annualFee ?? breakdown?.estimatedFees ?? 0;
  const monthly = monthlySpendText(item);

  const laneColor = item.lane === 'cards' ? 'brand-gold' : 'brand-teal';
  const stepBg = item.lane === 'cards' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-brand-teal/15 text-brand-teal';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:bg-white/[0.04]">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${stepBg}`}>
          {stepNumber}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text-primary">{item.title}</p>
          <p className="text-sm text-text-muted">{item.provider}</p>
        </div>

        <span className="shrink-0 text-lg font-semibold text-text-primary">
          {formatValue(netValue)}
        </span>

        {entry ? (
          <span className="hidden shrink-0 text-sm text-text-muted sm:inline">
            {formatShortDate(entry.startDate)} – {formatShortDate(entry.completeDate)}
          </span>
        ) : null}

        <span
          className={`shrink-0 text-sm text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {/* Expanded detail */}
      {expanded ? (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
          {/* Value row */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                {breakdown?.headlineLabel ?? 'Bonus value'}
              </p>
              <p className="mt-1 font-heading text-4xl text-text-primary">
                {formatValue(headlineValue)}
              </p>
            </div>

            {fee > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  {item.kind === 'card_bonus' ? 'Annual fee' : 'Est. fees'}
                </p>
                <p className="mt-1 text-xl font-semibold text-brand-coral">
                  −{formatValue(fee)}
                </p>
              </div>
            ) : null}

            {headlineValue !== netValue ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net value</p>
                <p className={`mt-1 text-xl font-semibold text-${laneColor}`}>
                  {formatValue(netValue)}
                </p>
              </div>
            ) : null}

            {monthly ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Monthly spend</p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{monthly}</p>
              </div>
            ) : null}
          </div>

          {/* What to do */}
          <div className="mt-5 rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">What to do</p>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              {whatToDoText(item)}
            </p>
          </div>

          {/* Timeline dates */}
          {entry ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Start</p>
                <p className="mt-1 text-base font-semibold text-text-primary">
                  {formatShortDate(entry.startDate)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Deadline
                </p>
                <p className="mt-1 text-base font-semibold text-text-primary">
                  {formatShortDate(entry.completeDate)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Bonus expected
                </p>
                <p className="mt-1 text-base font-semibold text-text-primary">
                  {formatShortDate(entry.payoutDate)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Effort badge */}
          <div className="mt-4">
            <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
              {item.effort} effort
            </span>
          </div>

          {/* Detail link */}
          <Link
            href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
            className="mt-4 inline-flex items-center text-sm font-semibold text-brand-teal transition hover:underline"
          >
            View details →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Save & Act bar
 * ───────────────────────────────────────────────────────── */

function SaveActBar({
  recommendations,
  milestones,
  totalValue,
  cardsOnlyMode,
  timelineEntries,
  referenceDate
}: {
  recommendations: PlannerRecommendation[];
  milestones: ReturnType<typeof buildTimelineMilestones>;
  totalValue: number;
  cardsOnlyMode: boolean;
  timelineEntries: TimelineEntry[];
  referenceDate: Date;
}) {
  return (
    <section className="mt-10">
      <PlanEmailPanel
        recommendations={recommendations}
        milestones={milestones}
        totalValue={totalValue}
        cardsOnlyMode={cardsOnlyMode}
        referenceDate={referenceDate}
      />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => downloadTimelineCalendar(timelineEntries, recommendations)}
          disabled={timelineEntries.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          📅 Add to calendar
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Main plan summary — the 3-section layout
 * ───────────────────────────────────────────────────────── */

function PlanSummary({
  payload,
  onClear,
  cardsOnlyMode,
  isDemo
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
  cardsOnlyMode: boolean;
  isDemo: boolean;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const referenceDate = useMemo(() => new Date(), []);

  const prioritizedRecommendations = useMemo(
    () => rankPlannerRecommendationsByPriority(payload.recommendations),
    [payload.recommendations]
  );
  const scopedRecommendations = useMemo(
    () =>
      cardsOnlyMode
        ? prioritizedRecommendations.filter((item) => item.lane === 'cards')
        : prioritizedRecommendations,
    [cardsOnlyMode, prioritizedRecommendations]
  );
  const timelineEntries = useMemo(
    () =>
      payload.schedule.length > 0
        ? buildScheduledTimelineEntries(scopedRecommendations, payload.schedule)
        : buildTimelineEntriesFallback(scopedRecommendations, planStart),
    [payload.schedule, planStart, scopedRecommendations]
  );
  const orderedRecommendations = useMemo(() => {
    if (timelineEntries.length === 0) return scopedRecommendations;
    const recommendationsById = new Map(scopedRecommendations.map((item) => [item.id, item]));
    const scheduled = timelineEntries
      .map((entry) => recommendationsById.get(entry.id))
      .filter((item): item is PlannerRecommendation => Boolean(item));
    const scheduledIds = new Set(scheduled.map((item) => item.id));
    const unscheduled = scopedRecommendations.filter((item) => !scheduledIds.has(item.id));
    return [...scheduled, ...unscheduled];
  }, [scopedRecommendations, timelineEntries]);

  const totalValue = orderedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const moveCount = orderedRecommendations.length;

  const cardCount = orderedRecommendations.filter((item) => item.lane === 'cards').length;
  const bankCount = orderedRecommendations.filter((item) => item.lane === 'banking').length;

  const milestones = useMemo(() => buildTimelineMilestones(timelineEntries), [timelineEntries]);

  // Build subtitle
  const parts: string[] = [];
  if (cardCount > 0) parts.push(`${cardCount} card bonus${cardCount === 1 ? '' : 'es'}`);
  if (bankCount > 0) parts.push(`${bankCount} bank bonus${bankCount === 1 ? '' : 'es'}`);

  // Calculate duration from timeline
  let durationText = '6 months';
  if (timelineEntries.length > 0) {
    const firstStart = timelineEntries[0].startDate;
    const lastPayout = timelineEntries.reduce(
      (latest, e) => (e.payoutDate > latest ? e.payoutDate : latest),
      timelineEntries[0].payoutDate
    );
    const totalDays = diffDays(firstStart, lastPayout);
    const months = Math.max(1, Math.round(totalDays / 30));
    durationText = `${months} month${months === 1 ? '' : 's'}`;
  }

  const entriesById = useMemo(
    () => new Map(timelineEntries.map((entry) => [entry.id, entry])),
    [timelineEntries]
  );

  const animatedTotal = useCountUp(totalValue);

  return (
    <div>
      {/* ── ① Hero ── */}
      <motion.section
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {isDemo ? (
          <span className="mb-4 inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-teal">
            Demo fixture
          </span>
        ) : null}

        <p className="font-heading text-6xl text-text-primary md:text-7xl">
          {formatValue(animatedTotal)}
        </p>
        <motion.p
          className="mt-3 text-lg text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {parts.join(' + ')} · {durationText}
        </motion.p>

        {!isDemo ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 text-sm text-text-muted transition hover:text-text-secondary"
          >
            Clear plan
          </button>
        ) : null}
      </motion.section>

      {/* ── ② Mini timeline + Step cards ── */}
      <section className="mt-10">
        <motion.p
          className="text-xs uppercase tracking-[0.22em] text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
        >
          Your plan · {moveCount} move{moveCount === 1 ? '' : 's'}
        </motion.p>

        {/* Mini Gantt overview */}
        {timelineEntries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <MiniTimeline
              entries={timelineEntries}
              recommendations={orderedRecommendations}
            />
          </motion.div>
        ) : null}

        <div className="mt-4 space-y-3">
          {orderedRecommendations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.12, duration: 0.4, ease: 'easeOut' }}
            >
              <StepCard
                item={item}
                entry={entriesById.get(item.id)}
                stepNumber={index + 1}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ③ Save & Act ── */}
      <SaveActBar
        recommendations={orderedRecommendations}
        milestones={milestones}
        totalValue={totalValue}
        cardsOnlyMode={cardsOnlyMode}
        timelineEntries={timelineEntries}
        referenceDate={referenceDate}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Page-level wrapper (loading / missing / results)
 * ───────────────────────────────────────────────────────── */

export function PlanResultsView() {
  const searchParams = useSearchParams();
  const cardsOnlyMode = searchParams.get('mode') === 'cards_only';
  const demoMode = searchParams.get('demo') === 'true';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function handleClearPlan() {
    clearPlanResults();
    setState({ status: 'missing' });
  }

  useEffect(() => {
    if (demoMode) {
      setState({
        status: 'fresh',
        payload: getDemoPlanPayload({ cardsOnlyMode }),
        source: 'session'
      });
      return;
    }

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
  }, [cardsOnlyMode, demoMode]);

  if (state.status === 'loading') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8">
        <p className="text-base text-text-secondary">Loading your plan…</p>
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'stale') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
        <h1 className="font-heading text-4xl text-text-primary">Your plan is not available</h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-text-secondary">
          {state.status === 'stale'
            ? cardsOnlyMode
              ? 'Your previous card-only plan expired. Build a fresh plan to get up-to-date recommendations.'
              : 'Your previous plan expired. Build a fresh plan to get up-to-date recommendations.'
            : cardsOnlyMode
              ? 'Build a plan first to view your personalized credit card bonus actions.'
              : 'Build a plan first to view your personalized card and banking bonus actions.'}
        </p>
        <div className="mt-6">
          <Link href={cardsOnlyMode ? '/cards/plan' : '/tools/card-finder?mode=full'}>
            <Button>{cardsOnlyMode ? 'Build My Card-Only Plan' : 'Start My Bonus Plan'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <h1 className="font-heading text-5xl text-text-primary md:text-6xl">
        {cardsOnlyMode ? 'Your Card Plan' : 'Your Bonus Plan'}
      </h1>
      {state.status === 'recovered' && (
        <p className="mt-3 text-base text-brand-gold">
          Recovered your latest saved plan from this browser.
        </p>
      )}
      <PlanSummary
        payload={state.payload}
        onClear={handleClearPlan}
        cardsOnlyMode={cardsOnlyMode}
        isDemo={demoMode}
      />
    </div>
  );
}
