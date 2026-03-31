'use client';

import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingAccountType,
  formatBankingCustomerType,
  formatBankingCurrency,
  getBankingOfferAvailabilityLabel,
  getBankingOfferBestFit,
  getBankingOfferExecutionSummary,
  getBankingOfferPrimaryConstraint,
  getBankingOfferPrimaryRequirement,
  getBankingOfferThinkTwiceIf,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import { getBankingDecisionMetrics } from '@/lib/banking/presentation-metrics';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type BankingDetailModalProps = {
  offer: BankingBonusListItem;
  onClose: () => void;
  source?: string;
};

function formatApyDate(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function formatVerifiedDate(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function formatExpiryDate(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function BankingDetailModal({
  offer,
  onClose,
  source = 'banking_directory'
}: BankingDetailModalProps) {
  const imagePresentation = getBankingImagePresentation(offer.bankName);
  const showApy = Boolean(offer.apyDisplay) && offer.bankName.trim().toLowerCase() !== 'chase';
  const primaryRequirement = getBankingOfferPrimaryRequirement(offer);
  const primaryConstraint = getBankingOfferPrimaryConstraint(offer);
  const executionSummary = getBankingOfferExecutionSummary(offer);
  const bestFitBullets = getBankingOfferBestFit(offer).slice(0, 3);
  const cautionBullets = getBankingOfferThinkTwiceIf(offer).slice(0, 3);
  const checklistItems = offer.requiredActions.length > 0 ? offer.requiredActions : [primaryRequirement];
  const availabilityLabel = getBankingOfferAvailabilityLabel(offer);
  const apyAsOfLabel = formatApyDate(offer.apyAsOf);
  const verifiedLabel = formatVerifiedDate(offer.lastVerified);
  const expiryLabel = formatExpiryDate(offer.expiresAt);
  const isExpired = Boolean(offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now());
  const outboundOfferUrl = offer.affiliateUrl ?? offer.offerUrl;
  const applyHref = outboundOfferUrl
    ? `/api/affiliate/click?${new URLSearchParams({
        card_slug: offer.slug,
        source,
        target: outboundOfferUrl
      }).toString()}`
    : null;
  const statCards = getBankingDecisionMetrics(offer);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[92vh] w-full max-w-[1080px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,33,0.96),rgba(14,16,25,0.98))] shadow-2xl animate-in zoom-in-95 fade-in duration-200">
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

        <TrackFunnelEventOnView
          event="banking_detail_view"
          properties={{ source, bank_slug: offer.slug, path: `/banking?bank=${offer.slug}` }}
        />

        <div className="p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-x-8">
            <aside className="mx-auto w-full max-w-[220px]">
              <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/10 p-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.22)]">
                <EntityImage
                  src={offer.imageUrl}
                  alt={`${offer.bankName} logo`}
                  label={offer.bankName}
                  className="aspect-[1.9/1] rounded-[1.05rem]"
                  imgClassName={imagePresentation?.imgClassName ?? 'bg-black/10 px-6 py-4'}
                  fallbackClassName="bg-black/10"
                  fallbackVariant="wordmark"
                  fallbackTextClassName="px-3 text-xl"
                  fit={imagePresentation?.fit}
                  position={imagePresentation?.position}
                  scale={imagePresentation?.scale ?? 1.04}
                />
              </div>

              <div className="mt-3 flex flex-col gap-2.5">
                <Link
                  href={buildSelectedOfferIntentHref({
                    lane: 'banking',
                    slug: offer.slug,
                    audience: offer.customerType === 'business' ? 'business' : undefined
                  })}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-5 py-3 text-base font-semibold text-black transition hover:opacity-90"
                >
                  Add to my plan
                </Link>
                {applyHref && (
                  <AffiliateLink
                    href={applyHref}
                    cardSlug={offer.slug}
                    source={source}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-3 text-base font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    View current offer
                  </AffiliateLink>
                )}
              </div>

              <div className="mt-3 rounded-[1.15rem] border border-brand-gold/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Gross bonus</p>
                <p className="mt-2 text-[1.9rem] font-semibold leading-none text-brand-gold">
                  {formatBankingCurrency(offer.bonusAmount)}
                </p>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  Est. fees: {formatBankingCurrency(offer.estimatedFees)}
                </p>
              </div>

              {(verifiedLabel || expiryLabel || (showApy && offer.apySourceUrl)) && (
                <div className="mt-3 space-y-2 text-xs leading-5 text-text-muted">
                  {verifiedLabel && <p>Last verified {verifiedLabel}. Confirm live terms before opening.</p>}
                  {expiryLabel && <p>{isExpired ? `Offer expired ${expiryLabel}.` : `Offer ends ${expiryLabel}.`}</p>}
                  {showApy && offer.apySourceUrl && (
                    <p>
                      <a
                        href={offer.apySourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold transition hover:text-brand-gold/80"
                      >
                        View APY source
                      </a>
                      {apyAsOfLabel ? ` · Rate as of ${apyAsOfLabel}` : ''}
                    </p>
                  )}
                </div>
              )}
            </aside>

            <div>
              <section className="rounded-[1.55rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 md:p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-text-muted">{offer.bankName}</p>
                <h2 className="mt-2.5 max-w-[22ch] font-heading text-[2.1rem] leading-[0.94] tracking-[-0.02em] text-text-primary md:max-w-none md:text-[2.8rem] md:whitespace-nowrap xl:text-[3rem]">
                  {offer.offerName}
                </h2>
                <p className="mt-2.5 text-base text-text-primary/90 md:text-lg">{offer.headline}</p>
                <p className="mt-2.5 max-w-[58ch] text-sm leading-6 text-text-secondary">
                  {executionSummary}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                    {formatBankingCustomerType(offer.customerType)}
                  </span>
                  <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-[11px] text-brand-teal">
                    {formatBankingAccountType(offer.accountType)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                    {offer.directDeposit.required ? 'Direct deposit required' : 'No direct deposit'}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                    {availabilityLabel}
                  </span>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                  {statCards.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/10 bg-bg-elevated/70 px-3.5 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
                      <p
                        className={`mt-1.5 text-sm font-semibold ${
                          stat.tone === 'positive'
                            ? 'text-brand-teal'
                            : stat.tone === 'warning'
                              ? 'text-brand-gold'
                              : stat.tone === 'negative'
                                ? 'text-brand-coral'
                                : 'text-text-primary'
                        }`}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-text-muted">{stat.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                    Good fit if
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {bestFitBullets.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-coral">
                    Think twice if
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {(cautionBullets.length > 0 ? cautionBullets : [primaryConstraint]).map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-coral" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section className="mt-4 rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">What it takes</h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{primaryRequirement}</p>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Main constraint</h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{primaryConstraint}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Execution checklist</h3>
                    <ul className="mt-3 space-y-2.5">
                      {checklistItems.map((action, index) => (
                        <li
                          key={`${action}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-white/5 bg-bg/40 px-3.5 py-3 text-sm leading-6 text-text-secondary"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] text-text-muted">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
