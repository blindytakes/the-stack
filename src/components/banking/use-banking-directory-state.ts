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
  type CustomerTypeFilterValue,
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

  const [accountType, setAccountType] = useState<AccountTypeFilterValue>(initialFilters.accountType);
  const [customerType, setCustomerType] = useState<CustomerTypeFilterValue>(
    initialFilters.customerType
  );
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
      accountType,
      customerType,
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
      customerType,
      difficulty,
      directDeposit,
      sortBy,
      state,
      stateLimited,
      timeline
    ]
  );

  useEffect(() => {
    const nextFilters = parseBankingDirectoryFilters(new URLSearchParams(searchParamsString));

    setAccountType(nextFilters.accountType);
    setCustomerType(nextFilters.customerType);
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
    setAccountType(defaultBankingDirectoryFilters.accountType);
    setCustomerType(defaultBankingDirectoryFilters.customerType);
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
    if (key === 'accountType') setAccountType(defaultBankingDirectoryFilters.accountType);
    if (key === 'customerType') setCustomerType(defaultBankingDirectoryFilters.customerType);
    if (key === 'directDeposit') setDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    if (key === 'apy') setApy(defaultBankingDirectoryFilters.apy);
    if (key === 'difficulty') setDifficulty(defaultBankingDirectoryFilters.difficulty);
    if (key === 'cashRequirement') setCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    if (key === 'timeline') setTimeline(defaultBankingDirectoryFilters.timeline);
    if (key === 'stateLimited') setStateLimited(defaultBankingDirectoryFilters.stateLimited);
    if (key === 'state') setState(defaultBankingDirectoryFilters.state);
  }

  return {
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
  };
}
