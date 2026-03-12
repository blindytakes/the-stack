'use client';

import type { TimelineMilestone, TimelineMonthBucket } from '@/components/plan/plan-results-utils';

type PlanYearOverviewProps = {
  monthBuckets: TimelineMonthBucket[];
  activeMonthIndex: number;
  onSelectMonthIndex: (index: number) => void;
  onChangeView: (view: 'month' | 'year') => void;
  onOpenMonthView: () => void;
  referenceDate: Date;
};

function countMilestones(items: TimelineMilestone[], kind: TimelineMilestone['kind']) {
  return items.filter((item) => item.kind === kind).length;
}

export function PlanYearOverview({
  monthBuckets,
  activeMonthIndex,
  onSelectMonthIndex,
  onChangeView,
  onOpenMonthView,
  referenceDate
}: PlanYearOverviewProps) {
  if (monthBuckets.length === 0) {
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
            <h3 className="text-2xl font-semibold text-text-primary">12-month roadmap</h3>
            <div className="inline-flex rounded-full bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => onChangeView('month')}
                aria-pressed={false}
                className="rounded-full px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onChangeView('year')}
                aria-pressed
                className="rounded-full bg-brand-teal/14 px-4 py-2 text-sm font-semibold text-brand-teal transition"
              >
                Year
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Scan the full year for pacing. Quiet months stay visible on purpose, so the plan feels workable.
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          Tap any month to open it in the detailed calendar.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {monthBuckets.map((bucket, index) => {
          const openCount = countMilestones(bucket.items, 'open');
          const completeCount = countMilestones(bucket.items, 'complete');
          const payoutCount = countMilestones(bucket.items, 'payout');
          const leadMove = bucket.items.find((item) => item.kind === 'open') ?? bucket.items[0] ?? null;
          const isActive = bucket.items.length > 0;
          const isSelected = index === activeMonthIndex;
          const isCurrentMonth =
            bucket.monthStart.getFullYear() === referenceDate.getFullYear() &&
            bucket.monthStart.getMonth() === referenceDate.getMonth();

          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => {
                onSelectMonthIndex(index);
                onOpenMonthView();
              }}
              className={`min-h-[182px] rounded-[1.25rem] px-5 py-5 text-left transition ${
                isActive
                  ? isSelected
                    ? 'bg-white/[0.07] ring-1 ring-brand-teal/35 shadow-[0_18px_40px_rgba(0,0,0,0.16)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.055]'
                  : isSelected
                    ? 'bg-white/[0.02] ring-1 ring-white/10'
                    : 'bg-transparent hover:bg-white/[0.015]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-xl font-semibold ${
                      isActive ? 'text-text-primary' : 'text-text-muted/80'
                    }`}
                  >
                    {bucket.label}
                  </p>
                  {leadMove ? (
                    <p className="mt-3 text-sm leading-6 text-text-secondary line-clamp-2">{leadMove.title}</p>
                  ) : (
                    <p className="mt-3 text-sm text-text-muted/80">Quiet month</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isCurrentMonth ? (
                    <span className="rounded-full bg-brand-teal/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-teal">
                      Now
                    </span>
                  ) : null}
                  {isActive ? (
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                      {bucket.items.length} move{bucket.items.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </div>
              </div>

              {isActive ? (
                <div className="mt-5 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-gold" aria-hidden />
                    {openCount} open
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/45" aria-hidden />
                    {completeCount} complete
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
                    {payoutCount} payout
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
