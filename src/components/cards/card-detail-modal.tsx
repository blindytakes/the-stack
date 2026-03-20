'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import type { CardDetail } from '@/lib/cards';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { EntityImage } from '@/components/ui/entity-image';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardDetailModalProps = {
  slug: string;
  onClose: () => void;
};

export function CardDetailModal({ slug, onClose }: CardDetailModalProps) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`/api/cards/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setCard(data.card ?? data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

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

  const imagePresentation = getCardImagePresentation(slug);
  const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';

  const formatCreditTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const formatForeignFee = (fee: number) => {
    if (fee === 0) return 'None';
    return `${fee}%`;
  };

  const spendPeriod = card?.bestSignUpBonusSpendPeriodDays
    ? `${Math.max(1, Math.round(card.bestSignUpBonusSpendPeriodDays / 30))} mo`
    : null;

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

        {loading && (
          <div className="flex items-center justify-center p-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="p-12 text-center">
            <p className="text-text-secondary">Failed to load card details.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary"
            >
              Close
            </button>
          </div>
        )}

        {card && (
          <div className="p-6 md:p-8">
            {/* Header: Card image + name + bonus */}
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {/* Card image */}
              <div className="w-48 shrink-0 overflow-hidden rounded-xl">
                <EntityImage
                  src={card.imageUrl}
                  alt={`${card.name} card art`}
                  label={card.name}
                  className="aspect-[1.586/1]"
                  imgClassName={imageClassName}
                  fallbackClassName="bg-black/10"
                  fit={imagePresentation?.fit}
                  position={imagePresentation?.position}
                  scale={imagePresentation?.scale}
                />
              </div>

              {/* Name + bonus */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{card.issuer}</p>
                <h2 className="mt-1 font-heading text-xl font-bold text-text-primary">{card.name}</h2>

                {/* Bonus hero */}
                {card.bestSignUpBonusValue && card.bestSignUpBonusValue > 0 && (
                  <div className="mt-3">
                    <p className="text-3xl font-bold text-brand-teal">
                      +${Math.round(card.bestSignUpBonusValue).toLocaleString()} bonus
                    </p>
                    {card.bestSignUpBonusSpendRequired && spendPeriod && (
                      <p className="mt-1 text-xs text-text-muted">
                        Spend ${card.bestSignUpBonusSpendRequired.toLocaleString()} in {spendPeriod}
                      </p>
                    )}
                  </div>
                )}

                {/* Apply CTA */}
                {(card.affiliateUrl || card.applyUrl) && (
                  <a
                    href={card.affiliateUrl || card.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-teal/90"
                  >
                    Apply Now →
                  </a>
                )}
              </div>
            </div>

            {/* Stat pills */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Annual Fee</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {card.annualFee === 0 ? 'No fee' : `$${card.annualFee}`}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Credit</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {formatCreditTier(card.creditTierMin)}+
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Type</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {card.cardType === 'business' ? 'Business' : 'Personal'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Foreign Fees</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {formatForeignFee(card.foreignTxFee)}
                </p>
              </div>
            </div>

            {/* Earn rates */}
            {card.rewards.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted">How You Earn</h3>
                <div className="mt-3 space-y-2">
                  {card.rewards.slice(0, 4).map((reward, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-bg-elevated px-4 py-2.5"
                    >
                      <span className="text-sm text-text-secondary capitalize">{reward.category}</span>
                      <span className="text-sm font-bold text-brand-teal">
                        {reward.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top perks — just names, no descriptions */}
            {card.benefits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted">Top Perks</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.benefits.slice(0, 5).map((benefit, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary"
                    >
                      {benefit.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Good fit / Think twice */}
            {(card.pros?.length || card.cons?.length) ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {card.pros && card.pros.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      Good fit if
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {card.pros.slice(0, 4).map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {card.cons && card.cons.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                      Think twice if
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {card.cons.slice(0, 4).map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Estimated first-year value */}
            {card.totalBenefitsValue > 0 && (
              <div className="mt-6 rounded-xl border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Estimated First-Year Value
                </p>
                <p className="mt-1 text-2xl font-bold text-brand-teal">
                  +${Math.round(card.totalBenefitsValue - card.annualFee).toLocaleString()}
                </p>
              </div>
            )}

            {/* Bottom actions */}
            <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/cards/${card.slug}`}
                className="text-sm text-text-muted transition hover:text-brand-teal"
              >
                View full details →
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={buildSelectedOfferIntentHref({ lane: 'cards', slug: card.slug })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Include this card in my bonus plan
                </Link>
                {(card.affiliateUrl || card.applyUrl) && (
                  <a
                    href={card.affiliateUrl || card.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-brand-teal transition hover:border-brand-teal/40 hover:text-brand-teal/80"
                  >
                    Apply Now
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
