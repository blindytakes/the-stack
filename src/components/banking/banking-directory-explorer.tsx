'use client';

import type { BankingBonusListItem } from '@/lib/banking-bonuses';
import { BankingDirectoryFilterPanel } from '@/components/banking/banking-directory-filter-panel';
import { BankingDirectoryResults } from '@/components/banking/banking-directory-results';
import { useBankingDirectoryState } from '@/components/banking/use-banking-directory-state';

type BankingDirectoryExplorerProps = {
  offers: BankingBonusListItem[];
  initialSearchParams: string;
};

export function BankingDirectoryExplorer({
  offers,
  initialSearchParams
}: BankingDirectoryExplorerProps) {
  const {
    customerType,
    directDeposit,
    apy,
    cashRequirement,
    timeline,
    state,
    sortBy,
    filteredSortedOffers,
    activeFilterCount,
    activeFilterChips,
    setCustomerType,
    setDirectDeposit,
    setApy,
    setCashRequirement,
    setTimeline,
    setState,
    setSortBy,
    clearFilters,
    removeFilter
  } = useBankingDirectoryState(offers, initialSearchParams);
  const noDirectDepositCount = offers.filter((offer) => !offer.directDeposit.required).length;
  const numericApyCount = offers.filter((offer) => offer.apyPercent != null).length;

  return (
    <div>
      <BankingDirectoryFilterPanel
        activeFilterCount={activeFilterCount}
        activeFilterChips={activeFilterChips}
        totalOffers={offers.length}
        filteredOffersCount={filteredSortedOffers.length}
        noDirectDepositCount={noDirectDepositCount}
        numericApyCount={numericApyCount}
        customerType={customerType}
        directDeposit={directDeposit}
        apy={apy}
        cashRequirement={cashRequirement}
        timeline={timeline}
        state={state}
        sortBy={sortBy}
        onCustomerTypeChange={setCustomerType}
        onDirectDepositChange={setDirectDeposit}
        onApyChange={setApy}
        onCashRequirementChange={setCashRequirement}
        onTimelineChange={setTimeline}
        onStateChange={setState}
        onSortByChange={setSortBy}
        onRemoveFilter={removeFilter}
        onReset={clearFilters}
      />

      <BankingDirectoryResults
        allOffers={offers}
        offers={filteredSortedOffers}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
