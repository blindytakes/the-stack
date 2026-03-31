import type {
  BankingApyFilter,
  BankingBonusListItem,
  BankingBonusesSort
} from '@/lib/banking-bonuses';
import { filterBankingBonuses, sortBankingBonuses } from '@/lib/banking-bonuses';
import { usStateOptions } from '@/lib/us-state-options';

export type AccountTypeFilterValue = 'all' | 'checking' | 'savings' | 'bundle';
export type CustomerTypeFilterValue = 'all' | 'personal' | 'business';
export type DirectDepositFilterValue = 'any' | 'yes' | 'no';
export type ApyFilterValue = 'any' | BankingApyFilter;
export type DifficultyFilterValue = 'any' | 'low' | 'medium' | 'high';
export type CashRequirementFilterValue = 'any' | 'none' | 'light' | 'medium' | 'high';
export type TimelineFilterValue = 'any' | 'fast' | 'standard' | 'long';
export type StateLimitedFilterValue = 'any' | 'yes' | 'no';
export type BankingDirectoryFilterKey =
  | 'query'
  | 'accountType'
  | 'customerType'
  | 'directDeposit'
  | 'apy'
  | 'difficulty'
  | 'cashRequirement'
  | 'timeline'
  | 'stateLimited'
  | 'state';

export type BankingDirectoryFilters = {
  query: string;
  accountType: AccountTypeFilterValue;
  customerType: CustomerTypeFilterValue;
  directDeposit: DirectDepositFilterValue;
  apy: ApyFilterValue;
  difficulty: DifficultyFilterValue;
  cashRequirement: CashRequirementFilterValue;
  timeline: TimelineFilterValue;
  stateLimited: StateLimitedFilterValue;
  state: string;
  sortBy: BankingBonusesSort;
};

export type BankingActiveFilterChip = {
  key: BankingDirectoryFilterKey;
  label: string;
};

export const defaultBankingDirectoryFilters: BankingDirectoryFilters = {
  query: '',
  accountType: 'all',
  customerType: 'all',
  directDeposit: 'any',
  apy: 'any',
  difficulty: 'any',
  cashRequirement: 'any',
  timeline: 'any',
  stateLimited: 'any',
  state: '',
  sortBy: 'net'
};

export const bankingSortOptions: Array<{ value: BankingBonusesSort; label: string }> = [
  { value: 'net', label: 'Highest Bonus Value' },
  { value: 'fast', label: 'Fastest Timeline' },
  { value: 'low_cash', label: 'Lowest Cash Needed' }
];

export const accountTypeOptions: Array<{ value: AccountTypeFilterValue; label: string }> = [
  { value: 'all', label: 'All account types' },
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'bundle', label: 'Checking + savings' }
];

export const customerTypeOptions: Array<{ value: CustomerTypeFilterValue; label: string }> = [
  { value: 'all', label: 'Personal + business' },
  { value: 'personal', label: 'Personal only' },
  { value: 'business', label: 'Business only' }
];

export const directDepositOptions: Array<{ value: DirectDepositFilterValue; label: string }> = [
  { value: 'any', label: 'Any direct deposit setup' },
  { value: 'no', label: 'No direct deposit required' },
  { value: 'yes', label: 'Direct deposit required' }
];

export const apyOptions: Array<{ value: ApyFilterValue; label: string }> = [
  { value: 'any', label: 'Any APY' },
  { value: '1_plus', label: '1.00%+ APY' },
  { value: '3_plus', label: '3.00%+ APY' },
  { value: '4_plus', label: '4.00%+ APY' }
];

export const difficultyOptions: Array<{ value: DifficultyFilterValue; label: string }> = [
  { value: 'any', label: 'Any friction level' },
  { value: 'low', label: 'Low friction' },
  { value: 'medium', label: 'Moderate friction' },
  { value: 'high', label: 'High friction' }
];

