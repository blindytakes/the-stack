import Link from 'next/link';
import {
  MIN_VISIBLE_BENEFIT_ADJUSTMENT,
  diffDays,
  formatShortDate,
  formatSignedValue,
  formatValue,
  recommendationRationale,
  type TimelineEntry
} from '@/components/plan/plan-results-utils';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type PlanNextMoveProps = {
  recommendation: PlannerRecommendation;
  timelineEntry: TimelineEntry | null;
};

export function PlanNextMove({ recommendation, timelineEntry }: PlanNextMoveProps) {
  const breakdown = recommendation.valueBreakdown;
  const headlineValue = breakdown?.headlineValue ?? recommendation.estimatedNetValue;
  const cardBenefitAdjustment = breakdown?.benefitAdjustment ?? 0;
  const cardAnnualFee = breakdown?.annualFee ?? 0;
  const bankEstimatedFees = breakdown?.estimatedFees ?? 0;

  const laneBadgeClass =
    recommendation.lane === 'cards'
      ? 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
      : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal';

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Your next move</p>

      <div className="mt-3 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] uppercase tracking-[0.25em] text-text-muted">
              {recommendation.provider}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-text-primary">
              {recommendation.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${laneBadgeClass}`}
            >
              {recommendation.kind === 'card_bonus' ? 'Card bonus' : 'Bank bonus'}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-text-muted">
              {recommendation.effort} effort
            </span>
          </div>
        </div>

        {/* Value row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              {breakdown?.headlineLabel ?? 'Bonus value'}
            </p>
            <p className="mt-2 font-heading text-5xl text-text-primary md:text-6xl">
              {formatValue(headlineValue)}
            </p>
          </div>
          <div
            className={`rounded-xl px-4 py-3 ${
              recommendation.lane === 'cards' ? 'bg-brand-gold/10' : 'bg-brand-teal/10'
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              {recommendation.kind === 'card_bonus' ? 'Net value est.' : 'Net value est.'}
            </p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {formatValue(recommendation.estimatedNetValue)}
            </p>
          </div>
        </div>

        {/* Value adjustments */}
        {recommendation.kind === 'card_bonus' && breakdown ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {cardBenefitAdjustment >= MIN_VISIBLE_BENEFIT_ADJUSTMENT && (
              <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-brand-teal">
                Benefits {formatSignedValue(cardBenefitAdjustment, 'positive')}
              </span>
            )}
            {cardAnnualFee > 0 && (
              <span className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-brand-coral">
                Fee {formatSignedValue(cardAnnualFee, 'negative')}
              </span>
            )}
          </div>
        ) : recommendation.kind === 'bank_bonus' && breakdown ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {bankEstimatedFees > 0 && (
              <span className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-brand-coral">
                Fees {formatSignedValue(bankEstimatedFees, 'negative')}
              </span>
            )}
          </div>
        ) : null}

        {/* Rationale */}
        <div className="mt-5 border-l-2 border-brand-teal/30 pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Why this is first</p>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            {recommendationRationale(recommendation)}
          </p>
        </div>

        {/* Key requirements */}
        <div className="mt-4 space-y-2">
          {recommendation.keyRequirements.slice(0, 3).map((requirement) => (
            <div key={requirement} className="flex items-start gap-3">
              <span className="mt-2 text-brand-teal" aria-hidden>
                •
              </span>
              <p className="text-base leading-7 text-text-secondary">{requirement}</p>
            </div>
          ))}
        </div>

        {/* Inline timeline */}
        {timelineEntry ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Timeline</p>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {diffDays(timelineEntry.startDate, timelineEntry.completeDate)} days to complete
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Open by</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {formatShortDate(timelineEntry.startDate)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg/50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Complete by
                </p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {formatShortDate(timelineEntry.completeDate)}
                </p>
              </div>
              <div className="rounded-xl border border-brand-teal/20 bg-brand-teal/10 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Bonus expected
                </p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {formatShortDate(timelineEntry.payoutDate)}
                </p>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="relative mt-4 h-2 rounded-full bg-bg-elevated/80">
              <div
                className={`absolute top-0 h-2 rounded-full ${
                  recommendation.lane === 'cards' ? 'bg-brand-gold/50' : 'bg-brand-teal/50'
                }`}
                style={{ left: '0%', width: '66%' }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-bg bg-brand-gold"
                style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
                aria-hidden
              />
              <span
                className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-bg bg-white"
                style={{ left: '66%', transform: 'translate(-50%, -50%)' }}
                aria-hidden
              />
              <span
                className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-bg bg-brand-teal"
                style={{ left: '100%', transform: 'translate(-50%, -50%)' }}
                aria-hidden
              />
            </div>
          </div>
        ) : null}

        {/* Detail link */}
        <Link
          href={`${recommendation.detailPath}${recommendation.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
          className="mt-5 inline-flex items-center text-base font-semibold text-brand-teal transition hover:underline"
        >
          {recommendation.kind === 'card_bonus' ? 'View card details' : 'View bank details'}
        </Link>
      </div>
    </div>
  );
}
