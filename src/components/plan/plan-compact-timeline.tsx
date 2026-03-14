'use client';

import { useState } from 'react';
import {
  formatShortDate,
  type TimelineMonthBucket
} from '@/components/plan/plan-results-utils';

type PlanCompactTimelineProps = {
  monthBuckets: TimelineMonthBucket[];
  referenceDate: Date;
};

function milestoneDotClass(kind: string) {
  if (kind === 'open') return 'bg-brand-gold';
  if (kind === 'payout') return 'bg-brand-teal';
  return 'bg-white/45';
}

function shortMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

export function PlanCompactTimeline({
  monthBuckets,
  referenceDate
}: PlanCompactTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeMonths = monthBuckets.filter((bucket) => bucket.items.length > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Timeline</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">Month-by-Month</h2>
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
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-gold" aria-hidden />
          Apply/open
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/45" aria-hidden />
          Complete
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
          Payout
        </span>
      </div>

      {/* Compact dot row */}
      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {monthBuckets.map((bucket) => {
          const isCurrentMonth =
            bucket.monthStart.getFullYear() === referenceDate.getFullYear() &&
            bucket.monthStart.getMonth() === referenceDate.getMonth();

          return (
            <div
              key={bucket.key}
              className={`rounded-lg px-2 py-2 text-center ${
                isCurrentMonth ? 'bg-brand-teal/10' : ''
              }`}
            >
              <p
                className={`text-xs uppercase tracking-[0.12em] ${
                  isCurrentMonth ? 'font-semibold text-brand-teal' : 'text-text-muted'
                }`}
              >
                {shortMonthLabel(bucket.monthStart)}
              </p>
              {isCurrentMonth ? (
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-teal">
                  Now
                </p>
              ) : null}
              <div className="mt-2 flex min-h-[14px] flex-wrap items-center justify-center gap-1">
                {bucket.items.length > 4 ? (
                  <span className="text-[10px] text-text-muted">{bucket.items.length}</span>
                ) : (
                  bucket.items.map((milestone) => (
                    <span
                      key={milestone.id}
                      className={`h-2 w-2 rounded-full ${milestoneDotClass(milestone.kind)}`}
                      aria-hidden
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded detail */}
      {isExpanded ? (
        <div className="mt-5 space-y-4 border-t border-white/[0.06] pt-5">
          {activeMonths.length > 0 ? (
            activeMonths.map((bucket) => (
              <div key={bucket.key} className="border-l-2 border-white/10 pl-4">
                <p className="text-sm font-semibold text-text-primary">{bucket.label}</p>
                <div className="mt-2 space-y-1.5">
                  {bucket.items.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${milestoneDotClass(milestone.kind)}`}
                        aria-hidden
                      />
                      <span className="shrink-0 font-semibold text-text-primary">
                        {formatShortDate(milestone.date)}
                      </span>
                      <span className="text-text-muted">{milestone.label}</span>
                      <span className="truncate text-text-secondary">{milestone.title}</span>
                    </div>
                  ))}
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
