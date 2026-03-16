'use client';

import { Button } from '@/components/ui/button';
import {
  diffDays,
  downloadTimelineCalendar,
  formatShortDate,
  toTimelinePercent,
  type TimelineEntry
} from '@/components/plan/plan-results-utils';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanTimelineProps = {
  timelineEntries: TimelineEntry[];
  planStart: Date;
  labels: string[];
  scopedRecommendationsById: Map<string, PlannerRecommendation>;
  compact?: boolean;
};

export function PlanTimeline({
  timelineEntries,
  planStart,
  labels,
  scopedRecommendationsById,
  compact = false
}: PlanTimelineProps) {
  const content = (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">1. Apply or open</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">Open the card or account</p>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            Apply for the card or open the bank account by the{' '}
            <span className="font-semibold text-text-primary">Apply/open by</span> date shown below.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">2. Hit the requirement</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">Spend or deposit the required amount</p>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            Meet the spending, funding, or direct-deposit requirement before the{' '}
            <span className="font-semibold text-text-primary">Complete by</span> date.
          </p>
        </div>
        <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">3. Collect the bonus</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">The bonus posts to your account</p>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            After you complete the requirement, the bonus typically posts around the{' '}
            <span className="font-semibold text-text-primary">Bonus expected</span> date.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-bg/40 p-4">
        <div className="grid min-w-[640px] grid-cols-12 gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {timelineEntries.map((entry, index) => {
            const recommendation = scopedRecommendationsById.get(entry.id);
            const timelineRequirements = recommendation?.keyRequirements.slice(0, 2) ?? [];
            const startPct = toTimelinePercent(planStart, entry.startDate);
            const completePct = toTimelinePercent(planStart, entry.completeDate);
            const payoutPct = toTimelinePercent(planStart, entry.payoutDate);
            const barWidth = Math.max(3, completePct - startPct);
            const laneAccentClass =
              entry.lane === 'cards'
                ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
                : 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal';
            const actionLabel =
              entry.lane === 'cards'
                ? 'Apply for the card first, then work the spend requirement during this window.'
                : 'Open the account first, then complete the funding or direct-deposit steps during this window.';

            return (
              <div key={entry.id} className="rounded-[1.5rem] border border-white/10 bg-bg/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-base font-semibold ${laneAccentClass}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                        {entry.lane === 'cards' ? 'Card move' : 'Bank move'}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-text-primary">{entry.title}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {diffDays(entry.startDate, entry.completeDate)} days to complete
                  </span>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="rounded-2xl border border-white/10 bg-bg/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Apply/open by</p>
                        <p className="mt-2 text-lg font-semibold text-text-primary">
                          {formatShortDate(entry.startDate)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-bg/50 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                          Complete by
                        </p>
                        <p className="mt-2 text-lg font-semibold text-text-primary">
                          {formatShortDate(entry.completeDate)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/10 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                          Bonus expected
                        </p>
                        <p className="mt-2 text-lg font-semibold text-text-primary">
                          {formatShortDate(entry.payoutDate)}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-5 h-3 rounded-full bg-bg-elevated/80">
                      <div
                        className={`absolute top-0 h-3 rounded-full ${entry.lane === 'cards' ? 'bg-brand-gold/70' : 'bg-brand-teal/70'}`}
                        style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                      />
                      <span
                        className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-brand-gold"
                        style={{ left: `${startPct}%`, transform: 'translate(-50%, -50%)' }}
                        aria-hidden
                      />
                      <span
                        className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-white"
                        style={{ left: `${completePct}%`, transform: 'translate(-50%, -50%)' }}
                        aria-hidden
                      />
                      <span
                        className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-brand-teal"
                        style={{ left: `${payoutPct}%`, transform: 'translate(-50%, -50%)' }}
                        aria-hidden
                      />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.18em] text-text-muted sm:grid-cols-3">
                      <span>Open</span>
                      <span className="sm:text-center">Complete</span>
                      <span className="sm:text-right">Payout</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-bg/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                      What to do now
                    </p>
                    <p className="mt-2 text-base leading-7 text-text-secondary">{actionLabel}</p>
                    <div className="mt-4 space-y-2">
                      {timelineRequirements.length > 0 ? (
                        timelineRequirements.map((requirement) => (
                          <div
                            key={requirement}
                            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg/40 px-3 py-2"
                          >
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
                            <p className="text-base leading-7 text-text-secondary">{requirement}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-white/10 px-3 py-2 text-base leading-7 text-text-muted">
                          No extra requirement details available for this step.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {timelineEntries.length === 0 && (
            <p className="text-sm text-text-muted">No timeline items yet. Build recommendations first.</p>
          )}
        </div>
      </div>
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-text-primary">Execution Timeline</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            Work this plan in order. Open each move by the first date, finish the requirement
            window by the second, and look for the payout around the third.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => downloadTimelineCalendar(timelineEntries)}
          disabled={timelineEntries.length === 0}
        >
          Download calendar (.ics)
        </Button>
      </div>

      <div className="mt-5">{content}</div>
    </section>
  );
}
