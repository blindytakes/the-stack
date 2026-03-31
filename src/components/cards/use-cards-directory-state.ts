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
  type CardTypeFilterValue,
  type ForeignFeeFilterValue,
  type RewardTypeFilterValue,
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
  const [foreignFee, setForeignFee] = useState<ForeignFeeFilterValue>(initialFilters.foreignFee);
  const [rewardType, setRewardType] = useState<RewardTypeFilterValue>(initialFilters.rewardType);
  const [cardType, setCardType] = useState<CardTypeFilterValue>(initialFilters.cardType);
  const [sortBy, setSortBy] = useState<SortValue>(initialFilters.sortBy);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const filters = useMemo(
    () => ({
      issuer,
      spendCategory,
      foreignFee,
      rewardType,
      bonusFilter: defaultCardsDirectoryFilters.bonusFilter,
      maxFee: defaultCardsDirectoryFilters.maxFee,
      cardType,
      sortBy
    }),
    [cardType, foreignFee, issuer, rewardType, sortBy, spendCategory]
  );

  useEffect(() => {
    const nextFilters = parseCardsDirectoryFilters(new URLSearchParams(searchParamsString), issuerOptions);

    setIssuer(nextFilters.issuer);
    setSpendCategory(nextFilters.spendCategory);
    setForeignFee(nextFilters.foreignFee);
    setRewardType(nextFilters.rewardType);
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
    setIssuer(defaultCardsDirectoryFilters.issuer);
    setSpendCategory(defaultCardsDirectoryFilters.spendCategory);
    setForeignFee(defaultCardsDirectoryFilters.foreignFee);
    setRewardType(defaultCardsDirectoryFilters.rewardType);
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
    issuer,
    spendCategory,
    foreignFee,
    rewardType,
    cardType,
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
    setForeignFee,
    setRewardType,
    setCardType,
    setSortBy,
    clearFilters,
    toggleCompare,
    clearCompare
  };
}