export const cashRequirementOptions: Array<{
  value: CashRequirementFilterValue;
  label: string;
}> = [
  { value: 'any', label: 'Any cash requirement' },
  { value: 'none', label: 'No minimum listed' },
  { value: 'light', label: 'Up to $2.5k' },
  { value: 'medium', label: '$2.5k to $10k' },
  { value: 'high', label: '$10k+' }
];

export const timelineOptions: Array<{ value: TimelineFilterValue; label: string }> = [
  { value: 'any', label: 'Any completion window' },
  { value: 'fast', label: '~3 months or less' },
  { value: 'standard', label: '~4 to 5 months' },
  { value: 'long', label: 'Long hold' }
];

export const stateLimitedOptions: Array<{ value: StateLimitedFilterValue; label: string }> = [
  { value: 'any', label: 'All availability types' },
  { value: 'no', label: 'National only' },
  { value: 'yes', label: 'State-limited only' }
];

function lower(value: string) {
  return value.trim().toLowerCase();
}

function isAccountTypeFilterValue(value: string | null): value is AccountTypeFilterValue {
  return value === 'all' || value === 'checking' || value === 'savings' || value === 'bundle';
}

function isCustomerTypeFilterValue(value: string | null): value is CustomerTypeFilterValue {
  return value === 'all' || value === 'personal' || value === 'business';
}

function isDirectDepositFilterValue(value: string | null): value is DirectDepositFilterValue {
  return value === 'any' || value === 'yes' || value === 'no';
}

function isApyFilterValue(value: string | null): value is ApyFilterValue {
  return value === 'any' || value === '1_plus' || value === '3_plus' || value === '4_plus';
}

function isDifficultyFilterValue(value: string | null): value is DifficultyFilterValue {
  return value === 'any' || value === 'low' || value === 'medium' || value === 'high';
}

function isCashRequirementFilterValue(value: string | null): value is CashRequirementFilterValue {
  return (
    value === 'any' ||
    value === 'none' ||
    value === 'light' ||
    value === 'medium' ||
    value === 'high'
  );
}

function isTimelineFilterValue(value: string | null): value is TimelineFilterValue {
  return value === 'any' || value === 'fast' || value === 'standard' || value === 'long';
}

function isStateLimitedFilterValue(value: string | null): value is StateLimitedFilterValue {
  return value === 'any' || value === 'yes' || value === 'no';
}

function isBankingSortValue(value: string | null): value is BankingBonusesSort {
  return value === 'net' || value === 'easy' || value === 'fast' || value === 'low_cash';
}

function toBankingQuery(filters: BankingDirectoryFilters) {
  return {
    accountType: filters.accountType === 'all' ? undefined : filters.accountType,
    customerType: filters.customerType === 'all' ? undefined : filters.customerType,
    requiresDirectDeposit: filters.directDeposit === 'any' ? undefined : filters.directDeposit,
    apy: filters.apy === 'any' ? undefined : filters.apy,
    difficulty: filters.difficulty === 'any' ? undefined : filters.difficulty,
    cashRequirement: filters.cashRequirement === 'any' ? undefined : filters.cashRequirement,
    timeline: filters.timeline === 'any' ? undefined : filters.timeline,
    stateLimited: filters.stateLimited === 'any' ? undefined : filters.stateLimited,
    state: filters.state || undefined,
    sort: filters.sortBy,
    limit: 100,
    offset: 0
  };
}

export function getStateLabel(value: string) {
  return usStateOptions.find((option) => option.value === value)?.label ?? value;
}

