'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BankingOfferCard } from '@/components/banking/banking-offer-card';
import { BankingDetailModal } from '@/components/banking/banking-detail-modal';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';

type BankingOffersGridProps = {
  offers: BankingBonusListItem[];
  source: 'banking_directory' | 'banking_detail';
};

export function BankingOffersGrid({ offers, source }: BankingOffersGridProps) {
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const modalOffer = modalSlug
    ? offers.find((o) => o.slug === modalSlug) ?? null
    : null;

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const newVisible = new Set<number>();
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = Number((entry.target as HTMLElement).dataset.idx);
        if (!isNaN(idx)) newVisible.add(idx);
      }
    });
    if (newVisible.size > 0) {
      setVisibleSet((prev) => {
        const merged = new Set(prev);
        newVisible.forEach((i) => merged.add(i));
        return merged;
      });
    }
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.15
    });
    const cards = grid.querySelectorAll('[data-idx]');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [offers, handleIntersection]);

  return (
    <>
      <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {offers.map((offer, index) => (
          <div
            key={offer.slug}
            data-idx={index}
            className={`transition-all duration-500 ${
              visibleSet.has(index)
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            }`}
            style={{
              transitionDelay: visibleSet.has(index)
                ? `${Math.min(index % 8, 7) * 80}ms`
                : '0ms'
            }}
          >
            <BankingOfferCard
              offer={offer}
              source={source}
              onOpenDetail={setModalSlug}
            />
          </div>
        ))}
      </div>

      {modalOffer && (
        <BankingDetailModal offer={modalOffer} onClose={() => setModalSlug(null)} />
      )}
    </>
  );
}
