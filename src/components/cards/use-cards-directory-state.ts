'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CardRecord } from '@/lib/cards';
import {
  buildCardsDirectoryCompareHref,
  buildCardsDirectorySearchParams,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  filterAndSortCards,
  parseCardsDirectoryFilters,
  type CardsDirectoryFilters,
  type CardTypeFilterValue,
  type ForeignFeeFilterValue,
  type IssuerOption,
  type RewardTypeFilterValue,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';
import { useUrlSyncedFilters } from '@/components/directory/use-url-synced-filters';

type CardsDirectoryStateOptions = {
  defaultFilters?: CardsDirectoryFilters;
  parseFilters?: (
    searchParams: URLSearchParams,
    issuerOptions: IssuerOption[]
  ) => CardsDirectoryFilters;
  buildSearchParams?: (
    currentSearchParams: URLSearchParams,
    filters: CardsDirectoryFilters
  ) => URLSearchParams;
  countActiveFilters?: (filters: CardsDirectoryFilters) => number;
  isActive?: boolean;
};

export function useCardsDirectoryState(
  cards: CardRecord[],
  initialSearchParams: string,
  options: CardsDirectoryStateOptions = {}
) {
  const issuerOptions = useMemo(() => buildIssuerOptions(cards), [cards]);
  const defaultFilters = options.defaultFilters ?? defaultCardsDirectoryFilters;
  const parseFilters = useCallback(
    (searchParams: URLSearchParams) =>
      (options.parseFilters ?? parseCardsDirectoryFilters)(searchParams, issuerOptions),
    [issuerOptions, options.parseFilters]
  );
  const buildSearchParams = useCallback(
    (currentSearchParams: URLSearchParams, filters: CardsDirectoryFilters) =>
      (options.buildSearchParams ?? buildCardsDirectorySearchParams)(
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
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const updateFilter = useCallback(
    <TKey extends keyof CardsDirectoryFilters>(
      key: TKey,
      value: CardsDirectoryFilters[TKey]
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [setFilters]
  );

  const filteredSortedCards = useMemo(() => filterAndSortCards(cards, filters), [cards, filters]);

  const selectedCompareCards = useMemo(
    () =>
      selectedCompare
        .map((slug) => cards.find((card) => card.slug === slug))
        .filter((card): card is CardRecord => Boolean(card)),
    [cards, selectedCompare]
  );

  const compareHref = useMemo(
    () => buildCardsDirectoryCompareHref(selectedCompare),
    [selectedCompare]
  );

  const activeFilterCount = useMemo(
    () => (options.countActiveFilters ?? countActiveCardsDirectoryFilters)(filters),
    [filters, options.countActiveFilters]
  );

  function clearFilters() {
    setFilters(defaultFilters);
  }

  function toggleCompare(slug: string) {
    setSelectedCompare((prev) => {
      if (prev.includes(slug)) {
        setCompareError('');
        return prev.filter((value) => value !== slug);
      }

      if (prev.length >= 2) {
        setCompareError('Select up to 2 cards for comparison.');
        return prev;
      }

      setCompareError('');
      return [...prev, slug];
    });
  }

  function clearCompare() {
    setSelectedCompare([]);
    setCompareError('');
  }

  return {
    filters,
    issuer: filters.issuer,
    spendCategory: filters.spendCategory,
    foreignFee: filters.foreignFee,
    rewardType: filters.rewardType,
    cardType: filters.cardType,
    sortBy: filters.sortBy,
    selectedCompare,
    compareError,
    issuerOptions,
    filteredSortedCards,
    selectedCompareCards,
    compareHref,
    activeFilterCount,
    setIssuer: (value: string) => updateFilter('issuer', value),
    setSpendCategory: (value: SpendCategoryFilterValue) => updateFilter('spendCategory', value),
    setForeignFee: (value: ForeignFeeFilterValue) => updateFilter('foreignFee', value),
    setRewardType: (value: RewardTypeFilterValue) => updateFilter('rewardType', value),
    setCardType: (value: CardTypeFilterValue) => updateFilter('cardType', value),
    setSortBy: (value: SortValue) => updateFilter('sortBy', value),
    clearFilters,
    toggleCompare,
    clearCompare
  };
}