export function parseBankingDirectoryFilters(searchParams: URLSearchParams): BankingDirectoryFilters {
  const accountTypeFromUrl = searchParams.get('accountType');
  const customerTypeFromUrl = searchParams.get('customerType');
  const directDepositFromUrl = searchParams.get('directDeposit');
  const apyFromUrl = searchParams.get('apy');
  const difficultyFromUrl = searchParams.get('difficulty');
  const cashFromUrl = searchParams.get('cash');
  const timelineFromUrl = searchParams.get('timeline');
  const stateLimitedFromUrl = searchParams.get('stateLimited');
  const sortFromUrl = searchParams.get('sort');
  const stateFromUrl = (searchParams.get('state') ?? '').trim().toUpperCase();
  const validStates = new Set<string>(usStateOptions.map((option) => option.value));

  return {
    query: searchParams.get('q') ?? defaultBankingDirectoryFilters.query,
    accountType: isAccountTypeFilterValue(accountTypeFromUrl)
      ? accountTypeFromUrl
      : defaultBankingDirectoryFilters.accountType,
    customerType: isCustomerTypeFilterValue(customerTypeFromUrl)
      ? customerTypeFromUrl
      : defaultBankingDirectoryFilters.customerType,
    directDeposit: isDirectDepositFilterValue(directDepositFromUrl)
      ? directDepositFromUrl
      : defaultBankingDirectoryFilters.directDeposit,
    apy: isApyFilterValue(apyFromUrl) ? apyFromUrl : defaultBankingDirectoryFilters.apy,
    difficulty: isDifficultyFilterValue(difficultyFromUrl)
      ? difficultyFromUrl
      : defaultBankingDirectoryFilters.difficulty,
    cashRequirement: isCashRequirementFilterValue(cashFromUrl)
      ? cashFromUrl
      : defaultBankingDirectoryFilters.cashRequirement,
    timeline: isTimelineFilterValue(timelineFromUrl)
      ? timelineFromUrl
      : defaultBankingDirectoryFilters.timeline,
    stateLimited: isStateLimitedFilterValue(stateLimitedFromUrl)
      ? stateLimitedFromUrl
      : defaultBankingDirectoryFilters.stateLimited,
    state: validStates.has(stateFromUrl) ? stateFromUrl : defaultBankingDirectoryFilters.state,
    sortBy:
      sortFromUrl === 'easy'
        ? defaultBankingDirectoryFilters.sortBy
        : isBankingSortValue(sortFromUrl)
          ? sortFromUrl
          : defaultBankingDirectoryFilters.sortBy
  };
}

export function buildBankingDirectorySearchParams(
  currentSearchParams: URLSearchParams,
  filters: BankingDirectoryFilters
) {
  const params = new URLSearchParams(currentSearchParams);
  const normalizedQuery = filters.query.trim();

  if (normalizedQuery) params.set('q', normalizedQuery);
  else params.delete('q');

  if (filters.accountType !== defaultBankingDirectoryFilters.accountType) {
    params.set('accountType', filters.accountType);
  } else {
    params.delete('accountType');
  }

  if (filters.customerType !== defaultBankingDirectoryFilters.customerType) {
    params.set('customerType', filters.customerType);
  } else {
    params.delete('customerType');
  }

  if (filters.directDeposit !== defaultBankingDirectoryFilters.directDeposit) {
    params.set('directDeposit', filters.directDeposit);
  } else {
    params.delete('directDeposit');
  }

  if (filters.apy !== defaultBankingDirectoryFilters.apy) {
    params.set('apy', filters.apy);
  } else {
    params.delete('apy');
  }

  if (filters.difficulty !== defaultBankingDirectoryFilters.difficulty) {
    params.set('difficulty', filters.difficulty);
  } else {
    params.delete('difficulty');
  }

  if (filters.cashRequirement !== defaultBankingDirectoryFilters.cashRequirement) {
    params.set('cash', filters.cashRequirement);
  } else {
    params.delete('cash');
  }

  if (filters.timeline !== defaultBankingDirectoryFilters.timeline) {
    params.set('timeline', filters.timeline);
  } else {
    params.delete('timeline');
  }

  if (filters.stateLimited !== defaultBankingDirectoryFilters.stateLimited) {
    params.set('stateLimited', filters.stateLimited);
  } else {
    params.delete('stateLimited');
  }

  if (filters.state) params.set('state', filters.state);
  else params.delete('state');

  if (filters.sortBy !== defaultBankingDirectoryFilters.sortBy) params.set('sort', filters.sortBy);
  else params.delete('sort');

  return params;
}

