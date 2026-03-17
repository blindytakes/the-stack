'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CardRecord } from '@/lib/cards';
import {
  formatBonusValue,
  formatCardType,
  formatSpendRequirement
} from '@/lib/cards-directory-explorer';
import { normalizeIssuerLabel } from '@/lib/cards-directory';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { EntityImage } from '@/components/ui/entity-image';

type CardsDirectoryResultsProps = {
  cards: CardRecord[];
  selectedCompare: string[];
  onToggleCompare: (slug: string) => void;
  onClearFilters: () => void;
};

export function CardsDirectoryResults({
  cards,
  selectedCompare,
  onToggleCompare,
  onClearFilters
}: CardsDirectoryResultsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
        const spendRequirement = formatSpendRequirement(card);
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
            {/* Fee badge */}
            <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-text-secondary backdrop-blur-sm">
              {card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}
            </div>

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
              {spendRequirement && (
                <p className="mt-1 text-xs text-text-muted">{spendRequirement}</p>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
              <span>{normalizeIssuerLabel(card.issuer)}</span>
              <span className="text-white/20">·</span>
              <span>{formatCardType(card.cardType)}</span>
            </div>

            <Link
              href={`/cards/${card.slug}?src=cards_directory`}
              className="mt-1 block text-center text-sm font-semibold leading-snug text-text-primary transition hover:text-brand-teal"
            >
              {card.name}
            </Link>

            {/* Actions — stacked for separation */}
            <div className="mt-auto flex flex-col gap-2 pt-4">
              <Link
                href={`/cards/${card.slug}?src=cards_directory`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                View details
              </Link>
              <button
                type="button"
                onClick={() => onToggleCompare(card.slug)}
                className={`inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  selectedForCompare
                    ? 'border-brand-teal/50 bg-brand-teal/15 text-brand-teal'
                    : 'border-white/10 text-text-muted hover:border-brand-teal/40 hover:text-brand-teal'
                }`}
              >
                {selectedForCompare ? '✓ Selected to compare' : 'Compare'}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
