'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { BankingBonusListItem, BankingBonusesSort } from '@/lib/banking-bonuses';
import {
  type ApyFilterValue,
  buildActiveBankingFilterChips,
  buildBankingDirectorySearchParams,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  filterAndSortBankingOffers,
  parseBankingDirectoryFilters,
  type AccountTypeFilterValue,
  type BankingDirectoryFilterKey,
  type CashRequirementFilterValue,
  type DifficultyFilterValue,
  type DirectDepositFilterValue,
  type StateLimitedFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';

export function useBankingDirectoryState(
  offers: BankingBonusListItem[],
  initialSearchParams: string
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const hasHydratedFromUrl = useRef(false);
  const initialFilters = useMemo(
    () => parseBankingDirectoryFilters(new URLSearchParams(initialSearchParams)),
    [initialSearchParams]
  );

  const [query, setQuery] = useState(initialFilters.query);
  const [accountType, setAccountType] = useState<AccountTypeFilterValue>(initialFilters.accountType);
  const [directDeposit, setDirectDeposit] = useState<DirectDepositFilterValue>(
    initialFilters.directDeposit
  );
  const [apy, setApy] = useState<ApyFilterValue>(initialFilters.apy);
  const [difficulty, setDifficulty] = useState<DifficultyFilterValue>(initialFilters.difficulty);
  const [cashRequirement, setCashRequirement] = useState<CashRequirementFilterValue>(
    initialFilters.cashRequirement
  );
  const [timeline, setTimeline] = useState<TimelineFilterValue>(initialFilters.timeline);
  const [stateLimited, setStateLimited] = useState<StateLimitedFilterValue>(
    initialFilters.stateLimited
  );
  const [state, setState] = useState(initialFilters.state);
  const [sortBy, setSortBy] = useState<BankingBonusesSort>(initialFilters.sortBy);

  const filters = useMemo(
    () => ({
      query,
      accountType,
      directDeposit,
      apy,
      difficulty,
      cashRequirement,
      timeline,
      stateLimited,
      state,
      sortBy
    }),
    [
      accountType,
      apy,
      cashRequirement,
      difficulty,
      directDeposit,
      query,
      sortBy,
      state,
      stateLimited,
      timeline
    ]
  );

  useEffect(() => {
    const nextFilters = parseBankingDirectoryFilters(new URLSearchParams(searchParamsString));

    setQuery(nextFilters.query);
    setAccountType(nextFilters.accountType);
    setDirectDeposit(nextFilters.directDeposit);
    setApy(nextFilters.apy);
    setDifficulty(nextFilters.difficulty);
    setCashRequirement(nextFilters.cashRequirement);
    setTimeline(nextFilters.timeline);
    setStateLimited(nextFilters.stateLimited);
    setState(nextFilters.state);
    setSortBy(nextFilters.sortBy);

    hasHydratedFromUrl.current = true;
  }, [searchParamsString]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;

    const params = buildBankingDirectorySearchParams(new URLSearchParams(searchParamsString), filters);
    const nextQueryString = params.toString();
    if (nextQueryString === searchParamsString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [filters, pathname, router, searchParamsString]);

  const filteredSortedOffers = useMemo(
    () => filterAndSortBankingOffers(offers, filters),
    [filters, offers]
  );

  const activeFilterCount = useMemo(
    () => countActiveBankingDirectoryFilters(filters),
    [filters]
  );

  const activeFilterChips = useMemo(
    () => buildActiveBankingFilterChips(filters),
    [filters]
  );

  function clearFilters() {
    setQuery(defaultBankingDirectoryFilters.query);
    setAccountType(defaultBankingDirectoryFilters.accountType);
    setDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    setApy(defaultBankingDirectoryFilters.apy);
    setDifficulty(defaultBankingDirectoryFilters.difficulty);
    setCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    setTimeline(defaultBankingDirectoryFilters.timeline);
    setStateLimited(defaultBankingDirectoryFilters.stateLimited);
    setState(defaultBankingDirectoryFilters.state);
    setSortBy(defaultBankingDirectoryFilters.sortBy);
  }

  function removeFilter(key: BankingDirectoryFilterKey) {
    if (key === 'query') setQuery(defaultBankingDirectoryFilters.query);
    if (key === 'accountType') setAccountType(defaultBankingDirectoryFilters.accountType);
    if (key === 'directDeposit') setDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    if (key === 'apy') setApy(defaultBankingDirectoryFilters.apy);
    if (key === 'difficulty') setDifficulty(defaultBankingDirectoryFilters.difficulty);
    if (key === 'cashRequirement') setCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    if (key === 'timeline') setTimeline(defaultBankingDirectoryFilters.timeline);
    if (key === 'stateLimited') setStateLimited(defaultBankingDirectoryFilters.stateLimited);
    if (key === 'state') setState(defaultBankingDirectoryFilters.state);
  }

  return {
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
  };
}
