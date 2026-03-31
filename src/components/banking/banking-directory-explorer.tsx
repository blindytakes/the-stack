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
    accountType,
    customerType,
    directDeposit,
    apy,
    difficulty,
    cashRequirement,
    timeline,
    stateLimited,
    state,
    sortBy,
    filteredSortedOffers,
    activeFilterCount,
    activeFilterChips,
    setAccountType,
    setCustomerType,
    setDirectDeposit,
    setApy,
    setDifficulty,
    setCashRequirement,
    setTimeline,
    setStateLimited,
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
        accountType={accountType}
        customerType={customerType}
        directDeposit={directDeposit}
        apy={apy}
        difficulty={difficulty}
        cashRequirement={cashRequirement}
        timeline={timeline}
        stateLimited={stateLimited}
        state={state}
        sortBy={sortBy}
        onAccountTypeChange={setAccountType}
        onCustomerTypeChange={setCustomerType}
        onDirectDepositChange={setDirectDeposit}
        onApyChange={setApy}
        onDifficultyChange={setDifficulty}
        onCashRequirementChange={setCashRequirement}
        onTimelineChange={setTimeline}
        onStateLimitedChange={setStateLimited}
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
