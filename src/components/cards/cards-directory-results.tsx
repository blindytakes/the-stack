'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CardRecord } from '@/lib/cards';
import {
  formatBonusValue,
  formatSpendCategoryLabel
} from '@/lib/cards-directory-explorer';
import { getCardDirectoryMetrics } from '@/lib/cards/presentation-metrics';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import { EntityImage } from '@/components/ui/entity-image';
import { useFirstGridRowReveal } from '@/components/ui/use-first-grid-row-reveal';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardsDirectoryResultsProps = {
  cards: CardRecord[];
  selectedCompare: string[];
  detailReturnPath?: string;
  planSourcePath?: string;
};

export function CardsDirectoryResults({
  cards,
  selectedCompare,
  detailReturnPath,
  planSourcePath
}: CardsDirectoryResultsProps) {
  const REVEAL_BASE_DELAY_MS = 80;
  const REVEAL_STAGGER_MS = 40;
  const { gridRef, isVisible, isMeasured, canAnimateEntrance, firstRowIndexes, prefersReducedMotion } =
    useFirstGridRowReveal(cards.length);
  const [isRevealDelayActive, setIsRevealDelayActive] = useState(true);
  const maxRevealIndex = firstRowIndexes.size > 0 ? Math.max(...Array.from(firstRowIndexes)) : 0;

  useEffect(() => {
    if (prefersReducedMotion || !isMeasured) {
      setIsRevealDelayActive(false);
      return;
    }

    setIsRevealDelayActive(true);

    if (!isVisible) return;

    const timeoutId = window.setTimeout(() => {
      setIsRevealDelayActive(false);
    }, REVEAL_BASE_DELAY_MS + Math.max(maxRevealIndex, 0) * REVEAL_STAGGER_MS + 220);

    return () => window.clearTimeout(timeoutId);
  }, [isMeasured, isVisible, maxRevealIndex, prefersReducedMotion]);

  function formatRewardTypeLabel(rewardType: CardRecord['rewardType']) {
    if (rewardType === 'cashback') return 'Cash back';
    if (rewardType === 'miles') return 'Miles';
    return 'Points';
  }

  function formatBestCategoryLabel(category: CardRecord['topCategories'][number]) {
    if (category === 'all') return 'General spend';
    return formatSpendCategoryLabel(category);
  }

  function buildCardDetailHref(slug: string) {
    if (!detailReturnPath) return `/cards/${slug}`;

    return `/cards/${slug}?${new URLSearchParams({ returnTo: detailReturnPath }).toString()}`;
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
          const cardImage = getCardImageDisplay({
            slug: card.slug,
            name: card.name,
            issuer: card.issuer,
            imageUrl: card.imageUrl,
            imageAssetType: card.imageAssetType
          });
          const topCategories = card.topCategories.filter((category) => category !== 'other');
          const bestCategory = (topCategories.length > 0 ? topCategories : (['all'] as const))[0];
          const decisionMetrics = getCardDirectoryMetrics(card);
          const shouldReveal =
            !prefersReducedMotion && isMeasured && canAnimateEntrance && firstRowIndexes.has(index);
          const transitionDelay =
            shouldReveal && isRevealDelayActive
              ? REVEAL_BASE_DELAY_MS + Math.min(index, 15) * REVEAL_STAGGER_MS
              : 0;

          return (
            <article
              key={card.slug}
              data-reveal-index={index}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-bg-surface p-5 transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
                shouldReveal && !isVisible
                  ? 'translate-y-6 scale-[0.985] opacity-0'
                  : 'translate-y-0 scale-100 opacity-100'
              } ${
                selectedForCompare
                  ? 'border-brand-teal/45 shadow-[0_0_24px_rgba(45,212,191,0.14)] hover:z-10 focus-within:z-10 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.02] motion-safe:focus-within:-translate-y-2 motion-safe:focus-within:scale-[1.02] hover:border-brand-teal/75 hover:bg-bg-elevated focus-within:border-brand-teal/75 focus-within:bg-bg-elevated hover:shadow-[0_24px_60px_rgba(4,10,18,0.62),0_0_52px_rgba(45,212,191,0.24)] focus-within:shadow-[0_24px_60px_rgba(4,10,18,0.62),0_0_52px_rgba(45,212,191,0.24)]'
                  : 'border-white/10 shadow-[0_0_16px_rgba(45,212,191,0.04)] hover:z-10 focus-within:z-10 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.02] motion-safe:focus-within:-translate-y-2 motion-safe:focus-within:scale-[1.02] hover:border-brand-teal/55 hover:bg-bg-elevated focus-within:border-brand-teal/55 focus-within:bg-bg-elevated hover:shadow-[0_24px_60px_rgba(4,10,18,0.6),0_0_44px_rgba(45,212,191,0.2)] focus-within:shadow-[0_24px_60px_rgba(4,10,18,0.6),0_0_44px_rgba(45,212,191,0.2)]'
              }`}
              style={{ transitionDelay: `${transitionDelay}ms` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.28),transparent_58%)] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
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

              <div className="relative z-10 mb-4 overflow-hidden rounded-xl transition-transform duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.05] motion-safe:group-focus-within:-translate-y-0.5 motion-safe:group-focus-within:scale-[1.05]">
                <EntityImage
                  src={cardImage.src}
                  alt={cardImage.alt}
                  label={cardImage.label}
                  className="aspect-[1.586/1]"
                  imgClassName={cardImage.presentation.imgClassName}
                  fallbackClassName="bg-black/10"
                  fallbackVariant={cardImage.fallbackVariant}
                  fallbackTextClassName="px-4 text-sm sm:text-base"
                  fit={cardImage.presentation.fit}
                  position={cardImage.presentation.position}
                  scale={cardImage.presentation.scale}
                />
              </div>

              <div className="relative z-10 mt-1 text-center">
                <p className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-teal/10 bg-brand-teal/[0.045] px-4 py-2 text-2xl font-bold text-brand-teal shadow-[0_0_18px_rgba(45,212,191,0.06)] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.025] motion-safe:group-focus-within:scale-[1.025] group-hover:border-brand-teal/35 group-hover:bg-brand-teal/[0.12] group-hover:shadow-[0_0_32px_rgba(45,212,191,0.22)] group-focus-within:border-brand-teal/35 group-focus-within:bg-brand-teal/[0.12] group-focus-within:shadow-[0_0_32px_rgba(45,212,191,0.22)]">
                  {formatBonusValue(card.bestSignUpBonusValue)}
                </p>
              </div>

              <div className="relative z-10 mt-3 min-h-[2.5rem] px-2">
                <Link
                  href={buildCardDetailHref(card.slug)}
                  className="block w-full text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
                >
                  {card.name}
                </Link>
                <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  {formatRewardTypeLabel(card.rewardType)} · {formatBestCategoryLabel(bestCategory)}
                </p>
              </div>

              <div className="relative z-10 mt-auto pt-4">
                <div className="overflow-hidden rounded-xl border border-white/5 bg-bg/40">
                  {decisionMetrics.map((metric, metricIndex) => (
                    <div
                      key={metric.label}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 ${
                        metricIndex > 0 ? 'border-t border-white/5' : ''
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                        {metric.label}
                      </p>
                      <div className="text-right">
                        <p
                          className={`text-[15px] font-semibold leading-tight sm:text-base ${
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
                            className={`mt-0.5 leading-4 ${
                              metric.supportingTone === 'emphasized'
                                ? 'text-[12px] font-medium text-text-secondary'
                                : 'text-[11px] text-text-muted'
                            }`}
                          >
                            {metric.supportingText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                  <Link
                    href={buildCardDetailHref(card.slug)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    Details
                  </Link>
                  <Link
                    href={buildSelectedOfferIntentHref({
                      lane: 'cards',
                      slug: card.slug,
                      audience: card.cardType === 'business' ? 'business' : undefined,
                      sourcePath: planSourcePath
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
    </section>
  );
}
