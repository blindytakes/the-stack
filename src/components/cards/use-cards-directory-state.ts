'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CardRecord } from '@/lib/cards';
import {
  buildCardsDirectoryCompareHref,
  buildCardsDirectorySearchParams,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  filterAndSortCards,
  parseCardsDirectoryFilters,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';

export function useCardsDirectoryState(cards: CardRecord[], initialSearchParams: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const hasHydratedFromUrl = useRef(false);
  const issuerOptions = useMemo(() => buildIssuerOptions(cards), [cards]);
  const initialFilters = useMemo(
    () => parseCardsDirectoryFilters(new URLSearchParams(initialSearchParams), issuerOptions),
    [initialSearchParams, issuerOptions]
  );

  const [issuer, setIssuer] = useState(initialFilters.issuer);
  const [spendCategory, setSpendCategory] = useState<SpendCategoryFilterValue>(
    initialFilters.spendCategory
  );
  const [sortBy, setSortBy] = useState<SortValue>(initialFilters.sortBy);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const filters = useMemo(
    () => ({
      issuer,
      spendCategory,
      bonusFilter: defaultCardsDirectoryFilters.bonusFilter,
      maxFee: defaultCardsDirectoryFilters.maxFee,
      cardType: defaultCardsDirectoryFilters.cardType,
      sortBy
    }),
    [issuer, sortBy, spendCategory]
  );

  useEffect(() => {
    const nextFilters = parseCardsDirectoryFilters(new URLSearchParams(searchParamsString), issuerOptions);

    setIssuer(nextFilters.issuer);
    setSpendCategory(nextFilters.spendCategory);
    setSortBy(nextFilters.sortBy);

    hasHydratedFromUrl.current = true;
  }, [issuerOptions, searchParamsString]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;

    const params = buildCardsDirectorySearchParams(new URLSearchParams(searchParamsString), filters);
    const nextQueryString = params.toString();
    if (nextQueryString === searchParamsString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [filters, pathname, router, searchParamsString]);

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
    () => countActiveCardsDirectoryFilters(filters),
    [filters]
  );

  function clearFilters() {
    setIssuer(defaultCardsDirectoryFilters.issuer);
    setSpendCategory(defaultCardsDirectoryFilters.spendCategory);
    setSortBy(defaultCardsDirectoryFilters.sortBy);
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
    issuer,
    spendCategory,
    sortBy,
    selectedCompare,
    compareError,
    issuerOptions,
    filteredSortedCards,
    selectedCompareCards,
    compareHref,
    activeFilterCount,
    setIssuer,
    setSpendCategory,
    setSortBy,
    clearFilters,
    toggleCompare,
    clearCompare
  };
}
