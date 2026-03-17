'use client';

import { useState } from 'react';
import { BankingOfferCard } from '@/components/banking/banking-offer-card';
import { BankingDetailModal } from '@/components/banking/banking-detail-modal';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';

type BankingOffersGridProps = {
  offers: BankingBonusListItem[];
  source: 'banking_directory' | 'banking_detail';
};

export function BankingOffersGrid({ offers, source }: BankingOffersGridProps) {
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const modalOffer = modalSlug
    ? offers.find((o) => o.slug === modalSlug) ?? null
    : null;

  return (
    <>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => (
          <BankingOfferCard
            key={offer.slug}
            offer={offer}
            source={source}
            onOpenDetail={setModalSlug}
          />
        ))}
      </div>

      {modalOffer && (
        <BankingDetailModal offer={modalOffer} onClose={() => setModalSlug(null)} />
      )}
    </>
  );
}
