'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  buildTimelineCalendarDays,
  formatDetailedDate,
  formatMonthYear,
  formatShortDate,
  isSameDay,
  recommendationWarningFlags,
  timelineMilestoneActionCopy,
  toTimelineDayKey,
  type TimelineCalendarDay,
  type TimelineMilestone,
  type TimelineMonthBucket
} from '@/components/plan/plan-results-utils';
import { Button } from '@/components/ui/button';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanMonthCalendarProps = {
  milestones: TimelineMilestone[];
  monthBuckets: TimelineMonthBucket[];
  activeMonthIndex: number;
  onSelectMonthIndex: (index: number) => void;
  onChangeView: (view: 'month' | 'year') => void;
  referenceDate: Date;
  scopedRecommendationsById: Map<string, PlannerRecommendation>;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function laneBadgeClass(lane: TimelineMilestone['lane']) {
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

function milestoneDotClass(kind: TimelineMilestone['kind']) {
  if (kind === 'open') return 'bg-brand-gold';
  if (kind === 'payout') return 'bg-brand-teal';
  return 'bg-white/45';
}

function SelectedDayDetails({
  selectedDay,
  scopedRecommendationsById
}: {
  selectedDay: TimelineCalendarDay | null;
  scopedRecommendationsById: Map<string, PlannerRecommendation>;
}) {
  const selectedCount = selectedDay?.items.length ?? 0;

  return (
    <aside className="self-start rounded-[1.75rem] border border-brand-teal/12 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),rgba(255,255,255,0.04))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] xl:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Selected date</p>
          <h3 className="mt-2 text-2xl font-semibold text-text-primary">
            {selectedDay ? formatDetailedDate(selectedDay.date) : 'Pick a date'}
          </h3>
        </div>
        {selectedDay ? (
          <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            {selectedCount} move{selectedCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        This is the action panel. Keep the calendar light and use this space for the actual next step.
      </p>

      <div className="mt-5 space-y-4">
        {selectedDay?.items.length ? (
          selectedDay.items.map((milestone) => {
            const recommendation = scopedRecommendationsById.get(milestone.recommendationId);
            const warnings = recommendationWarningFlags(recommendation);

            return (
              <article key={milestone.id} className="border-l-2 border-white/10 pl-4">
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
                  {warnings.slice(0, 2).map((warning) => (
                    <span
                      key={warning}
                      className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-coral"
                    >
                      {warning}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-base font-semibold text-text-primary">{milestone.title}</p>
                {recommendation ? (
                  <p className="mt-1 text-sm text-text-muted">{recommendation.provider}</p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {timelineMilestoneActionCopy(milestone, recommendation)}
                </p>
                {milestone.kind === 'complete' && recommendation?.timelineDays ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {recommendation.timelineDays} day window
                  </p>
                ) : null}
                {recommendation ? (
                  <div className="mt-3">
                    <Link
                      href={recommendation.detailPath}
                      className="text-sm font-semibold text-brand-teal transition hover:opacity-90"
                    >
                      View offer details
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="text-sm leading-6 text-text-muted">
            No scheduled actions on this date.
          </p>
        )}
      </div>
    </aside>
  );
}

export function PlanMonthCalendar({
  milestones,
  monthBuckets,
  activeMonthIndex,
  onSelectMonthIndex,
  onChangeView,
  referenceDate,
  scopedRecommendationsById
}: PlanMonthCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const activeMonth = monthBuckets[activeMonthIndex] ?? null;
  const calendarDays = useMemo(
    () => (activeMonth ? buildTimelineCalendarDays(milestones, activeMonth.monthStart) : []),
    [activeMonth, milestones]
  );
  const agendaDays = useMemo(
    () => calendarDays.filter((day) => day.inCurrentMonth && day.items.length > 0),
    [calendarDays]
  );

  useEffect(() => {
    if (!activeMonth) {
      setSelectedDateKey(null);
      return;
    }

    const nextMilestone =
      activeMonth.items.find((item) => item.date.getTime() >= referenceDate.getTime()) ??
      activeMonth.items[0];

    setSelectedDateKey(
      nextMilestone ? toTimelineDayKey(nextMilestone.date) : toTimelineDayKey(activeMonth.monthStart)
    );
  }, [activeMonth, referenceDate]);

  const selectedDay = useMemo(() => {
    if (!selectedDateKey) return calendarDays[0] ?? null;
    return calendarDays.find((day) => day.key === selectedDateKey) ?? calendarDays[0] ?? null;
  }, [calendarDays, selectedDateKey]);

  if (!activeMonth) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-text-muted">
        No scheduled actions are available yet.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Planning canvas</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-text-primary">
              {formatMonthYear(activeMonth.monthStart)}
            </h3>
            <div className="inline-flex rounded-full bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => onChangeView('month')}
                aria-pressed
                className="rounded-full bg-brand-teal/14 px-4 py-2 text-sm font-semibold text-brand-teal transition"
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onChangeView('year')}
                aria-pressed={false}
                className="rounded-full px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
              >
                Year
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-text-secondary">
            {activeMonth.items.length} action{activeMonth.items.length === 1 ? '' : 's'} this month
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSelectMonthIndex(Math.max(0, activeMonthIndex - 1))}
            disabled={activeMonthIndex === 0}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSelectMonthIndex(Math.min(monthBuckets.length - 1, activeMonthIndex + 1))}
            disabled={activeMonthIndex === monthBuckets.length - 1}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-gold" aria-hidden />
          Apply/open
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/45" aria-hidden />
          Complete
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-teal" aria-hidden />
          Payout
        </span>
      </div>

      <div className="mt-4 md:hidden">
        {agendaDays.length > 0 ? (
          <div className="space-y-3">
            {agendaDays.map((day) => {
              const isSelected = selectedDay?.key === day.key;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDateKey(day.key)}
                  className={`w-full rounded-xl px-4 py-4 text-left transition ${
                    isSelected ? 'bg-white/5 ring-1 ring-brand-teal/40' : 'bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatShortDate(day.date)}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {day.items.length} action{day.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {day.items.slice(0, 3).map((milestone) => (
                        <span
                          key={milestone.id}
                          className={`h-2.5 w-2.5 rounded-full ${milestoneDotClass(milestone.kind)}`}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.items.map((milestone) => (
                      <div key={milestone.id} className="text-sm text-text-secondary">
                        <span className="font-semibold text-text-primary">{milestone.label}:</span>{' '}
                        {milestone.title}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.03] px-4 py-4">
            <p className="text-sm text-text-muted">
              No scheduled actions this month. Use it as breathing room.
            </p>
          </div>
        )}

        <div className="mt-4">
          <SelectedDayDetails
            selectedDay={selectedDay}
            scopedRecommendationsById={scopedRecommendationsById}
          />
        </div>
      </div>

      <div className="mt-5 hidden items-start gap-6 md:grid xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] 2xl:grid-cols-[minmax(0,1.24fr)_minmax(390px,0.76fr)]">
        <div className="rounded-[1.75rem] bg-white/[0.035] p-5">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 pb-2 text-center text-[11px] uppercase tracking-[0.18em] text-text-muted"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isSelected = selectedDay?.key === day.key;
              const isToday = isSameDay(day.date, referenceDate);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDateKey(day.key)}
                  className={`min-h-[122px] rounded-[1rem] px-3 py-3 text-left transition ${
                    isSelected
                      ? 'bg-white/5 ring-1 ring-brand-teal/40'
                      : 'hover:bg-white/[0.03]'
                  } ${day.inCurrentMonth ? '' : 'opacity-45'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-text-primary">
                      {day.date.getDate()}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-brand-teal">
                        Today
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 flex min-h-[18px] items-center gap-1.5">
                    {day.items.length > 3 ? (
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                        {day.items.length} moves
                      </span>
                    ) : (
                      day.items.map((milestone) => (
                        <span
                          key={milestone.id}
                          className={`h-2.5 w-2.5 rounded-full ${milestoneDotClass(milestone.kind)}`}
                          aria-hidden
                        />
                      ))
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <SelectedDayDetails
          selectedDay={selectedDay}
          scopedRecommendationsById={scopedRecommendationsById}
        />
      </div>
    </div>
  );
}
