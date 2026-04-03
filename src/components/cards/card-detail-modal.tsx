'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import type { CardDetail } from '@/lib/cards';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import {
  formatCardCurrency,
  getCardDecisionMetrics,
  isOffsettingCreditBenefit
} from '@/lib/cards/presentation-metrics';
import { formatSpendCategoryLabel } from '@/lib/cards-directory-explorer';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { EntityImage } from '@/components/ui/entity-image';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardDetailModalProps = {
  slug: string;
  onClose: () => void;
  source?: string;
};

export function CardDetailModal({
  slug,
  onClose,
  source = 'cards_directory'
}: CardDetailModalProps) {
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

  const cardImage = card
    ? getCardImageDisplay({
        slug,
        name: card.name,
        issuer: card.issuer,
        imageUrl: card.imageUrl,
        imageAssetType: card.imageAssetType
      })
    : null;

  const formatRewardRate = (rate: number, rateType: CardDetail['rewardType']) => {
    if (rateType === 'cashback') return `${rate}%`;
    return `${rate}x`;
  };

  const activeBonuses = card?.signUpBonuses.filter((bonus) => bonus.isCurrentOffer !== false) ?? [];
  const bonusCandidates = activeBonuses.length > 0 ? activeBonuses : (card?.signUpBonuses ?? []);
  const primaryBonus = [...bonusCandidates].sort((a, b) => b.bonusValue - a.bonusValue)[0];
  const bestListedOfferValue = primaryBonus?.bonusValue ?? card?.bestSignUpBonusValue ?? 0;
  const offsettingCredits = card?.benefits.filter(isOffsettingCreditBenefit) ?? [];
  const offsettingCreditsValue = card?.offsettingCreditsValue ?? 0;
  const topRewards = card
    ? [...card.rewards]
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 2)
    : [];
  const allSortedBenefits = card
    ? [...card.benefits]
        .sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
    : [];
  const topBenefits = allSortedBenefits.slice(0, 2);
  const remainingBenefitsCount = Math.max(allSortedBenefits.length - topBenefits.length, 0);
  const topCategories = card?.topCategories.filter((category) => category !== 'other') ?? [];
  const displayCategories =
    topCategories.length > 0 ? topCategories.slice(0, 2) : (['all'] as const);
  const summaryCopy = card ? card.description ?? card.headline : '';
  const rewardStyleLabel = card
    ? card.rewardType === 'cashback'
      ? 'Cash back'
      : card.rewardType === 'miles'
        ? 'Miles'
        : 'Points'
    : '';
  const cardStats = card ? getCardDecisionMetrics(card) : [];
  const outboundApplyUrl = card ? card.affiliateUrl ?? card.applyUrl : null;
  const applyHref =
    card && outboundApplyUrl
      ? `/api/affiliate/click?${new URLSearchParams({
          card_slug: card.slug,
          source,
          target: outboundApplyUrl
        }).toString()}`
      : null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[92vh] w-full max-w-[1200px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,33,0.96),rgba(14,16,25,0.98))] shadow-2xl animate-in zoom-in-95 fade-in duration-200">
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
            <TrackFunnelEventOnView
              event="card_detail_view"
              properties={{ source, card_slug: card.slug, path: `/cards?card=${card.slug}` }}
            />

            <div className="grid gap-6 md:grid-cols-[236px_minmax(0,1fr)] md:items-start md:gap-x-10">
              <div className="mx-auto w-full max-w-[236px]">
                <div
                  className={`overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_16px_42px_rgba(0,0,0,0.22)] ${
                    cardImage?.imageAssetType === 'card_art'
                      ? 'bg-black/20 p-0'
                      : 'bg-black/10 p-2.5'
                  }`}
                >
                  <EntityImage
                    src={cardImage?.src}
                    alt={cardImage?.alt ?? `${card.name} card art`}
                    label={cardImage?.label ?? card.name}
                    className="aspect-[1.586/1] rounded-[1.05rem]"
                    imgClassName={cardImage?.presentation.imgClassName}
                    fallbackClassName="bg-black/10"
                    fallbackVariant={cardImage?.fallbackVariant}
                    fit={cardImage?.presentation.fit}
                    position={cardImage?.presentation.position}
                    scale={cardImage?.presentation.scale}
                  />
                </div>

                <div className="mx-auto mt-4 flex w-full max-w-[220px] flex-col gap-3">
                  <Link
                    href={buildSelectedOfferIntentHref({
                      lane: 'cards',
                      slug: card.slug,
                      audience: card.cardType === 'business' ? 'business' : undefined
                    })}
                    className="inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-5 py-3.5 text-base font-semibold text-black transition hover:opacity-90"
                  >
                    Add to my plan
                  </Link>
                  {applyHref && (
                    <AffiliateLink
                      href={applyHref}
                      cardSlug={card.slug}
                      source={source}
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-3.5 text-base font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
                    >
                      View current offer
                    </AffiliateLink>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-text-muted">{card.issuer}</p>
                <h2 className="mt-3 max-w-[24ch] font-heading text-[2.35rem] leading-[0.94] tracking-[-0.02em] text-text-primary md:text-[3.45rem]">
                  {card.name}
                </h2>
                {summaryCopy && (
                  <p className="mt-3.5 max-w-[62ch] text-sm leading-6 text-text-secondary md:text-[15px] md:leading-7">
                    {summaryCopy}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {displayCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-[11px] text-brand-teal"
                    >
                      Best for {formatSpendCategoryLabel(category)}
                    </span>
                  ))}
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                    {rewardStyleLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                    {card.cardType === 'business' ? 'Business card' : 'Personal card'}
                  </span>
                </div>

                <div className="mt-4 md:max-w-[290px]">
                  <div className="rounded-[1.15rem] border border-brand-gold/20 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">
                      Best listed offer
                    </p>
                    <p className="mt-2 text-[2.05rem] font-semibold leading-none text-brand-gold">
                      {bestListedOfferValue > 0 ? formatCardCurrency(bestListedOfferValue) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              {cardStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-bg-elevated/70 px-3.5 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
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
                  <p className="mt-1 text-[11px] leading-4 text-text-muted">
                    {stat.label === 'Offsetting credits' && offsettingCreditsValue > 0
                      ? `${offsettingCredits.length} recurring credit${offsettingCredits.length === 1 ? '' : 's'} found`
                      : stat.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
              <div className="space-y-5">
                {topRewards.length > 0 && (
                  <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                    <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">How You Earn</h3>
                    <div className="mt-3 space-y-2.5">
                      {topRewards.map((reward, index) => (
                        <div
                          key={`${reward.category}-${index}`}
                          className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 px-3.5 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {formatSpendCategoryLabel(reward.category)}
                            </p>
                            {(reward.notes || reward.capAmount != null) && (
                              <p className="mt-1 text-xs leading-5 text-text-secondary">
                                {reward.notes ??
                                  `Up to ${formatCardCurrency(reward.capAmount ?? 0)}${
                                    reward.capPeriod ? `/${reward.capPeriod}` : ''
                                  }`}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-base font-semibold text-brand-teal">
                            {formatRewardRate(reward.rate, reward.rateType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {topBenefits.length > 0 && (
                  <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                    <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Top Perks</h3>
                    <div className="mt-3 space-y-2.5">
                      {topBenefits.map((benefit, index) => (
                        <div
                          key={`${benefit.name}-${index}`}
                          className="rounded-xl border border-white/5 bg-bg/40 px-3.5 py-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-semibold text-text-primary">{benefit.name}</p>
                            {benefit.estimatedValue != null && (
                              <span className="shrink-0 text-sm font-semibold text-brand-teal">
                                ~{formatCardCurrency(benefit.estimatedValue)}/yr
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-text-secondary">
                            {benefit.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    {remainingBenefitsCount > 0 && (
                      <p className="mt-3 text-xs text-text-muted">
                        Plus {remainingBenefitsCount} more listed benefits on the issuer page.
                      </p>
                    )}
                  </section>
                )}
              </div>

              <div className="space-y-5">
                {card.pros && card.pros.length > 0 && (
                  <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                      Good fit if
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {card.pros.slice(0, 4).map((pro, index) => (
                        <li
                          key={`${pro}-${index}`}
                          className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {card.cons && card.cons.length > 0 && (
                  <section className="rounded-[1.35rem] border border-white/10 bg-bg-elevated/60 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
                      Think twice if
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {card.cons.slice(0, 4).map((con, index) => (
                        <li
                          key={`${con}-${index}`}
                          className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
