'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyLaneCard } from '@/components/plan/empty-lane-card';
import { PlanExecutionBoard } from '@/components/plan/plan-execution-board';
import { type EligibilityDraft } from '@/components/plan/plan-results-config';
import {
  buildScheduledTimelineEntries,
  buildTimelineEntriesFallback,
  formatValue,
  monthLabels
} from '@/components/plan/plan-results-utils';
import { RecommendationCard } from '@/components/plan/recommendation-card';
import { ResultsEligibilityEditor } from '@/components/plan/results-eligibility-editor';
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
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const labels = useMemo(() => monthLabels(planStart), [planStart]);
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
  const cardExclusions = payload.exclusions.filter((item) => item.lane === 'cards');
  const bankingExclusions = cardsOnlyMode
    ? []
    : payload.exclusions.filter((item) => item.lane === 'banking');
  const timelineEntries = useMemo(
    () =>
      payload.schedule.length > 0
        ? buildScheduledTimelineEntries(scopedRecommendations, payload.schedule)
        : buildTimelineEntriesFallback(scopedRecommendations, planStart),
    [payload.schedule, planStart, scopedRecommendations]
  );
  const scopedRecommendationsById = useMemo(
    () => new Map(scopedRecommendations.map((item) => [item.id, item])),
    [scopedRecommendations]
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
  const ownedCardsCount = payload.answers.ownedCardSlugs.length;
  const amexLifetimeBlockedCount = payload.answers.amexLifetimeBlockedSlugs.length;
  const chase524Blocked = payload.answers.chase524Status === 'at_or_over_5_24';
  const summaryFacts = [
    {
      label: `${cardLane.length} card move${cardLane.length === 1 ? '' : 's'}`,
      tone: 'gold' as const
    },
    ...(!cardsOnlyMode
      ? [
          {
            label: `${bankingLane.length} bank move${bankingLane.length === 1 ? '' : 's'}`,
            tone: 'teal' as const
          }
        ]
      : []),
    {
      label: `${ownedCardsCount} current card${ownedCardsCount === 1 ? '' : 's'} excluded`,
      tone: 'neutral' as const
    }
  ];

  return (
    <div>
      <div className="pb-8">
        <div className="max-w-4xl">
          {isDemo ? (
            <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-teal">
              Demo fixture
            </span>
          ) : null}
          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className="font-heading text-5xl text-text-primary md:text-6xl">
              {formatValue(totalValue)}
            </p>
            <p className="max-w-md pb-2 text-sm text-text-secondary">
              Estimated total value across the next 12 months.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-text-secondary">
            {summaryFacts.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    item.tone === 'teal'
                      ? 'bg-brand-teal'
                      : item.tone === 'gold'
                        ? 'bg-brand-gold'
                        : 'bg-white/40'
                  }`}
                  aria-hidden
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <PlanExecutionBoard
        timelineEntries={timelineEntries}
        planStart={planStart}
        labels={labels}
        recommendations={orderedRecommendations}
        scopedRecommendationsById={scopedRecommendationsById}
        cardsOnlyMode={cardsOnlyMode}
        totalValue={totalValue}
      />

      <section className="mt-14 border-t border-white/[0.06] pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="font-heading text-2xl text-text-primary">
              {cardsOnlyMode ? 'Card Bonus Details' : 'Offer Details'}
            </h2>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              Keep the roadmap above for timing. Open the full detail cards only when you want the deeper value math and requirement breakdown.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setShowOfferDetails((current) => !current)}>
            {showOfferDetails
              ? `Hide ${cardsOnlyMode ? 'card' : 'offer'} details`
              : `Show ${cardsOnlyMode ? 'card' : 'offer'} details`}
          </Button>
        </div>

        {showOfferDetails ? (
          cardsOnlyMode ? (
            <div className="mt-6 space-y-4">
              {cardLane.length === 0 ? (
                <EmptyLaneCard
                  lane="cards"
                  exclusions={cardExclusions}
                  ownedCardsCount={ownedCardsCount}
                  amexLifetimeBlockedCount={amexLifetimeBlockedCount}
                  chase524Blocked={chase524Blocked}
                />
              ) : (
                cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-bg/18 p-5">
                <h3 className="text-lg font-semibold text-text-primary">Card Bonus Track</h3>
                <div className="mt-4 space-y-4">
                  {cardLane.length === 0 ? (
                    <EmptyLaneCard
                      lane="cards"
                      exclusions={cardExclusions}
                      ownedCardsCount={ownedCardsCount}
                      amexLifetimeBlockedCount={amexLifetimeBlockedCount}
                      chase524Blocked={chase524Blocked}
                    />
                  ) : (
                    cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-bg/18 p-5">
                <h3 className="text-lg font-semibold text-text-primary">Bank Bonus Track</h3>
                <div className="mt-4 space-y-4">
                  {bankingLane.length === 0 ? (
                    <EmptyLaneCard lane="banking" exclusions={bankingExclusions} />
                  ) : (
                    bankingLane.map((item) => <RecommendationCard key={item.id} item={item} />)
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="mt-5 rounded-2xl bg-white/[0.02] px-5 py-4 text-sm text-text-secondary">
            {orderedRecommendations.length} move{orderedRecommendations.length === 1 ? '' : 's'} are in this draft. Keep the execution board as the main workspace, then open the full detail cards when you want to compare value math, fees, and requirements side by side.
          </div>
        )}
      </section>

      <ResultsEligibilityEditor
        payload={payload}
        cards={availableCards}
        cardsLoading={cardsLoading}
        cardsError={cardsError}
        onUpdateEligibility={onUpdateEligibility}
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={cardsOnlyMode ? '/cards/plan' : '/tools/card-finder?mode=full'}>
          <Button variant="ghost">
            {cardsOnlyMode ? 'Edit Full Card Intake' : 'Edit Full Planner'}
          </Button>
        </Link>
        {!isDemo ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Clear Saved Plan
          </button>
        ) : null}
      </div>
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
