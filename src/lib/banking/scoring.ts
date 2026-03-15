import type {
  BankingBonusRecord,
  BankingOfferCashRequirementLevel,
  BankingOfferDifficulty,
  BankingOfferTimeline,
  BankingOfferTimelineBucket
} from '@/lib/banking/schema';

export function getBankingOfferDifficultyScore(
  offer: Pick<
    BankingBonusRecord,
    'requiredActions' | 'directDeposit' | 'minimumOpeningDeposit' | 'holdingPeriodDays'
  >
) {
  return (
    offer.requiredActions.length +
    (offer.directDeposit.required ? 2 : 0) +
    (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000
      ? 1
      : 0) +
    (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays >= 120 ? 1 : 0)
  );
}

export function getOpeningDepositAmount(offer: Pick<BankingBonusRecord, 'minimumOpeningDeposit'>) {
  return offer.minimumOpeningDeposit ?? 0;
}

export function getHoldingPeriodForSort(offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>) {
  return offer.holdingPeriodDays ?? Number.POSITIVE_INFINITY;
}

export function getBankingOfferDifficulty(
  offer: Pick<
    BankingBonusRecord,
    'requiredActions' | 'directDeposit' | 'minimumOpeningDeposit' | 'holdingPeriodDays'
  >
): BankingOfferDifficulty {
  const score = getBankingOfferDifficultyScore(offer);

  if (score <= 2) {
    return {
      level: 'low',
      label: 'Low friction',
      shortLabel: 'Low friction',
      detail: 'Lighter checklist with no direct-deposit routing and limited funding drag.'
    };
  }

  if (score <= 4) {
    return {
      level: 'medium',
      label: 'Moderate friction',
      shortLabel: 'Moderate friction',
      detail: offer.directDeposit.required
        ? 'Expect payroll routing or a few coordinated tasks, but the workload is still manageable.'
        : 'There are enough steps or holding time to warrant a tracker, even without payroll routing.'
    };
  }

  return {
    level: 'high',
    label: 'High friction',
    shortLabel: 'High friction',
    detail:
      'Higher cash commitment, longer hold periods, or several moving parts make this a more hands-on execution play.'
  };
}

export function getBankingOfferCashRequirementLevel(
  offer: Pick<BankingBonusRecord, 'minimumOpeningDeposit'>
): BankingOfferCashRequirementLevel {
  const openingDeposit = getOpeningDepositAmount(offer);

  if (openingDeposit <= 0) return 'none';
  if (openingDeposit <= 2500) return 'light';
  if (openingDeposit < 10000) return 'medium';
  return 'high';
}

export function getBankingOfferTimelineBucket(
  offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>
): BankingOfferTimelineBucket {
  const days = offer.holdingPeriodDays;

  if (!days) return 'unknown';
  if (days <= 90) return 'fast';
  if (days <= 150) return 'standard';
  return 'long';
}

export function getBankingOfferTimeline(
  offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>
): BankingOfferTimeline {
  const days = offer.holdingPeriodDays;

  if (!days) {
    return {
      label: 'Check live terms',
      shortLabel: 'Varies',
      detail: 'The completion timeline is not clearly listed in this dataset, so confirm the live offer before you start.',
      isKnown: false
    };
  }

  if (days <= 60) {
    return {
      label: `${days} days`,
      shortLabel: `${days} days`,
      detail: 'Fast by bank-bonus standards if you stay on top of the checklist.',
      isKnown: true
    };
  }

  const months = Math.round(days / 30);
  if (days <= 120) {
    return {
      label: `~${months} months`,
      shortLabel: `~${months} months`,
      detail: `A standard multi-month offer window with roughly ${days} days of follow-through.`,
      isKnown: true
    };
  }

  return {
    label: `~${months} months`,
    shortLabel: `~${months} months`,
    detail: `Longer runway: plan on about ${days} days before the account is truly done.`,
    isKnown: true
  };
}
