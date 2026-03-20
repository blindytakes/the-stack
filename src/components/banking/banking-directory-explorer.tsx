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
    query,
    accountType,
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
    setQuery,
    setAccountType,
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

  return (
    <div>
      <BankingDirectoryFilterPanel
        activeFilterCount={activeFilterCount}
        activeFilterChips={activeFilterChips}
        query={query}
        accountType={accountType}
        directDeposit={directDeposit}
        apy={apy}
        difficulty={difficulty}
        cashRequirement={cashRequirement}
        timeline={timeline}
        stateLimited={stateLimited}
        state={state}
        sortBy={sortBy}
        onQueryChange={setQuery}
        onAccountTypeChange={setAccountType}
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
        offers={filteredSortedOffers}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
