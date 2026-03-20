'use client';

import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingCurrency,
  getBankingOfferPrimaryRequirement,
  getBankingOfferPrimaryConstraint,
  getBankingOfferTimeline,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type BankingDetailModalProps = {
  offer: BankingBonusListItem;
  onClose: () => void;
};

function formatApyDate(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function BankingDetailModal({ offer, onClose }: BankingDetailModalProps) {
  const imagePresentation = getBankingImagePresentation(offer.bankName);
  const primaryRequirement = getBankingOfferPrimaryRequirement(offer);
  const primaryConstraint = getBankingOfferPrimaryConstraint(offer);
  const timeline = getBankingOfferTimeline(offer);
  const apyAsOfLabel = formatApyDate(offer.apyAsOf);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const noDirectDeposit = !offer.directDeposit.required;
  const stateLimited =
    offer.stateRestrictions && offer.stateRestrictions.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-bg-surface shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-text-muted transition hover:bg-black/60 hover:text-text-primary"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {/* Header: Bank logo + name + bonus */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* Bank logo */}
            <div className="w-48 shrink-0 overflow-hidden rounded-xl">
              <EntityImage
                src={offer.imageUrl}
                alt={`${offer.bankName} logo`}
                label={offer.bankName}
                className="h-[120px] w-full"
                imgClassName={imagePresentation?.imgClassName ?? 'bg-black/10 px-6 py-4'}
                fallbackClassName="bg-black/10"
                fallbackVariant="wordmark"
                fallbackTextClassName="px-3 text-xl"
                fit={imagePresentation?.fit}
                position={imagePresentation?.position}
                scale={imagePresentation?.scale ?? 1.04}
              />
            </div>

            {/* Name + bonus */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{offer.bankName}</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-text-primary">{offer.offerName}</h2>

              {/* Bonus hero */}
              <div className="mt-3">
                <p className="text-3xl font-bold text-brand-teal">
                  +{formatBankingCurrency(offer.estimatedNetValue)} bonus
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatBankingCurrency(offer.bonusAmount)} gross
                  {timeline.isKnown ? ` · ${timeline.shortLabel}` : ''}
                </p>
              </div>

              {/* Apply CTA */}
              {(offer.affiliateUrl || offer.offerUrl) && (
                <a
                  href={offer.affiliateUrl || offer.offerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-teal/90"
                >
                  Open Account →
                </a>
              )}
            </div>
          </div>

          {/* Stat pills */}
          <div
            className={`mt-6 grid grid-cols-2 gap-2 ${
              offer.apyDisplay ? 'md:grid-cols-5' : 'md:grid-cols-4'
            }`}
          >
            <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Account</p>
              <p className="mt-1 text-sm font-semibold capitalize text-text-primary">
                {offer.accountType}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Direct Deposit</p>
              <p className={`mt-1 text-sm font-semibold ${noDirectDeposit ? 'text-emerald-400' : 'text-text-primary'}`}>
                {noDirectDeposit ? 'Not required' : 'Required'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Opening Deposit</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {offer.minimumOpeningDeposit
                  ? formatBankingCurrency(offer.minimumOpeningDeposit)
                  : 'No minimum listed'}
              </p>
            </div>
            {offer.apyDisplay ? (
              <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">APY</p>
                <p className="mt-1 text-sm font-semibold text-brand-gold">{offer.apyDisplay}</p>
              </div>
            ) : null}
            <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Hold Period</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {offer.holdingPeriodDays
                  ? `${Math.round(offer.holdingPeriodDays / 30)} months`
                  : 'None'}
              </p>
            </div>
          </div>

          {/* What it takes + Main constraint */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                What it takes
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {primaryRequirement}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                Main constraint
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {primaryConstraint}
              </p>
            </div>
          </div>

          {/* Required actions */}
          {offer.requiredActions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted">Required Steps</h3>
              <ul className="mt-3 space-y-1.5">
                {offer.requiredActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] text-text-muted">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* State restrictions */}
          {stateLimited && (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                State-limited
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Available in: {offer.stateRestrictions!.join(', ')}
              </p>
            </div>
          )}

          {/* Net value breakdown */}
          <div className="mt-6 rounded-xl border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Estimated Net Value
            </p>
            <p className="mt-1 text-2xl font-bold text-brand-teal">
              +{formatBankingCurrency(offer.estimatedNetValue)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {formatBankingCurrency(offer.bonusAmount)} bonus − {formatBankingCurrency(offer.estimatedFees)} est. fees
            </p>
          </div>

          {offer.apyDisplay && offer.apySourceUrl ? (
            <div className="mt-4 text-center text-xs text-text-muted">
              <a
                href={offer.apySourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold transition hover:text-brand-gold/80"
              >
                View current APY source
              </a>
              {apyAsOfLabel ? ` · Rate as of ${apyAsOfLabel}` : ''}
            </div>
          ) : null}

          {/* Bottom actions */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/banking/${offer.slug}`}
              className="text-sm text-text-muted transition hover:text-brand-teal"
            >
              View full steps →
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={buildSelectedOfferIntentHref({ lane: 'banking', slug: offer.slug })}
                className="inline-flex items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Include this bank in my bonus plan
              </Link>
              {(offer.affiliateUrl || offer.offerUrl) && (
                <a
                  href={offer.affiliateUrl || offer.offerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-brand-teal transition hover:border-brand-teal/40 hover:text-brand-teal/80"
                >
                  Open Account
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
