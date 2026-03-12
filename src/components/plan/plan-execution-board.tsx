'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlanEmailPanel } from '@/components/plan/plan-email-panel';
import { PlanMonthCalendar } from '@/components/plan/plan-month-calendar';
import { PlanTimeline } from '@/components/plan/plan-timeline';
import { PlanYearOverview } from '@/components/plan/plan-year-overview';
import {
  buildTimelineMilestones,
  buildTimelineMonthBuckets,
  diffDays,
  downloadTimelineCalendar,
  findTimelineMonthIndex,
  formatDaysUntil,
  formatDetailedDate,
  getUpcomingTimelineMilestones,
  timelineMilestoneActionCopy,
  type TimelineEntry,
  type TimelineMilestone
} from '@/components/plan/plan-results-utils';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanExecutionBoardProps = {
  timelineEntries: TimelineEntry[];
  planStart: Date;
  labels: string[];
  recommendations: PlannerRecommendation[];
  scopedRecommendationsById: Map<string, PlannerRecommendation>;
  cardsOnlyMode: boolean;
  totalValue: number;
};

function laneBadgeClass(lane: TimelineEntry['lane']) {
  return lane === 'cards'
    ? 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
    : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal';
}

function milestoneBadgeClass(kind: TimelineMilestone['kind']) {
  if (kind === 'open') {
    return 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold';
  }

  if (kind === 'payout') {
    return 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal';
  }

  return 'border-white/10 bg-bg/50 text-text-secondary';
}

export function PlanExecutionBoard({
  timelineEntries,
  planStart,
  labels,
  recommendations,
  scopedRecommendationsById,
  cardsOnlyMode,
  totalValue
}: PlanExecutionBoardProps) {
  const [view, setView] = useState<'month' | 'year'>('month');
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const referenceDate = useMemo(() => new Date(), []);
  const milestones = useMemo(() => buildTimelineMilestones(timelineEntries), [timelineEntries]);
  const upcomingMilestones = useMemo(
    () => getUpcomingTimelineMilestones(milestones, referenceDate),
    [milestones, referenceDate]
  );
  const monthBuckets = useMemo(
    () => buildTimelineMonthBuckets(milestones, planStart),
    [milestones, planStart]
  );
  const initialMonthIndex = useMemo(
    () => findTimelineMonthIndex(monthBuckets, referenceDate),
    [monthBuckets, referenceDate]
  );
  const [activeMonthIndex, setActiveMonthIndex] = useState(initialMonthIndex);

  useEffect(() => {
    setActiveMonthIndex(initialMonthIndex);
  }, [initialMonthIndex]);

  return (
    <section className="mt-8 rounded-3xl bg-bg-surface p-6 xl:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl text-text-primary">Execution Calendar</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            See exactly when to apply or open each move, when the requirement window ends, and
            when the payout should show up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
          <button
            type="button"
            onClick={() => setShowTimeline((current) => !current)}
            className="font-semibold transition hover:text-text-primary"
          >
            {showTimeline ? 'Hide bar timeline' : 'Bar timeline'}
          </button>
          <button
            type="button"
            onClick={() => setShowEmailPanel((current) => !current)}
            disabled={recommendations.length === 0}
            className="font-semibold transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showEmailPanel ? 'Hide email draft' : 'Email my plan'}
          </button>
          <button
            type="button"
            onClick={() => downloadTimelineCalendar(timelineEntries)}
            disabled={timelineEntries.length === 0}
            className="font-semibold transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Calendar (.ics)
          </button>
        </div>
      </div>

      {showEmailPanel ? (
        <PlanEmailPanel
          recommendations={recommendations}
          milestones={milestones}
          totalValue={totalValue}
          cardsOnlyMode={cardsOnlyMode}
          referenceDate={referenceDate}
        />
      ) : null}

      <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Next actions</p>
            <h3 className="mt-2 text-xl font-semibold text-text-primary">What to do soonest</h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            First 30 days
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {upcomingMilestones.length > 0 ? (
            upcomingMilestones.map((milestone) => {
              const recommendation = scopedRecommendationsById.get(milestone.recommendationId);
              const daysUntil = diffDays(referenceDate, milestone.date);

              return (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 rounded-xl bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-[64px] rounded-xl bg-black/20 px-2 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                      {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(milestone.date)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-text-primary">
                      {milestone.date.getDate()}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${milestoneBadgeClass(milestone.kind)}`}
                      >
                        {milestone.label}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${laneBadgeClass(milestone.lane)}`}
                      >
                        {milestone.lane === 'cards' ? 'Card move' : 'Bank move'}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                        {daysUntil <= 14 ? 'Due soon' : formatDaysUntil(milestone.date, referenceDate)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-text-primary">{milestone.title}</p>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">
                          {timelineMilestoneActionCopy(milestone, recommendation)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatDetailedDate(milestone.date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-text-muted">
              No upcoming milestones yet. Build recommendations first.
            </p>
          )}
        </div>
      </div>

      {view === 'month' ? (
        <PlanMonthCalendar
          milestones={milestones}
          monthBuckets={monthBuckets}
          activeMonthIndex={activeMonthIndex}
          onSelectMonthIndex={setActiveMonthIndex}
          onChangeView={setView}
          referenceDate={referenceDate}
          scopedRecommendationsById={scopedRecommendationsById}
        />
      ) : null}

      {view === 'year' ? (
        <PlanYearOverview
          monthBuckets={monthBuckets}
          activeMonthIndex={activeMonthIndex}
          onSelectMonthIndex={setActiveMonthIndex}
          onChangeView={setView}
          onOpenMonthView={() => setView('month')}
          referenceDate={referenceDate}
        />
      ) : null}

      {showTimeline ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Secondary view</p>
              <h3 className="mt-2 text-xl font-semibold text-text-primary">Bar timeline</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Keep this as a sequence reference. Use `Month` and `Year` for the main planning flow.
            </p>
          </div>
          <PlanTimeline
            timelineEntries={timelineEntries}
            planStart={planStart}
            labels={labels}
            scopedRecommendationsById={scopedRecommendationsById}
            compact
          />
        </div>
      ) : null}
    </section>
  );
}
