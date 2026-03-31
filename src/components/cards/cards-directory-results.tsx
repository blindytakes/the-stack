'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CardRecord } from '@/lib/cards';
import {
  formatBonusValue,
  formatSpendCategoryLabel
} from '@/lib/cards-directory-explorer';
import { getCardFallbackLabel } from '@/lib/card-image-fallback';
import { getCardDirectoryMetrics } from '@/lib/cards/presentation-metrics';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';
import { EntityImage } from '@/components/ui/entity-image';
import { CardDetailModal } from '@/components/cards/card-detail-modal';
import { useFirstGridRowReveal } from '@/components/ui/use-first-grid-row-reveal';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardsDirectoryResultsProps = {
  cards: CardRecord[];
  selectedCompare: string[];
};

export function CardsDirectoryResults({
  cards,
  selectedCompare
}: CardsDirectoryResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modalSlug = searchParams.get('card');
  const { gridRef, isVisible, isMeasured, prefersReducedMotion } = useFirstGridRowReveal(
    cards.length
  );
  const [isRevealDelayActive, setIsRevealDelayActive] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion || !isMeasured) {
      setIsRevealDelayActive(false);
      return;
    }

    setIsRevealDelayActive(true);

    if (!isVisible) return;

    const maxIndex = Math.min(cards.length - 1, 15);
    const timeoutId = window.setTimeout(() => {
      setIsRevealDelayActive(false);
    }, 180 + Math.max(maxIndex, 0) * 50 + 220);

    return () => window.clearTimeout(timeoutId);
  }, [cards.length, isMeasured, isVisible, prefersReducedMotion]);

  const openModal = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('card', slug);
      const nextUrl = `${pathname}?${params.toString()}`;
      router.push(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('card');
    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [pathname, router, searchParams]);

  function formatRewardTypeLabel(rewardType: CardRecord['rewardType']) {
    if (rewardType === 'cashback') return 'Cash back';
    if (rewardType === 'miles') return 'Miles';
    return 'Points';
  }

  function formatBestCategoryLabel(category: CardRecord['topCategories'][number]) {
    if (category === 'all') return 'General spend';
    return formatSpendCategoryLabel(category);
  }

  if (cards.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">No cards match these filters</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Try broadening spend fit, issuer, bonus threshold, or annual fee filters.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => {
          const selectedForCompare = selectedCompare.includes(card.slug);
          const imagePresentation = getCardImagePresentation(card.slug, card.imageUrl);
          const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';
          const hasRenderableImage = Boolean(card.imageUrl) && !isLowValueCardImageUrl(card.imageUrl);
          const cardImageSrc = hasRenderableImage ? card.imageUrl : undefined;
          const cardImageLabel = hasRenderableImage
            ? card.name
            : getCardFallbackLabel(card.name, card.issuer);
          const topCategories = card.topCategories.filter((category) => category !== 'other');
          const bestCategory = (topCategories.length > 0 ? topCategories : (['all'] as const))[0];
          const decisionMetrics = getCardDirectoryMetrics(card);
          const shouldReveal = !prefersReducedMotion && isMeasured;
          const transitionDelay =
            shouldReveal && isRevealDelayActive ? 180 + Math.min(index, 15) * 50 : 0;

          return (
            <article
              key={card.slug}
              data-reveal-index={index}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-bg-surface p-5 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out will-change-transform ${
                shouldReveal && !isVisible
                  ? 'translate-y-6 scale-[0.985] opacity-0'
                  : 'translate-y-0 scale-100 opacity-100'
              } ${
                selectedForCompare
                  ? 'border-brand-teal/45 shadow-[0_0_24px_rgba(45,212,191,0.14)] hover:z-10 hover:-translate-y-2 hover:scale-[1.012] hover:border-brand-teal/70 hover:bg-bg-elevated hover:shadow-[0_22px_54px_rgba(4,10,18,0.6),0_0_42px_rgba(45,212,191,0.2)]'
                  : 'border-white/10 shadow-[0_0_16px_rgba(45,212,191,0.04)] hover:z-10 hover:-translate-y-2 hover:scale-[1.012] hover:border-brand-teal/45 hover:bg-bg-elevated hover:shadow-[0_22px_54px_rgba(4,10,18,0.58),0_0_36px_rgba(45,212,191,0.16)]'
              }`}
              style={{ transitionDelay: `${transitionDelay}ms` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.24),transparent_58%)] opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
              />

              {card.cardType === 'business' && (
                <div className="absolute top-3 left-3 z-20 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                  Business
                </div>
              )}
              {card.annualFee === 0 && (
                <div className="absolute top-3 right-3 z-20 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                  No fee
                </div>
              )}

              <div className="relative z-10 mb-4 overflow-hidden rounded-xl transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.035]">
                <EntityImage
                  src={cardImageSrc}
                  alt={`${card.name} card art`}
                  label={cardImageLabel}
                  className="aspect-[1.586/1]"
                  imgClassName={imageClassName}
                  fallbackClassName="bg-black/10"
                  fallbackVariant={hasRenderableImage ? 'initials' : 'wordmark'}
                  fallbackTextClassName="px-4 text-sm sm:text-base"
                  fit={imagePresentation?.fit}
                  position={imagePresentation?.position}
                  scale={imagePresentation?.scale}
                />
              </div>

              <div className="relative z-10 mt-1 text-center">
                <p className="text-2xl font-bold text-brand-teal">
                  {formatBonusValue(card.bestSignUpBonusValue)}
                </p>
              </div>

              <div className="relative z-10 mt-3 min-h-[2.5rem] px-2">
                <button
                  type="button"
                  onClick={() => openModal(card.slug)}
                  className="block w-full text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
                >
                  {card.name}
                </button>
                <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  {formatRewardTypeLabel(card.rewardType)} · {formatBestCategoryLabel(bestCategory)}
                </p>
              </div>

              <div className="relative z-10 mt-auto pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {decisionMetrics.map((metric, metricIndex) => (
                    <div
                      key={metric.label}
                      className={`flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-white/5 bg-bg/40 px-3 py-3 text-center ${
                        metric.fullWidth || metricIndex === decisionMetrics.length - 1 ? 'col-span-2' : ''
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                        {metric.label}
                      </p>
                      <p
                        className={`mt-2 text-[1.05rem] font-semibold leading-tight ${
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
                      {metric.supportingText ? (
                        <p
                          className={`mt-1 leading-4 ${
                            metric.supportingTone === 'emphasized'
                              ? 'text-[13px] font-medium text-text-secondary'
                              : 'text-[11px] text-text-muted'
                          }`}
                        >
                          {metric.supportingText}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => openModal(card.slug)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    Details
                  </button>
                  <Link
                    href={buildSelectedOfferIntentHref({
                      lane: 'cards',
                      slug: card.slug,
                      audience: card.cardType === 'business' ? 'business' : undefined
                    })}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-brand-teal px-3 py-2 text-center text-xs font-semibold text-black transition hover:opacity-90"
                  >
                    <span className="block leading-[1.15]">
                      Add to
                      <br />
                      my plan
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {modalSlug && (
        <CardDetailModal slug={modalSlug} onClose={closeModal} />
      )}
    </section>
  );
}
