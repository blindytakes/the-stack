'use client';

import { BankingOffersGrid } from '@/components/banking/banking-offers-grid';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';

type BankingDirectoryResultsProps = {
  offers: BankingBonusListItem[];
  onClearFilters: () => void;
};

export function BankingDirectoryResults({
  offers,
  onClearFilters
}: BankingDirectoryResultsProps) {
  if (offers.length === 0) {
    return (
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
    );
  }

  return (
    <section className="mt-6">
      <BankingOffersGrid offers={offers} source="banking_directory" />
    </section>
  );
}
