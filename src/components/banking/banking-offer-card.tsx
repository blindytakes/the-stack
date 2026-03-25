'use client';

import Link from 'next/link';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingCustomerType,
  formatBankingCurrency,
  getBankingOfferPrimaryRequirement,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type BankingOfferCardProps = {
  offer: BankingBonusListItem;
  variant?: 'directory' | 'compact';
  onOpenDetail?: (slug: string) => void;
};

export function BankingOfferCard({
  offer,
  variant = 'directory',
  onOpenDetail
}: BankingOfferCardProps) {
  const isCompact = variant === 'compact';
  const imagePresentation = getBankingImagePresentation(offer.bankName);
  const noDirectDeposit = !offer.directDeposit.required;
  const stateLimited =
    offer.stateRestrictions && offer.stateRestrictions.length > 0;
  const primaryRequirement = getBankingOfferPrimaryRequirement(offer);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface p-5 shadow-[0_0_16px_rgba(45,212,191,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-brand-teal/50 hover:bg-bg-elevated/90 hover:shadow-[0_12px_44px_rgba(45,212,191,0.24)] ${
        isCompact ? 'p-4' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.2),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
      <div className="relative z-10 mb-4 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.035]">
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

      {/* Bonus — the hero */}
      <div className="relative z-10 mt-1 text-center">
        <p className={`font-bold text-brand-teal ${isCompact ? 'text-xl' : 'text-2xl'}`}>
          +{formatBankingCurrency(offer.estimatedNetValue)} bonus
        </p>
        {offer.apyDisplay ? (
          <p className="mt-1 text-xs font-medium text-brand-gold">{offer.apyDisplay}</p>
        ) : null}
      </div>

      {/* Offer name */}
      <div className="relative z-10 mt-3 min-h-[2.5rem] px-2">
        <button
          type="button"
          onClick={() => onOpenDetail?.(offer.slug)}
          className="block w-full text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
        >
          {offer.offerName}
        </button>
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {formatBankingCustomerType(offer.customerType)} {offer.accountType === 'bundle' ? 'bundle' : offer.accountType}
        </p>
      </div>

      {/* Primary requirement */}
      <p className="relative z-10 mt-2 min-h-[2.75rem] px-2 text-center text-xs leading-5 text-text-muted">
        {primaryRequirement}
      </p>

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
              href={buildSelectedOfferIntentHref({ lane: 'banking', slug: offer.slug })}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-teal px-3 py-2 text-center text-xs font-semibold text-black transition hover:opacity-90"
            >
              Add to my plan
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
