import Link from 'next/link';
import {
  MIN_VISIBLE_BENEFIT_ADJUSTMENT,
  formatSignedValue,
  formatValue,
  recommendationRationale
} from '@/components/plan/plan-results-utils';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

type RecommendationCardProps = {
  item: PlannerRecommendation;
  variant?: 'default' | 'featured';
};

export function RecommendationCard({
  item,
  variant = 'default'
}: RecommendationCardProps) {
  const breakdown = item.valueBreakdown;
  const cardBenefitAdjustment = breakdown?.benefitAdjustment ?? 0;
  const cardAnnualFee = breakdown?.annualFee ?? 0;
  const bankEstimatedFees = breakdown?.estimatedFees ?? 0;
  const isFeatured = variant === 'featured';
  const headlineValue = breakdown?.headlineValue ?? item.estimatedNetValue;
  const laneBadgeClass =
    item.lane === 'cards'
      ? 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
      : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal';
  const valuePanelClass =
    item.lane === 'cards'
      ? 'border-brand-gold/20 bg-brand-gold/10'
      : 'border-brand-teal/20 bg-brand-teal/10';
  const articleClass = isFeatured
    ? 'rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6'
    : 'rounded-2xl border border-white/10 bg-bg/40 p-5';

  return (
    <article className={articleClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] uppercase tracking-[0.25em] text-text-muted">{item.provider}</p>
          <h3 className={`mt-2 font-semibold text-text-primary ${isFeatured ? 'text-2xl' : 'text-xl'}`}>
            {item.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${laneBadgeClass}`}>
            {item.kind === 'card_bonus' ? 'Card bonus' : 'Bank bonus'}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {item.effort} effort
          </span>
        </div>
      </div>

      <div
        className={`mt-5 grid gap-3 ${isFeatured ? 'md:grid-cols-[minmax(0,1fr)_auto]' : 'sm:grid-cols-[minmax(0,1fr)_auto]'}`}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {breakdown?.headlineLabel ?? 'Bonus value'}
          </p>
          <p className={`mt-2 font-heading text-text-primary ${isFeatured ? 'text-6xl' : 'text-5xl'}`}>
            {formatValue(headlineValue)}
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${valuePanelClass}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {item.kind === 'card_bonus' ? 'Open value est.' : 'Net value est.'}
          </p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {formatValue(item.estimatedNetValue)}
          </p>
        </div>
      </div>

      {item.kind === 'card_bonus' && breakdown ? (
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
      ) : item.kind === 'bank_bonus' && breakdown ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {bankEstimatedFees > 0 && (
            <span className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-brand-coral">
              Fees {formatSignedValue(bankEstimatedFees, 'negative')}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-muted">
          Estimated value: <span className="font-semibold text-text-primary">{formatValue(item.estimatedNetValue)}</span>
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-bg/50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Why we recommend this</p>
        <p className="mt-1 text-base leading-7 text-text-secondary">{recommendationRationale(item)}</p>
      </div>

      {item.timelineDays ? (
        <div className="mt-4 text-sm text-text-muted">
          <span>Timeline: {item.timelineDays} days</span>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {item.keyRequirements.slice(0, 3).map((requirement) => (
          <div
            key={requirement}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg/30 px-3 py-2"
          >
            <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
            <p className="text-base leading-7 text-text-secondary">{requirement}</p>
          </div>
        ))}
      </div>

      <Link
        href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
        className="mt-5 inline-flex items-center text-base font-semibold text-brand-teal transition hover:underline"
      >
        {item.kind === 'card_bonus' ? 'View card details' : 'View bank details'}
      </Link>
    </article>
  );
}
