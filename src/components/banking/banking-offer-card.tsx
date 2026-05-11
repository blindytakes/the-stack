'use client';

import Link from 'next/link';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingCustomerType,
  formatBankingCurrency,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import {
  getBankingDecisionMetrics,
  getBankingRequiredDirectDepositAmount
} from '@/lib/banking/presentation-metrics';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type BankingOfferCardProps = {
  offer: BankingBonusListItem;
  variant?: 'directory' | 'compact';
  onOpenDetail?: (slug: string) => void;
  planSourcePath?: string;
};

export function BankingOfferCard({
  offer,
  variant = 'directory',
  onOpenDetail,
  planSourcePath
}: BankingOfferCardProps) {
  const isCompact = variant === 'compact';
  const imagePresentation = getBankingImagePresentation(offer.bankName);
  const requiredDirectDepositAmount = getBankingRequiredDirectDepositAmount(offer);
  const directDepositMetric = {
    label: 'Direct deposit min',
    value: !offer.directDeposit.required
      ? 'none'
      : typeof requiredDirectDepositAmount === 'number'
        ? `${formatBankingCurrency(requiredDirectDepositAmount)}+`
        : 'Required',
    tone: (!offer.directDeposit.required ? 'positive' : 'default') as
      | 'default'
      | 'positive'
      | 'warning'
      | 'negative'
  };
  const noDirectDeposit = !offer.directDeposit.required;
  const stateLimited = offer.stateRestrictions && offer.stateRestrictions.length > 0;
  const decisionMetrics = [
    directDepositMetric,
    ...getBankingDecisionMetrics(offer).filter(
      (metric) =>
        metric.label !== 'Activity req.' &&
        metric.label !== 'Direct deposit' &&
        metric.label !== 'Hold period' &&
        metric.label !== 'Fee'
    )
  ];

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface p-5 shadow-[0_0_16px_rgba(45,212,191,0.04)] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:z-10 focus-within:z-10 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.02] motion-safe:focus-within:-translate-y-2 motion-safe:focus-within:scale-[1.02] hover:border-brand-teal/55 hover:bg-bg-elevated/90 hover:shadow-[0_24px_60px_rgba(4,10,18,0.6),0_0_44px_rgba(45,212,191,0.2)] focus-within:border-brand-teal/55 focus-within:bg-bg-elevated/90 focus-within:shadow-[0_24px_60px_rgba(4,10,18,0.6),0_0_44px_rgba(45,212,191,0.2)] ${
        isCompact ? 'p-4' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.28),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
      />

      {/* Badges — top corners */}
      {noDirectDeposit && (
        <div className="absolute top-3 left-3 z-20 rounded-full border border-emerald-300/20 bg-emerald-400/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/90 backdrop-blur-sm">
          No direct deposit
        </div>
      )}
      {stateLimited && (
        <div className="absolute top-3 right-3 z-20 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
          State-limited
        </div>
      )}

      {/* Bank logo */}
      <div className="relative z-10 mb-4 overflow-hidden rounded-xl transition-transform duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.05] motion-safe:group-focus-within:-translate-y-0.5 motion-safe:group-focus-within:scale-[1.05]">
        <EntityImage
          src={offer.imageUrl}
          alt={`${offer.bankName} logo`}
          label={offer.bankName}
          className={isCompact ? 'h-[104px] w-full' : 'h-[124px] w-full sm:h-[132px]'}
          imgClassName={imagePresentation?.imgClassName ?? 'bg-black/10 px-6 py-4'}
          fallbackClassName="bg-black/10"
          fallbackVariant="wordmark"
          fallbackTextClassName={isCompact ? 'px-3 text-lg sm:text-xl' : 'px-3 text-xl sm:text-2xl'}
          fit={imagePresentation?.fit}
          position={imagePresentation?.position}
          scale={imagePresentation?.scale ?? 1.04}
        />
      </div>

      <div className={`relative z-10 mt-1 ${isCompact ? 'min-h-[7.6rem]' : 'min-h-[8.35rem]'}`}>
        {/* Bonus — the hero */}
        <div className="flex flex-col items-center text-center">
          <p
            className={`inline-flex min-h-11 items-center justify-center rounded-full border border-brand-teal/10 bg-brand-teal/[0.045] px-4 py-2 font-bold text-brand-teal shadow-[0_0_18px_rgba(45,212,191,0.06)] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.025] motion-safe:group-focus-within:scale-[1.025] group-hover:border-brand-teal/35 group-hover:bg-brand-teal/[0.12] group-hover:shadow-[0_0_32px_rgba(45,212,191,0.22)] group-focus-within:border-brand-teal/35 group-focus-within:bg-brand-teal/[0.12] group-focus-within:shadow-[0_0_32px_rgba(45,212,191,0.22)] ${
              isCompact ? 'text-xl' : 'text-2xl'
            }`}
          >
            +{formatBankingCurrency(offer.bonusAmount)} bonus
          </p>
        </div>

        {/* Offer name */}
        <div className="mt-2 px-2">
          <button
            type="button"
            onClick={() => onOpenDetail?.(offer.slug)}
            className="line-clamp-3 block w-full text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
          >
            {offer.offerName}
          </button>
          <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-text-muted">
            {formatBankingCustomerType(offer.customerType)}{' '}
            {offer.accountType === 'bundle' ? 'bundle' : offer.accountType}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 overflow-hidden rounded-xl border border-white/5 bg-bg/40">
        {decisionMetrics.map((metric, metricIndex) => {
          const metricLabel = metric.label === 'Opening deposit' ? 'Min deposit' : metric.label;

          return (
            <div
              key={metric.label}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 ${
                metricIndex > 0 ? 'border-t border-white/5' : ''
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                {metricLabel}
              </p>
              <p
                className={`text-right text-sm font-semibold ${
                  metric.tone === 'positive'
                    ? 'text-brand-teal'
                    : metric.tone === 'warning'
                      ? 'text-brand-gold'
                      : metric.tone === 'negative'
                        ? 'text-brand-coral'
                        : 'text-text-primary'
                }`}
              >
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="relative z-10 mt-auto mt-4 border-t border-white/5 pt-4">
        {isCompact ? (
          <button
            type="button"
            onClick={() => onOpenDetail?.(offer.slug)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
          >
            Details
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenDetail?.(offer.slug)}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
            >
              Details
            </button>
            <Link
              href={buildSelectedOfferIntentHref({
                lane: 'banking',
                slug: offer.slug,
                audience: offer.customerType === 'business' ? 'business' : undefined,
                sourcePath: planSourcePath ?? '/banking'
              })}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-teal px-3 py-2 text-center text-xs font-semibold text-black transition hover:opacity-90"
            >
              <span className="leading-tight">
                Add to
                <br />
                my plan
              </span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
