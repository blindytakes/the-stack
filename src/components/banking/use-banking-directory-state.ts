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
  type BankingDirectoryFilterKey,
  type CashRequirementFilterValue,
  type CustomerTypeFilterValue,
  type DirectDepositFilterValue,
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

  const [customerType, setCustomerType] = useState<CustomerTypeFilterValue>(
    initialFilters.customerType
  );
  const [directDeposit, setDirectDeposit] = useState<DirectDepositFilterValue>(
    initialFilters.directDeposit
  );
  const [apy, setApy] = useState<ApyFilterValue>(initialFilters.apy);
  const [cashRequirement, setCashRequirement] = useState<CashRequirementFilterValue>(
    initialFilters.cashRequirement
  );
  const [timeline, setTimeline] = useState<TimelineFilterValue>(initialFilters.timeline);
  const [state, setState] = useState(initialFilters.state);
  const [sortBy, setSortBy] = useState<BankingBonusesSort>(initialFilters.sortBy);

  const filters = useMemo(
    () => ({
      accountType: defaultBankingDirectoryFilters.accountType,
      customerType,
      directDeposit,
      apy,
      difficulty: defaultBankingDirectoryFilters.difficulty,
      cashRequirement,
      timeline,
      stateLimited: defaultBankingDirectoryFilters.stateLimited,
      state,
      sortBy
    }),
    [
      apy,
      cashRequirement,
      customerType,
      directDeposit,
      sortBy,
      state,
      timeline
    ]
  );

  useEffect(() => {
    const nextFilters = parseBankingDirectoryFilters(new URLSearchParams(searchParamsString));

    setCustomerType(nextFilters.customerType);
    setDirectDeposit(nextFilters.directDeposit);
    setApy(nextFilters.apy);
    setCashRequirement(nextFilters.cashRequirement);
    setTimeline(nextFilters.timeline);
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
    setCustomerType(defaultBankingDirectoryFilters.customerType);
    setDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    setApy(defaultBankingDirectoryFilters.apy);
    setCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    setTimeline(defaultBankingDirectoryFilters.timeline);
    setState(defaultBankingDirectoryFilters.state);
    setSortBy(defaultBankingDirectoryFilters.sortBy);
  }

  function removeFilter(key: BankingDirectoryFilterKey) {
    if (key === 'customerType') setCustomerType(defaultBankingDirectoryFilters.customerType);
    if (key === 'directDeposit') setDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    if (key === 'apy') setApy(defaultBankingDirectoryFilters.apy);
    if (key === 'cashRequirement') setCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    if (key === 'timeline') setTimeline(defaultBankingDirectoryFilters.timeline);
    if (key === 'state') setState(defaultBankingDirectoryFilters.state);
  }

  return {
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
  };
}
