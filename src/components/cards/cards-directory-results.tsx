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
  if (cards.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">No cards match these filters</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Try broadening issuer, bonus threshold, annual fee, or credit profile filters.
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
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const selectedForCompare = selectedCompare.includes(card.slug);
        const spendRequirement = formatSpendRequirement(card);
        const imagePresentation = getCardImagePresentation(card.slug);
        const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';

        return (
          <article
            key={card.slug}
            className={`rounded-2xl border bg-bg-surface p-5 transition ${
              selectedForCompare
                ? 'border-brand-teal/45 shadow-[0_0_20px_rgba(45,212,191,0.1)]'
                : 'border-white/10 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]'
            }`}
          >
            <div className="mb-4">
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
            <p className="text-xs text-text-muted">{normalizeIssuerLabel(card.issuer)}</p>
            <Link
              href={`/cards/${card.slug}?src=cards_directory`}
              className="mt-1 block text-base font-semibold text-text-primary transition hover:text-brand-teal"
            >
              {card.name}
            </Link>
            <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{card.headline}</p>
            <p className="mt-3 text-lg font-bold text-brand-teal">
              {formatBonusValue(card.bestSignUpBonusValue)}
            </p>
            {spendRequirement && <p className="mt-1 text-xs text-text-muted">{spendRequirement}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>{formatCardType(card.cardType)}</span>
              <span className="text-white/20">|</span>
              <span>{card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/cards/${card.slug}?src=cards_directory`}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                View details
              </Link>
              <button
                type="button"
                onClick={() => onToggleCompare(card.slug)}
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedForCompare
                    ? 'border-brand-teal/50 bg-brand-teal/15 text-brand-teal'
                    : 'border-white/10 text-text-secondary hover:border-brand-teal/40 hover:text-brand-teal'
                }`}
              >
                {selectedForCompare ? 'Selected to compare' : 'Select to compare'}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
