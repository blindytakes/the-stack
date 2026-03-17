import type { CardRecord } from '@/lib/cards';
import { issuerKey, normalizeIssuerLabel } from '@/lib/cards-directory';

export type SortValue = 'highest_bonus' | 'bonus_minus_fee' | 'lowest_fee' | 'highest_rating';
export type BonusFilterValue = 'any' | 'has_bonus' | '500' | '750' | '1000';
export type FeeFilterValue = 'any' | '0' | '95' | '250' | '10000';
export type CardTypeFilterValue = 'all' | CardRecord['cardType'];
export type IssuerOption = { value: string; label: string; count: number };

export type CardsDirectoryFilters = {
  query: string;
  issuer: string;
  bonusFilter: BonusFilterValue;
  maxFee: FeeFilterValue;
  cardType: CardTypeFilterValue;
  sortBy: SortValue;
};

export const defaultCardsDirectoryFilters: CardsDirectoryFilters = {
  query: '',
  issuer: 'all',
  bonusFilter: 'any',
  maxFee: 'any',
  cardType: 'all',
  sortBy: 'highest_bonus'
};

export const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'highest_bonus', label: 'Highest Welcome Value' },
  { value: 'bonus_minus_fee', label: 'Best Bonus Net of Fee' },
  { value: 'lowest_fee', label: 'Lowest Annual Fee' },
  { value: 'highest_rating', label: 'Highest Editor Rating' }
];

export const bonusOptions: Array<{ value: BonusFilterValue; label: string }> = [
  { value: 'any', label: 'Any bonus status' },
  { value: 'has_bonus', label: 'Has active bonus' },
  { value: '500', label: '$500+ bonus value' },
  { value: '750', label: '$750+ bonus value' },
  { value: '1000', label: '$1,000+ bonus value' }
];

export const feeOptions: Array<{ value: FeeFilterValue; label: string }> = [
  { value: 'any', label: 'Any fee' },
  { value: '0', label: 'No annual fee' },
  { value: '95', label: '$95 or less' },
  { value: '250', label: '$250 or less' },
  { value: '10000', label: '$250+' }
];

export const cardTypeOptions: Array<{ value: CardTypeFilterValue; label: string }> = [
  { value: 'all', label: 'All card types' },
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'student', label: 'Student' },
  { value: 'secured', label: 'Secured' }
];

export function formatCardType(value: CardRecord['cardType']) {
  if (value === 'personal') return 'Personal';
  if (value === 'business') return 'Business';
  if (value === 'student') return 'Student';
  return 'Secured';
}

export function formatBonusValue(value?: number) {
  if (!value || value <= 0) return 'No active bonus listed';
  return `Welcome est. $${Math.round(value).toLocaleString()}`;
}

export function formatSpendRequirement(card: CardRecord) {
  const spend = card.bestSignUpBonusSpendRequired ?? null;
  const days = card.bestSignUpBonusSpendPeriodDays ?? null;
  if (!spend || !days) return null;
  const months = Math.max(1, Math.round(days / 30));
  return `Spend $${Math.round(spend).toLocaleString()} in ${months} mo`;
}

function lower(value: string) {
  return value.trim().toLowerCase();
}

export function isSortValue(value: string | null): value is SortValue {
  return (
    value === 'highest_bonus' ||
    value === 'bonus_minus_fee' ||
    value === 'lowest_fee' ||
    value === 'highest_rating'
  );
}

export function isBonusFilterValue(value: string | null): value is BonusFilterValue {
  return (
    value === 'any' || value === 'has_bonus' || value === '500' || value === '750' || value === '1000'
  );
}

export function isFeeFilterValue(value: string | null): value is FeeFilterValue {
  return (
    value === 'any' || value === '0' || value === '95' || value === '250' || value === '10000'
  );
}

export function isCardTypeFilterValue(value: string | null): value is CardTypeFilterValue {
  return (
    value === 'all' ||
    value === 'personal' ||
    value === 'business' ||
    value === 'student' ||
    value === 'secured'
  );
}

