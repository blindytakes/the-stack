'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CardRecord } from '@/lib/cards';
import { formatBonusValue } from '@/lib/cards-directory-explorer';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { EntityImage } from '@/components/ui/entity-image';
import { CardDetailModal } from '@/components/cards/card-detail-modal';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardsDirectoryResultsProps = {
  cards: CardRecord[];
  selectedCompare: string[];
  onClearFilters: () => void;
};

export function CardsDirectoryResults({
  cards,
  selectedCompare,
  onClearFilters
}: CardsDirectoryResultsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modalSlug, setModalSlug] = useState<string | null>(null);

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

  if (cards.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">No cards match these filters</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Try broadening issuer, bonus threshold, or annual fee filters.
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
    <section ref={sectionRef} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card, index) => {
        const selectedForCompare = selectedCompare.includes(card.slug);
        const imagePresentation = getCardImagePresentation(card.slug);
        const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';

        return (
          <article
            key={card.slug}
            className={`group relative flex flex-col rounded-2xl border bg-bg-surface p-5 transition-all duration-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            } ${
              selectedForCompare
                ? 'border-brand-teal/45 shadow-[0_0_24px_rgba(45,212,191,0.14)]'
                : 'border-white/10 shadow-[0_0_16px_rgba(45,212,191,0.04)] hover:-translate-y-1.5 hover:border-brand-teal/30 hover:shadow-[0_4px_32px_rgba(45,212,191,0.14)]'
            }`}
            style={{ transitionDelay: isVisible ? `${Math.min(index, 8) * 80}ms` : '0ms' }}
          >
            {/* Badges — top corners */}
            {card.cardType === 'business' && (
              <div className="absolute top-3 left-3 z-10 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Business
              </div>
            )}
            {card.annualFee === 0 && (
              <div className="absolute top-3 right-3 z-10 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                No fee
              </div>
            )}

            {/* Card image */}
            <div className="mb-4 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.02]">
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

            {/* Bonus — the hero of the card */}
            <div className="mt-1 text-center">
              <p className="text-2xl font-bold text-brand-teal">
                {formatBonusValue(card.bestSignUpBonusValue)}
              </p>
            </div>

            <div className="mt-3 min-h-[2.5rem] px-2">
              <button
                type="button"
                onClick={() => setModalSlug(card.slug)}
                className="block w-full text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
              >
                {card.name}
              </button>
            </div>

            {/* Annual fee — only show text when there IS a fee (no-fee cards already have the badge) */}
            {card.annualFee > 0 && (
              <p className="mt-1.5 text-center text-xs text-text-muted">
                ${card.annualFee}/yr annual fee
              </p>
            )}

            {/* Actions — side by side */}
            <div className="mt-auto flex gap-2 border-t border-white/5 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setModalSlug(card.slug)}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Details
              </button>
              <Link
                href={buildSelectedOfferIntentHref({ lane: 'cards', slug: card.slug })}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-teal px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90"
              >
                Build Full Plan
              </Link>
            </div>
          </article>
        );
      })}

      {/* Detail modal */}
      {modalSlug && (
        <CardDetailModal slug={modalSlug} onClose={() => setModalSlug(null)} />
      )}
    </section>
  );
}
