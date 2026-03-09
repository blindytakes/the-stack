import Link from 'next/link';
import type { CardRecord } from '@/lib/cards';

type CardsDirectoryCompareBarProps = {
  selectedCompareCards: CardRecord[];
  compareHref: string | null;
  onClear: () => void;
};

export function CardsDirectoryCompareBar({
  selectedCompareCards,
  compareHref,
  onClear
}: CardsDirectoryCompareBarProps) {
  if (selectedCompareCards.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-5">
      <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-teal/40 bg-bg-elevated/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-text-muted">Compare</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {selectedCompareCards.map((card) => (
              <span
                key={card.slug}
                className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-text-secondary"
              >
                {card.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Clear
          </button>
          {compareHref ? (
            <Link
              href={compareHref}
              className="inline-flex items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90"
            >
              Compare selected cards
            </Link>
          ) : (
            <span className="text-xs text-text-muted">Select one more card to compare</span>
          )}
        </div>
      </div>
    </div>
  );
}
