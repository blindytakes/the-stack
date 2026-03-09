'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyLaneCard } from '@/components/plan/empty-lane-card';
import { PlanTimeline } from '@/components/plan/plan-timeline';
import { type EligibilityDraft } from '@/components/plan/plan-results-config';
import {
  buildScheduledTimelineEntries,
  buildTimelineEntriesFallback,
  formatValue,
  monthLabels
} from '@/components/plan/plan-results-utils';
import { RecommendationCard } from '@/components/plan/recommendation-card';
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
  onUpdateEligibility
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
  cardsOnlyMode: boolean;
  onUpdateEligibility: (draft: EligibilityDraft) => Promise<string | null>;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const { cards: availableCards, loading: cardsLoading, error: cardsError } = useCardsDirectory(100);
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
  const cardValue = cardLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const bankingValue = bankingLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const ownedCardsCount = payload.answers.ownedCardSlugs.length;
  const amexLifetimeBlockedCount = payload.answers.amexLifetimeBlockedSlugs.length;
  const chase524Blocked = payload.answers.chase524Status === 'at_or_over_5_24';
  const doNowLimit = 2;
  const doNow = orderedRecommendations.slice(0, doNowLimit);
  const doNext = orderedRecommendations.slice(doNowLimit);
  const summaryFlags = [
    ownedCardsCount > 0
      ? `${ownedCardsCount} current card${ownedCardsCount === 1 ? '' : 's'} excluded`
      : null,
    amexLifetimeBlockedCount > 0
      ? `${amexLifetimeBlockedCount} prior Amex card${amexLifetimeBlockedCount === 1 ? '' : 's'} blocked`
      : null,
    chase524Blocked ? 'Chase 5/24 applied' : null
  ].filter((value): value is string => Boolean(value));

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(212,168,83,0.1),transparent_40%),rgba(255,255,255,0.03)] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">12-Month Bonus-First Estimate</p>
            <p className="mt-3 font-heading text-5xl text-text-primary md:text-6xl">
              {formatValue(totalValue)}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary md:text-lg">
              {cardsOnlyMode
                ? 'This draft ranks the strongest card bonuses first, then applies conservative fee and perk adjustments so the headline stays grounded.'
                : 'This draft combines your strongest card and bank bonus moves into one 12-month plan, with conservative net-value assumptions and a sequence you can actually follow.'}
            </p>
            {summaryFlags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {summaryFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full border border-white/10 bg-bg/40 px-3 py-1.5 text-sm text-text-secondary"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`grid gap-3 ${cardsOnlyMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3 xl:grid-cols-1'}`}>
            <SummaryStatCard
              label="Card open-value est."
              value={formatValue(cardValue)}
              description={`${cardLane.length} card move${cardLane.length === 1 ? '' : 's'} in this draft`}
              tone="gold"
            />
            {!cardsOnlyMode && (
              <SummaryStatCard
                label="Banking net est."
                value={formatValue(bankingValue)}
                description={`${bankingLane.length} bank move${bankingLane.length === 1 ? '' : 's'} in this draft`}
                tone="teal"
              />
            )}
            <SummaryStatCard
              label="Start now"
              value={String(doNow.length)}
              description={doNow[0] ? `${doNow[0].title} leads the plan.` : 'No immediate moves yet.'}
              tone="neutral"
            />
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">Start Today</h2>
        <p className="mt-2 text-base leading-7 text-text-secondary">
          Open these highest-priority bonus moves first.
        </p>
        <div className={`mt-4 grid gap-4 ${doNow.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {doNow.length > 0 ? (
            doNow.map((item) => <RecommendationCard key={item.id} item={item} variant="featured" />)
          ) : (
            <p className="text-sm text-text-muted">No do-now recommendations are available yet.</p>
          )}
        </div>
      </section>
      <PlanTimeline
        timelineEntries={timelineEntries}
        planStart={planStart}
        labels={labels}
        scopedRecommendationsById={scopedRecommendationsById}
      />

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">
          {cardsOnlyMode ? 'Card Bonus Track' : 'Lane Breakdown'}
        </h2>
        {cardsOnlyMode ? (
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
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-bg/40 p-5">
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
            <div className="rounded-2xl border border-white/10 bg-bg/40 p-5">
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
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">Do Next</h2>
        <p className="mt-2 text-base leading-7 text-text-secondary">
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
      <p className="mt-4 text-base leading-8 text-text-secondary md:text-lg">
        {cardsOnlyMode
          ? 'We prioritize the biggest card bonuses you can realistically earn, then apply conservative perk and fee adjustments.'
          : 'We prioritize the biggest card and bank bonuses you can realistically earn, with conservative fee and perk adjustments.'}
      </p>
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
      />
    </div>
  );
}
