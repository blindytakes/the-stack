'use client';

import { useMemo, useState } from 'react';
import {
  formatValue,
  type TimelineEntry
} from '@/components/plan/plan-results-utils';
import { RecommendationCard } from '@/components/plan/recommendation-card';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanSequenceListProps = {
  orderedRecommendations: PlannerRecommendation[];
  timelineEntries: TimelineEntry[];
};

function formatDateRange(entry: TimelineEntry | undefined) {
  if (!entry) return '';
  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(entry.startDate);
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(entry.completeDate);
  return startMonth === endMonth ? startMonth : `${startMonth}–${endMonth}`;
}

export function PlanSequenceList({
  orderedRecommendations,
  timelineEntries
}: PlanSequenceListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const entriesById = useMemo(
    () => new Map(timelineEntries.map((entry) => [entry.id, entry])),
    [timelineEntries]
  );

  function handleToggle(index: number) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Full plan</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">Your Plan</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Work these moves in order for the best results.
          </p>
        </div>
        {orderedRecommendations.length > 1 ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            {showAll ? 'Collapse all' : 'Expand all'}
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        {orderedRecommendations.map((recommendation, index) => {
          const entry = entriesById.get(recommendation.id);
          const dateRange = formatDateRange(entry);
          const isExpanded = showAll || expandedIndex === index;
          const laneBadgeClass =
            recommendation.lane === 'cards'
              ? 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
              : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal';

          const stepBgClass =
            recommendation.lane === 'cards'
              ? 'bg-brand-gold/15 text-brand-gold'
              : 'bg-brand-teal/15 text-brand-teal';

          return (
            <div key={recommendation.id}>
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${
                  isExpanded
                    ? 'bg-white/[0.05] ring-1 ring-white/10'
                    : 'bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step number */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${stepBgClass}`}
                  >
                    {index + 1}
                  </span>

                  {/* Title and provider */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-text-primary">
                      {recommendation.title}
                    </p>
                    <p className="text-sm text-text-muted">{recommendation.provider}</p>
                  </div>

                  {/* Value */}
                  <span className="shrink-0 text-base font-semibold text-text-primary">
                    {formatValue(recommendation.estimatedNetValue)}
                  </span>

                  {/* Date range */}
                  {dateRange ? (
                    <span className="hidden shrink-0 text-sm text-text-muted sm:inline">
                      {dateRange}
                    </span>
                  ) : null}

                  {/* Lane badge */}
                  <span
                    className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] sm:inline ${laneBadgeClass}`}
                  >
                    {recommendation.kind === 'card_bonus' ? 'Card' : 'Bank'}
                  </span>

                  {/* Expand indicator */}
                  <span
                    className={`shrink-0 text-sm text-text-muted transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </div>

                {/* Mobile-only secondary row */}
                <div className="mt-1 flex items-center gap-3 pl-11 sm:hidden">
                  {dateRange ? (
                    <span className="text-xs text-text-muted">{dateRange}</span>
                  ) : null}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${laneBadgeClass}`}
                  >
                    {recommendation.kind === 'card_bonus' ? 'Card' : 'Bank'}
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded ? (
                <div className="mt-2 ml-4 border-l-2 border-white/10 pl-4">
                  <RecommendationCard item={recommendation} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
        <span className="text-sm font-semibold text-text-secondary">
          {orderedRecommendations.length} total moves
        </span>
        <span className="text-lg font-semibold text-text-primary">
          {formatValue(orderedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0))}
        </span>
      </div>
    </div>
  );
}
