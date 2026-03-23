'use client';

import { BankingOfferCard } from '@/components/banking/banking-offer-card';
import { useFirstGridRowReveal } from '@/components/ui/use-first-grid-row-reveal';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';

type BankingOffersGridProps = {
  offers: BankingBonusListItem[];
  onOpenDetail: (slug: string) => void;
};

export function BankingOffersGrid({ offers, onOpenDetail }: BankingOffersGridProps) {
  const { gridRef, isVisible, isMeasured, prefersReducedMotion } = useFirstGridRowReveal(
    offers.length
  );

  return (
    <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {offers.map((offer, index) => (
        <div
          key={offer.slug}
          data-reveal-index={index}
          className={`transition-all duration-500 ${
            !prefersReducedMotion && isMeasured && !isVisible
              ? 'translate-y-6 scale-[0.985] opacity-0'
              : 'translate-y-0 scale-100 opacity-100'
          }`}
          style={{
            transitionDelay: `${
              !prefersReducedMotion && isMeasured && isVisible
                ? 180 + Math.min(index, 15) * 50
                : 0
            }ms`
          }}
        >
          <BankingOfferCard offer={offer} onOpenDetail={onOpenDetail} />
        </div>
      ))}
    </div>
  );
}
