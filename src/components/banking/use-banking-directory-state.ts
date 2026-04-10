'use client';

import { useCallback, useMemo } from 'react';
import type { BankingBonusListItem, BankingBonusesSort } from '@/lib/banking-bonuses';
import {
  type ApyFilterValue,
  type BankingActiveFilterChip,
  type BankingDirectoryFilters,
  buildActiveBankingFilterChips,
  buildBankingDirectorySearchParams,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  filterAndSortBankingOffers,
  parseBankingDirectoryFilters,
  type BankingDirectoryFilterKey,
  type CashRequirementFilterValue,
  type CustomerTypeFilterValue,
  type DirectDepositFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';
import { useUrlSyncedFilters } from '@/components/directory/use-url-synced-filters';

type BankingDirectoryStateOptions = {
  defaultFilters?: BankingDirectoryFilters;
  parseFilters?: (searchParams: URLSearchParams) => BankingDirectoryFilters;
  buildSearchParams?: (
    currentSearchParams: URLSearchParams,
    filters: BankingDirectoryFilters
  ) => URLSearchParams;
  countActiveFilters?: (filters: BankingDirectoryFilters) => number;
  buildActiveFilterChips?: (
    filters: BankingDirectoryFilters
  ) => BankingActiveFilterChip[];
  isActive?: boolean;
};

export function useBankingDirectoryState(
  offers: BankingBonusListItem[],
  initialSearchParams: string,
  options: BankingDirectoryStateOptions = {}
) {
  const defaultFilters = options.defaultFilters ?? defaultBankingDirectoryFilters;
  const parseFilters = useCallback(
    (searchParams: URLSearchParams) =>
      (options.parseFilters ?? parseBankingDirectoryFilters)(searchParams),
    [options.parseFilters]
  );
  const buildSearchParams = useCallback(
    (currentSearchParams: URLSearchParams, filters: BankingDirectoryFilters) =>
      (options.buildSearchParams ?? buildBankingDirectorySearchParams)(
        currentSearchParams,
        filters
      ),
    [options.buildSearchParams]
  );
  const { filters, setFilters } = useUrlSyncedFilters({
    initialSearchParams,
    parse: parseFilters,
    build: buildSearchParams,
    isActive: options.isActive
  });

  const updateFilter = useCallback(
    <TKey extends keyof BankingDirectoryFilters>(
      key: TKey,
      value: BankingDirectoryFilters[TKey]
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [setFilters]
  );

  const filteredSortedOffers = useMemo(
    () => filterAndSortBankingOffers(offers, filters),
    [filters, offers]
  );

  const activeFilterCount = useMemo(
    () => (options.countActiveFilters ?? countActiveBankingDirectoryFilters)(filters),
    [filters, options.countActiveFilters]
  );

  const activeFilterChips = useMemo(
    () => (options.buildActiveFilterChips ?? buildActiveBankingFilterChips)(filters),
    [filters, options.buildActiveFilterChips]
  );

  function clearFilters() {
    setFilters(defaultFilters);
  }

  function removeFilter(key: BankingDirectoryFilterKey) {
    if (key === 'accountType') updateFilter('accountType', defaultFilters.accountType);
    if (key === 'customerType') updateFilter('customerType', defaultFilters.customerType);
    if (key === 'directDeposit') updateFilter('directDeposit', defaultFilters.directDeposit);
    if (key === 'apy') updateFilter('apy', defaultFilters.apy);
    if (key === 'difficulty') updateFilter('difficulty', defaultFilters.difficulty);
    if (key === 'cashRequirement') updateFilter('cashRequirement', defaultFilters.cashRequirement);
    if (key === 'timeline') updateFilter('timeline', defaultFilters.timeline);
    if (key === 'stateLimited') updateFilter('stateLimited', defaultFilters.stateLimited);
    if (key === 'state') updateFilter('state', defaultFilters.state);
  }

  return {
    filters,
    customerType: filters.customerType,
    directDeposit: filters.directDeposit,
    apy: filters.apy,
    cashRequirement: filters.cashRequirement,
    timeline: filters.timeline,
    state: filters.state,
    sortBy: filters.sortBy,
    filteredSortedOffers,
    activeFilterCount,
    activeFilterChips,
    setCustomerType: (value: CustomerTypeFilterValue) => updateFilter('customerType', value),
    setDirectDeposit: (value: DirectDepositFilterValue) => updateFilter('directDeposit', value),
    setApy: (value: ApyFilterValue) => updateFilter('apy', value),
    setCashRequirement: (value: CashRequirementFilterValue) =>
      updateFilter('cashRequirement', value),
    setTimeline: (value: TimelineFilterValue) => updateFilter('timeline', value),
    setState: (value: string) => updateFilter('state', value),
    setSortBy: (value: BankingBonusesSort) => updateFilter('sortBy', value),
    clearFilters,
    removeFilter
  };
}
