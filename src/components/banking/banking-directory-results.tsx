'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BankingDetailModal } from '@/components/banking/banking-detail-modal';
import { BankingOffersGrid } from '@/components/banking/banking-offers-grid';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';

type BankingDirectoryResultsProps = {
  allOffers: BankingBonusListItem[];
  offers: BankingBonusListItem[];
  activeFilterCount: number;
  onClearFilters: () => void;
};

export function BankingDirectoryResults({
  allOffers,
  offers,
  activeFilterCount,
  onClearFilters
}: BankingDirectoryResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modalSlug = searchParams.get('bank');
  const modalOffer = modalSlug ? allOffers.find((offer) => offer.slug === modalSlug) ?? null : null;

  const openModal = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('bank', slug);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('bank');
    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (modalSlug && !modalOffer) {
      closeModal();
    }
  }, [closeModal, modalOffer, modalSlug]);

  const content =
    offers.length === 0 ? (
      <section className="mt-6 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary">No offers match these filters</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Try broadening direct deposit, cash-needed, or state filters to reopen the full list.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          Clear filters
        </button>
      </section>
    ) : (
      <section className="mt-6">
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

        <BankingOffersGrid offers={offers} onOpenDetail={openModal} />
      </section>
    );

  return (
    <>
      {content}
      {modalOffer && (
        <BankingDetailModal offer={modalOffer} onClose={closeModal} source="banking_directory" />
      )}
    </>
  );
}
