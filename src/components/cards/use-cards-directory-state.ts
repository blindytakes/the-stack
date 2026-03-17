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
  type BonusFilterValue,
  type CardTypeFilterValue,
  type FeeFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';

export function useCardsDirectoryState(cards: CardRecord[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const hasHydratedFromUrl = useRef(false);

  const [query, setQuery] = useState(defaultCardsDirectoryFilters.query);
  const [issuer, setIssuer] = useState(defaultCardsDirectoryFilters.issuer);
  const [bonusFilter, setBonusFilter] = useState<BonusFilterValue>(
    defaultCardsDirectoryFilters.bonusFilter
  );
  const [maxFee, setMaxFee] = useState<FeeFilterValue>(defaultCardsDirectoryFilters.maxFee);
  const [cardType, setCardType] = useState<CardTypeFilterValue>(defaultCardsDirectoryFilters.cardType);
  const [sortBy, setSortBy] = useState<SortValue>(defaultCardsDirectoryFilters.sortBy);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const issuerOptions = useMemo(() => buildIssuerOptions(cards), [cards]);

  const filters = useMemo(
    () => ({
      query,
      issuer,
      bonusFilter,
      maxFee,
      cardType,
      sortBy
    }),
    [bonusFilter, cardType, issuer, maxFee, query, sortBy]
  );

  useEffect(() => {
    const nextFilters = parseCardsDirectoryFilters(new URLSearchParams(searchParamsString), issuerOptions);

    setQuery(nextFilters.query);
    setIssuer(nextFilters.issuer);
    setBonusFilter(nextFilters.bonusFilter);
    setMaxFee(nextFilters.maxFee);
    setCardType(nextFilters.cardType);
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
    setQuery(defaultCardsDirectoryFilters.query);
    setIssuer(defaultCardsDirectoryFilters.issuer);
    setBonusFilter(defaultCardsDirectoryFilters.bonusFilter);
    setMaxFee(defaultCardsDirectoryFilters.maxFee);
    setCardType(defaultCardsDirectoryFilters.cardType);
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
    query,
    issuer,
    bonusFilter,
    maxFee,
    cardType,
    sortBy,
    selectedCompare,
    compareError,
    issuerOptions,
    filteredSortedCards,
    selectedCompareCards,
    compareHref,
    activeFilterCount,
    setQuery,
    setIssuer,
    setBonusFilter,
    setMaxFee,
    setCardType,
    setSortBy,
    clearFilters,
    toggleCompare,
    clearCompare
  };
}