export function buildIssuerOptions(cards: CardRecord[]): IssuerOption[] {
  const byIssuer = new Map<string, IssuerOption>();
  for (const card of cards) {
    const value = issuerKey(card.issuer);
    const label = normalizeIssuerLabel(card.issuer);
    const existing = byIssuer.get(value);
    if (existing) {
      existing.count += 1;
    } else {
      byIssuer.set(value, { value, label, count: 1 });
    }
  }

  return Array.from(byIssuer.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function parseCardsDirectoryFilters(
  searchParams: URLSearchParams,
  issuerOptions: IssuerOption[]
): CardsDirectoryFilters {
  const queryFromUrl = searchParams.get('q') ?? '';
  const issuerFromUrl = searchParams.get('issuer');
  const bonusFromUrl = searchParams.get('bonus');
  const feeFromUrl = searchParams.get('fee');
  const typeFromUrl = searchParams.get('type');
  const sortFromUrl = searchParams.get('sort');

  const issuerValueFromUrl = issuerFromUrl ? issuerKey(issuerFromUrl) : null;
  const validIssuerValues = new Set(issuerOptions.map((option) => option.value));

  return {
    query: queryFromUrl,
    issuer:
      issuerValueFromUrl && validIssuerValues.has(issuerValueFromUrl)
        ? issuerValueFromUrl
        : defaultCardsDirectoryFilters.issuer,
    bonusFilter: isBonusFilterValue(bonusFromUrl)
      ? bonusFromUrl
      : defaultCardsDirectoryFilters.bonusFilter,
    maxFee: isFeeFilterValue(feeFromUrl) ? feeFromUrl : defaultCardsDirectoryFilters.maxFee,
    cardType: isCardTypeFilterValue(typeFromUrl) ? typeFromUrl : defaultCardsDirectoryFilters.cardType,
    sortBy: isSortValue(sortFromUrl) ? sortFromUrl : defaultCardsDirectoryFilters.sortBy
  };
}

export function buildCardsDirectorySearchParams(
  currentSearchParams: URLSearchParams,
  filters: CardsDirectoryFilters
) {
  const params = new URLSearchParams(currentSearchParams);
  const normalizedQuery = filters.query.trim();

  if (normalizedQuery) params.set('q', normalizedQuery);
  else params.delete('q');

  if (filters.issuer !== defaultCardsDirectoryFilters.issuer) params.set('issuer', filters.issuer);
  else params.delete('issuer');

  if (filters.bonusFilter !== defaultCardsDirectoryFilters.bonusFilter) {
    params.set('bonus', filters.bonusFilter);
  } else {
    params.delete('bonus');
  }

  if (filters.maxFee !== defaultCardsDirectoryFilters.maxFee) params.set('fee', filters.maxFee);
  else params.delete('fee');

  if (filters.cardType !== defaultCardsDirectoryFilters.cardType) params.set('type', filters.cardType);
  else params.delete('type');

  if (filters.sortBy !== defaultCardsDirectoryFilters.sortBy) params.set('sort', filters.sortBy);
  else params.delete('sort');

  return params;
}

export function filterAndSortCards(cards: CardRecord[], filters: CardsDirectoryFilters) {
  const queryLower = lower(filters.query);
  const hasQuery = queryLower.length > 0;

  const filtered = cards.filter((card) => {
    if (hasQuery) {
      const searchable = lower(
        `${card.name} ${card.issuer} ${card.headline} ${card.cardType} ${card.creditTierMin}`
      );
      if (!searchable.includes(queryLower)) return false;
    }

    if (filters.issuer !== 'all' && issuerKey(card.issuer) !== filters.issuer) return false;
    if (filters.cardType !== 'all' && card.cardType !== filters.cardType) return false;

    const bonusValue = card.bestSignUpBonusValue ?? 0;
    if (filters.bonusFilter === 'has_bonus' && bonusValue <= 0) return false;
    if (filters.bonusFilter === '500' && bonusValue < 500) return false;
    if (filters.bonusFilter === '750' && bonusValue < 750) return false;
    if (filters.bonusFilter === '1000' && bonusValue < 1000) return false;

    if (filters.maxFee === '0' && card.annualFee !== 0) return false;
    if (filters.maxFee === '95' && card.annualFee > 95) return false;
    if (filters.maxFee === '250' && card.annualFee > 250) return false;
    if (filters.maxFee === '10000' && card.annualFee <= 250) return false;

    return true;
  });

  return [...filtered].sort((a, b) => {
    const bonusDiff = (b.bestSignUpBonusValue ?? 0) - (a.bestSignUpBonusValue ?? 0);
    if (filters.sortBy === 'highest_bonus' && bonusDiff !== 0) return bonusDiff;

    if (filters.sortBy === 'bonus_minus_fee') {
      const netDiff =
        (b.bestSignUpBonusValue ?? 0) -
        b.annualFee -
        ((a.bestSignUpBonusValue ?? 0) - a.annualFee);
      if (netDiff !== 0) return netDiff;
    }

    if (filters.sortBy === 'lowest_fee') {
      const feeDiff = a.annualFee - b.annualFee;
      if (feeDiff !== 0) return feeDiff;
    }

    if (filters.sortBy === 'highest_rating') {
      const ratingDiff = (b.editorRating ?? 0) - (a.editorRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
    }

    if (bonusDiff !== 0) return bonusDiff;
    const issuerDiff = normalizeIssuerLabel(a.issuer).localeCompare(normalizeIssuerLabel(b.issuer));
    if (issuerDiff !== 0) return issuerDiff;
    return a.name.localeCompare(b.name);
  });
}

export function countActiveCardsDirectoryFilters(filters: CardsDirectoryFilters) {
  return [
    filters.query.trim().length > 0,
    filters.issuer !== defaultCardsDirectoryFilters.issuer,
    filters.bonusFilter !== defaultCardsDirectoryFilters.bonusFilter,
    filters.maxFee !== defaultCardsDirectoryFilters.maxFee,
    filters.cardType !== defaultCardsDirectoryFilters.cardType
  ].filter(Boolean).length;
}

export function buildCardsDirectoryCompareHref(selectedCompare: string[]) {
  if (selectedCompare.length !== 2) return null;

  const params = new URLSearchParams({
    a: selectedCompare[0],
    b: selectedCompare[1],
    src: 'cards_directory'
  });

  return `/tools/card-vs-card?${params.toString()}`;
}
