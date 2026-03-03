'use client';

import { CardPicker } from '@/components/ui/card-picker';
import { CardVsCardComparison } from '@/components/tools/card-vs-card-sections';
import { useCardVsCardState } from '@/components/tools/card-vs-card-state';

export function CardVsCardTool() {
  const {
    cards,
    loadingCards,
    cardsError,
    slugA,
    setSlugA,
    slugB,
    setSlugB,
    detailA,
    detailB
  } = useCardVsCardState();

  const anyLoading = detailA.loading || detailB.loading;
  const anyError = cardsError || detailA.error || detailB.error;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {loadingCards ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
          <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CardPicker cards={cards} selectedSlug={slugA} onSelect={setSlugA} label="Card 1" />
          <CardPicker cards={cards} selectedSlug={slugB} onSelect={setSlugB} label="Card 2" />
        </div>
      )}

      {anyError && <p className="mt-6 text-sm text-brand-coral">{anyError}</p>}

      {anyLoading && (
        <div className="mt-8 animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-bg-surface" />
          ))}
        </div>
      )}

      {detailA.card && detailB.card && !anyLoading && (
        <CardVsCardComparison a={detailA.card} b={detailB.card} />
      )}
    </section>
  );
}