export function filterAndSortBankingOffers(
  offers: BankingBonusListItem[],
  filters: BankingDirectoryFilters
) {
  const queryLower = lower(filters.query);
  const hasQuery = queryLower.length > 0;

  const filtered = filterBankingBonuses(offers, toBankingQuery(filters)).filter((offer) => {
    if (!hasQuery) return true;

    const searchable = lower(
      `${offer.bankName} ${offer.offerName} ${offer.headline} ${offer.accountType} ${offer.customerType}`
    );
    return searchable.includes(queryLower);
  });

  return sortBankingBonuses(filtered, filters.sortBy);
}

export function countActiveBankingDirectoryFilters(filters: BankingDirectoryFilters) {
  return [
    filters.query.trim().length > 0,
    filters.accountType !== defaultBankingDirectoryFilters.accountType,
    filters.customerType !== defaultBankingDirectoryFilters.customerType,
    filters.directDeposit !== defaultBankingDirectoryFilters.directDeposit,
    filters.apy !== defaultBankingDirectoryFilters.apy,
    filters.difficulty !== defaultBankingDirectoryFilters.difficulty,
    filters.cashRequirement !== defaultBankingDirectoryFilters.cashRequirement,
    filters.timeline !== defaultBankingDirectoryFilters.timeline,
    filters.stateLimited !== defaultBankingDirectoryFilters.stateLimited,
    filters.state.length > 0
  ].filter(Boolean).length;
}

export function buildActiveBankingFilterChips(
  filters: BankingDirectoryFilters
): BankingActiveFilterChip[] {
  const chips: BankingActiveFilterChip[] = [];
  const normalizedQuery = filters.query.trim();

  if (normalizedQuery) chips.push({ key: 'query', label: `Search: ${normalizedQuery}` });
  if (filters.accountType !== defaultBankingDirectoryFilters.accountType) {
    chips.push({
      key: 'accountType',
      label: accountTypeOptions.find((option) => option.value === filters.accountType)?.label ?? filters.accountType
    });
  }
  if (filters.customerType !== defaultBankingDirectoryFilters.customerType) {
    chips.push({
      key: 'customerType',
      label:
        customerTypeOptions.find((option) => option.value === filters.customerType)?.label ??
        filters.customerType
    });
  }
  if (filters.directDeposit !== defaultBankingDirectoryFilters.directDeposit) {
    chips.push({
      key: 'directDeposit',
      label:
        directDepositOptions.find((option) => option.value === filters.directDeposit)?.label ??
        filters.directDeposit
    });
  }
  if (filters.apy !== defaultBankingDirectoryFilters.apy) {
    chips.push({
      key: 'apy',
      label: apyOptions.find((option) => option.value === filters.apy)?.label ?? filters.apy
    });
  }
  if (filters.cashRequirement !== defaultBankingDirectoryFilters.cashRequirement) {
    chips.push({
      key: 'cashRequirement',
      label:
        cashRequirementOptions.find((option) => option.value === filters.cashRequirement)?.label ??
        filters.cashRequirement
    });
  }
  if (filters.timeline !== defaultBankingDirectoryFilters.timeline) {
    chips.push({
      key: 'timeline',
      label:
        timelineOptions.find((option) => option.value === filters.timeline)?.label ?? filters.timeline
    });
  }
  if (filters.difficulty !== defaultBankingDirectoryFilters.difficulty) {
    chips.push({
      key: 'difficulty',
      label:
        difficultyOptions.find((option) => option.value === filters.difficulty)?.label ??
        filters.difficulty
    });
  }
  if (filters.stateLimited !== defaultBankingDirectoryFilters.stateLimited) {
    chips.push({
      key: 'stateLimited',
      label:
        stateLimitedOptions.find((option) => option.value === filters.stateLimited)?.label ??
        filters.stateLimited
    });
  }
  if (filters.state) chips.push({ key: 'state', label: `Available in ${getStateLabel(filters.state)}` });

  return chips;
}
