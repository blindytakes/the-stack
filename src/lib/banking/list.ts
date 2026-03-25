import type {
  BankingBonusListItem,
  BankingBonusesQuery,
  BankingBonusesSort
} from '@/lib/banking/schema';
import {
  getBankingOfferCashRequirementLevel,
  getBankingOfferDifficulty,
  getBankingOfferDifficultyScore,
  getBankingOfferTimelineBucket,
  getHoldingPeriodForSort,
  getOpeningDepositAmount
} from '@/lib/banking/scoring';

function getApyThreshold(filter: BankingBonusesQuery['apy']) {
  if (filter === '1_plus') return 1;
  if (filter === '3_plus') return 3;
  if (filter === '4_plus') return 4;
  return null;
}

export function filterBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: BankingBonusesQuery
): BankingBonusListItem[] {
  return bonuses.filter((bonus) => {
    if (query.accountType && bonus.accountType !== query.accountType) {
      return false;
    }

    if (query.customerType && bonus.customerType !== query.customerType) {
      return false;
    }

    if (query.requiresDirectDeposit === 'yes' && !bonus.directDeposit.required) {
      return false;
    }

    if (query.requiresDirectDeposit === 'no' && bonus.directDeposit.required) {
      return false;
    }

    const apyThreshold = getApyThreshold(query.apy);
    if (apyThreshold != null && (bonus.apyPercent == null || bonus.apyPercent < apyThreshold)) {
      return false;
    }

    if (query.difficulty && getBankingOfferDifficulty(bonus).level !== query.difficulty) {
      return false;
    }

    if (
      query.cashRequirement &&
      getBankingOfferCashRequirementLevel(bonus) !== query.cashRequirement
    ) {
      return false;
    }

    if (query.timeline && getBankingOfferTimelineBucket(bonus) !== query.timeline) {
      return false;
    }

    if (query.stateLimited === 'yes' && (!bonus.stateRestrictions || bonus.stateRestrictions.length === 0)) {
      return false;
    }

    if (query.stateLimited === 'no' && bonus.stateRestrictions && bonus.stateRestrictions.length > 0) {
      return false;
    }

    if (
      query.state &&
      bonus.stateRestrictions &&
      bonus.stateRestrictions.length > 0 &&
      !bonus.stateRestrictions.includes(query.state)
    ) {
      return false;
    }

    return true;
  });
}

export function sortBankingBonuses(
  bonuses: BankingBonusListItem[],
  sort: BankingBonusesSort = 'net'
): BankingBonusListItem[] {
  return [...bonuses].sort((left, right) => {
    if (sort === 'easy') {
      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      const directDepositDelta = Number(left.directDeposit.required) - Number(right.directDeposit.required);
      if (directDepositDelta !== 0) return directDepositDelta;

      const depositDelta = getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
      if (depositDelta !== 0) return depositDelta;

      const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
      if (timelineDelta !== 0) return timelineDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    if (sort === 'fast') {
      const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
      if (timelineDelta !== 0) return timelineDelta;

      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    if (sort === 'low_cash') {
      const depositDelta = getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
      if (depositDelta !== 0) return depositDelta;

      const directDepositDelta = Number(left.directDeposit.required) - Number(right.directDeposit.required);
      if (directDepositDelta !== 0) return directDepositDelta;

      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    const netDelta = right.estimatedNetValue - left.estimatedNetValue;
    if (netDelta !== 0) return netDelta;

    const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
    if (difficultyDelta !== 0) return difficultyDelta;

    const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
    if (timelineDelta !== 0) return timelineDelta;

    return getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
  });
}

export function paginateBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: Pick<BankingBonusesQuery, 'limit' | 'offset'>
): BankingBonusListItem[] {
  return bonuses.slice(query.offset, query.offset + query.limit);
}
