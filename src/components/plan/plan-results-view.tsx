'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { type EligibilityDraft } from '@/components/plan/plan-results-config';
import {
  buildScheduledTimelineEntries,
  buildTimelineEntriesFallback,
  buildTimelineMilestones,
  buildTimelineMonthBuckets,
  downloadTimelineCalendar,
  formatValue
} from '@/components/plan/plan-results-utils';
import { PlanNextMove } from '@/components/plan/plan-next-move';
import { PlanSequenceList } from '@/components/plan/plan-sequence-list';
import { PlanCompactTimeline } from '@/components/plan/plan-compact-timeline';
import { ResultsEligibilityEditor } from '@/components/plan/results-eligibility-editor';
import { SummaryStatCard } from '@/components/plan/summary-stat-card';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { submitPlanQuiz } from '@/lib/plan-client';
import { useCardsDirectory } from '@/lib/cards-client';
import {
  clearPlanResults,
  loadPlanResults,
  type PlanResultsLoadResult,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import { getDemoPlanPayload } from '@/lib/plan-demo-fixture';
import { quizRequestSchema } from '@/lib/quiz-engine';
import {
  rankPlannerRecommendationsByPriority,
  type PlannerRecommendation
} from '@/lib/planner-recommendations';

type LoadState = { status: 'loading' } | PlanResultsLoadResult;

function PlanSummary({
  payload,
  onClear,
  cardsOnlyMode,
  onUpdateEligibility,
  isDemo
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
  cardsOnlyMode: boolean;
  onUpdateEligibility: (draft: EligibilityDraft) => Promise<string | null>;
  isDemo: boolean;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const { cards: availableCards, loading: cardsLoading, error: cardsError } = useCardsDirectory(100);
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

  const cardLane = orderedRecommendations.filter((item) => item.lane === 'cards');
  const bankingLane = orderedRecommendations.filter((item) => item.lane === 'banking');
  const totalValue = orderedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const cardValue = cardLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const bankValue = bankingLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);

  const milestones = useMemo(() => buildTimelineMilestones(timelineEntries), [timelineEntries]);
  const monthBuckets = useMemo(
    () => buildTimelineMonthBuckets(milestones, planStart),
    [milestones, planStart]
  );
  const activeMonthCount = monthBuckets.filter((bucket) => bucket.items.length > 0).length;

  const firstRecommendation = orderedRecommendations[0] ?? null;
  const firstTimelineEntry = firstRecommendation
    ? timelineEntries.find((entry) => entry.id === firstRecommendation.id) ?? null
    : null;

  return (
    <div>
      {/* ── Hero summary stats ── */}
      <div className="mt-8 pb-6">
        {isDemo ? (
          <span className="mb-4 inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-teal">
            Demo fixture
          </span>
        ) : null}

        <div className={`grid gap-4 ${cardsOnlyMode ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
          <SummaryStatCard
            label="Total value"
            value={formatValue(totalValue)}
            description="Estimated across the next 12 months"
            tone="teal"
          />
          <SummaryStatCard
            label={`${cardLane.length} card move${cardLane.length === 1 ? '' : 's'}`}
            value={formatValue(cardValue)}
            description="Welcome bonuses and perks"
            tone="gold"
          />
          {!cardsOnlyMode ? (
            <SummaryStatCard
              label={`${bankingLane.length} bank move${bankingLane.length === 1 ? '' : 's'}`}
              value={formatValue(bankValue)}
              description="Cash bonuses from bank accounts"
              tone="teal"
            />
          ) : null}
          <SummaryStatCard
            label="Plan duration"
            value={`${activeMonthCount} mo`}
            description={`${orderedRecommendations.length} moves across ${activeMonthCount} active months`}
          />
        </div>

        {/* ── Utility buttons ── */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadTimelineCalendar(timelineEntries)}
            disabled={timelineEntries.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download .ics
          </button>
          <Link href={cardsOnlyMode ? '/cards/plan' : '/tools/card-finder?mode=full'}>
            <Button variant="ghost">
              {cardsOnlyMode ? 'Edit card intake' : 'Edit planner inputs'}
            </Button>
          </Link>
          {!isDemo ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
            >
              Clear plan
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Your next move (featured first recommendation) ── */}
      {firstRecommendation ? (
        <section className="mt-2">
          <PlanNextMove
            recommendation={firstRecommendation}
            timelineEntry={firstTimelineEntry}
          />
        </section>
      ) : null}

      {/* ── Full plan sequence ── */}
      {orderedRecommendations.length > 1 ? (
        <section className="mt-10">
          <PlanSequenceList
            orderedRecommendations={orderedRecommendations}
            timelineEntries={timelineEntries}
          />
        </section>
      ) : null}

      {/* ── Compact month-by-month timeline ── */}
      {monthBuckets.length > 0 ? (
        <section className="mt-10">
          <PlanCompactTimeline
            monthBuckets={monthBuckets}
            referenceDate={referenceDate}
          />
        </section>
      ) : null}

      {/* ── Eligibility controls ── */}
      <ResultsEligibilityEditor
        payload={payload}
        cards={availableCards}
        cardsLoading={cardsLoading}
        cardsError={cardsError}
        onUpdateEligibility={onUpdateEligibility}
      />
    </div>
  );
}

export function PlanResultsView() {
  const searchParams = useSearchParams();
  const cardsOnlyMode = searchParams.get('mode') === 'cards_only';
  const demoMode = searchParams.get('demo') === 'true';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function handleClearPlan() {
    clearPlanResults();
    setState({ status: 'missing' });
  }

  async function handleUpdateEligibility(draft: EligibilityDraft) {
    if (state.status !== 'fresh' && state.status !== 'recovered') {
      return 'Your saved plan is not available right now.';
    }

    const parsedAnswers = quizRequestSchema.safeParse({
      ...state.payload.answers,
      ...draft
    });
    if (!parsedAnswers.success) {
      return 'Could not update your plan inputs.';
    }

    try {
      const nextPayload = await submitPlanQuiz({
        answers: parsedAnswers.data,
        options: cardsOnlyMode
          ? {
              maxBanking: 0
            }
          : undefined
      });
      setState({
        status: 'fresh',
        payload: nextPayload,
        source: 'session'
      });

      return null;
    } catch {
      return 'Could not refresh your recommendations right now.';
    }
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
        {cardsOnlyMode ? 'Your 12-Month Card Plan' : 'Your 12-Month Bonus Plan'}
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
        onUpdateEligibility={handleUpdateEligibility}
        isDemo={demoMode}
      />
    </div>
  );
}
