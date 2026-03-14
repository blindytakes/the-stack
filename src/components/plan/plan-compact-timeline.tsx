'use client';

import { useMemo, useState } from 'react';
import {
  formatShortDate,
  type TimelineEntry,
  type TimelineMonthBucket
} from '@/components/plan/plan-results-utils';

type PlanCompactTimelineProps = {
  monthBuckets: TimelineMonthBucket[];
  timelineEntries: TimelineEntry[];
  referenceDate: Date;
};

function shortMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function laneColor(lane: 'cards' | 'banking') {
  return lane === 'cards' ? 'brand-gold' : 'brand-teal';
}

function laneBadgeClasses(lane: 'cards' | 'banking') {
  return lane === 'cards'
    ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
    : 'border-brand-teal/30 bg-brand-teal/10 text-brand-teal';
}

function laneBarClasses(lane: 'cards' | 'banking') {
  return lane === 'cards'
    ? 'bg-brand-gold/25 border-brand-gold/40'
    : 'bg-brand-teal/25 border-brand-teal/40';
}

function lanePayoutClasses(lane: 'cards' | 'banking') {
  return lane === 'cards' ? 'bg-brand-gold' : 'bg-brand-teal';
}

export function PlanCompactTimeline({
  monthBuckets,
  timelineEntries,
  referenceDate
}: PlanCompactTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeMonths = monthBuckets.filter((bucket) => bucket.items.length > 0);

  // Compute the full date range from monthBuckets
  const timelineRange = useMemo(() => {
    if (monthBuckets.length === 0) return { start: new Date(), end: new Date(), totalDays: 1 };
    const start = monthBuckets[0].monthStart;
    const lastBucket = monthBuckets[monthBuckets.length - 1];
    const end = new Date(lastBucket.monthStart);
    end.setMonth(end.getMonth() + 1);
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { start, end, totalDays };
  }, [monthBuckets]);

  // Position helper: convert a date to a percentage offset within the timeline
  function dateToPercent(date: Date) {
    const days = (date.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (days / timelineRange.totalDays) * 100));
  }

  // Today marker position
  const todayPercent = dateToPercent(referenceDate);

  return (
    <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Timeline</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">Your 6-Month Roadmap</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">
            {activeMonths.length} active month{activeMonths.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            {isExpanded ? 'Collapse' : 'Details'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-sm bg-brand-gold/25 border border-brand-gold/40" aria-hidden />
          Card bonus
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-sm bg-brand-teal/25 border border-brand-teal/40" aria-hidden />
          Bank bonus
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/60" aria-hidden />
          Payout
        </span>
      </div>

      {/* ── Gantt chart ── */}
      <div className="mt-5">
        {/* Month headers */}
        <div className="relative mb-1 flex border-b border-white/[0.06] pb-1">
          {monthBuckets.map((bucket) => {
            const isCurrentMonth =
              bucket.monthStart.getFullYear() === referenceDate.getFullYear() &&
              bucket.monthStart.getMonth() === referenceDate.getMonth();

            return (
              <div
                key={bucket.key}
                className="flex-1 text-center"
              >
                <span
                  className={`text-[11px] uppercase tracking-[0.12em] ${
                    isCurrentMonth ? 'font-semibold text-brand-teal' : 'text-text-muted'
                  }`}
                >
                  {shortMonthLabel(bucket.monthStart)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bars */}
        <div className="relative space-y-1.5 py-2">
          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 z-10 w-px bg-brand-teal/40"
            style={{ left: `${todayPercent}%` }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-[0.12em] text-brand-teal">
              Today
            </span>
          </div>

          {timelineEntries.map((entry) => {
            const startPct = dateToPercent(entry.startDate);
            const endPct = dateToPercent(entry.completeDate);
            const payoutPct = dateToPercent(entry.payoutDate);
            const barWidth = Math.max(3, endPct - startPct);

            return (
              <div key={entry.id} className="relative flex h-7 items-center">
                {/* Active period bar */}
                <div
                  className={`absolute h-5 rounded ${laneBarClasses(entry.lane)} border flex items-center overflow-hidden`}
                  style={{
                    left: `${startPct}%`,
                    width: `${barWidth}%`
                  }}
                >
                  <span className="truncate px-2 text-[11px] font-medium text-text-primary">
                    {entry.title}
                  </span>
                </div>
                {/* Payout dot */}
                <div
                  className={`absolute h-2 w-2 rounded-full ${lanePayoutClasses(entry.lane)} ring-2 ring-bg-surface`}
                  style={{ left: `${payoutPct}%`, transform: 'translateX(-50%)' }}
                  title={`Payout: ${formatShortDate(entry.payoutDate)}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded ? (
        <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
          {timelineEntries.length > 0 ? (
            timelineEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.06] bg-bg/30 px-4 py-3"
              >
                <span
                  className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${laneBadgeClasses(entry.lane)}`}
                >
                  {entry.lane === 'cards' ? 'Card' : 'Bank'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{entry.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full bg-${laneColor(entry.lane)} mr-1`} aria-hidden />
                      Open by {formatShortDate(entry.startDate)}
                    </span>
                    <span>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/45 mr-1" aria-hidden />
                      Complete by {formatShortDate(entry.completeDate)}
                    </span>
                    <span>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full bg-${laneColor(entry.lane)} mr-1`} aria-hidden />
                      Payout ~{formatShortDate(entry.payoutDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">No scheduled actions in the plan yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
