'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CardRecord } from '@/lib/cards';
import {
  formatBonusValue,
  formatSpendCategoryLabel,
  formatSpendRequirement
} from '@/lib/cards-directory-explorer';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { EntityImage } from '@/components/ui/entity-image';
import { CardDetailModal } from '@/components/cards/card-detail-modal';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardsDirectoryResultsProps = {
  cards: CardRecord[];
  activeFilterCount: number;
  selectedCompare: string[];
  onClearFilters: () => void;
};

export function CardsDirectoryResults({
  cards,
  activeFilterCount,
  selectedCompare,
  onClearFilters
}: CardsDirectoryResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const modalSlug = searchParams.get('card');

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          Clear filters
        </button>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mt-6">
      {activeFilterCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => {
          const selectedForCompare = selectedCompare.includes(card.slug);
          const imagePresentation = getCardImagePresentation(card.slug);
          const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';
          const spendRequirement = formatSpendRequirement(card);
          const topCategories = card.topCategories.filter((category) => category !== 'other');
          const annualFeeLabel =
            card.annualFee === 0 ? 'No annual fee' : `Annual fee: $${card.annualFee}/yr`;
          const bestCategory = (topCategories.length > 0 ? topCategories : (['all'] as const))[0];

          return (
            <article
              key={card.slug}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-bg-surface p-5 transition-all duration-500 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              } ${
                selectedForCompare
                  ? 'border-brand-teal/45 shadow-[0_0_24px_rgba(45,212,191,0.14)]'
                  : 'border-white/10 shadow-[0_0_16px_rgba(45,212,191,0.04)] hover:-translate-y-1.5 hover:border-brand-teal/30 hover:shadow-[0_4px_32px_rgba(45,212,191,0.14)]'
              }`}
              style={{ transitionDelay: isVisible ? `${Math.min(index, 8) * 80}ms` : '0ms' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_56%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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

              <div className="relative z-10 mb-4 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.02]">
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
              </div>

              <p className="relative z-10 mt-2 min-h-[1.5rem] text-center text-xs font-medium leading-5 text-text-muted">
                {annualFeeLabel}
              </p>

              <p className="relative z-10 mt-1 text-center text-xs text-text-muted">
                {spendRequirement ?? 'See issuer terms for the latest spend requirement.'}
              </p>

              <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-2.5 py-1 text-[11px] text-brand-gold">
                  {formatRewardTypeLabel(card.rewardType)}
                </span>
              </div>

              <div className="relative z-10 mt-3 flex justify-center">
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-text-secondary">
                  {formatBestCategoryLabel(bestCategory)}
                </span>
              </div>

              <div className="relative z-10 mt-auto mt-4 flex gap-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => openModal(card.slug)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
                >
                  Details
                </button>
                <Link
                  href={buildSelectedOfferIntentHref({ lane: 'cards', slug: card.slug })}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-teal px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90"
                >
                  Add to plan
                </Link>
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
