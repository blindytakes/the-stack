import type { BankingBonusRecord } from '@/lib/banking-bonuses';
import type { CardRecord, CreditTierValue, SpendingCategoryValue } from '@/lib/cards';

type DirectDepositAvailability = 'yes' | 'no';
type RecommendationEffort = 'low' | 'medium' | 'high';

type CardFitInput = {
  spend: SpendingCategoryValue;
};

type CardOpenValueInput = {
  bonusValue: number;
  plannerBenefitsValue: number;
  annualFee: number;
};

type CardPriorityInput = {
  estimatedNetValue: number;
  fitScore: number;
  effort: RecommendationEffort;
  timelineDays?: number;
};

type BankingPriorityInput = {
  estimatedNetValue: number;
  effort: RecommendationEffort;
  timelineDays?: number;
  directDepositRequired: boolean;
  minimumOpeningDeposit?: number;
  directDepositAvailability: DirectDepositAvailability;
};

type ScheduleContributionInput = {
  estimatedNetValue: number;
  priorityScore: number;
};

export const creditTierLabel: Record<CreditTierValue, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  building: 'Building'
};

export const creditRank: Record<CreditTierValue, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  building: 1
};

export const cardOpenScoringPolicy = {
  benefitWeight: 0.5,
  benefitCap: 250
} as const;

/**
 * Card recommendation priority weights.
 *
 * `estimatedNetValue` stays the base score in dollar terms. The weights below
 * adjust ordering for quiz fit and execution friction so ranking can be tuned
 * without rewriting the scoring function.
 */
export const cardPriorityScoringPolicy = {
  fitWeight: 60,
  effortAdjustment: {
    low: 50,
    medium: 15,
    high: -25
  },
  timelineAdjustment: {
    within90Days: 20,
    within120Days: 10
  }
} as const;

/**
 * Banking recommendation priority weights.
 *
 * Banking starts from estimated net value, then adjusts for operational effort,
 * payout timing, direct-deposit friction, and deposit size so the ordering
 * remains explicit and easy to tune.
 */
export const bankingPriorityScoringPolicy = {
  effortAdjustment: {
    low: 45,
    medium: 15,
    high: -20
  },
  timelineAdjustment: {
    within90Days: 20,
    within120Days: 10
  },
  directDepositAdjustment: {
    notRequired: 20,
    requiredAndAvailable: 8
  },
  depositAdjustment: {
    upTo2000: 20,
    upTo10000: 10
  }
} as const;

function roundCurrencyValue(value: number): number {
  return Number(value.toFixed(2));
}

export function meetsCreditTier(required: CreditTierValue, available: CreditTierValue): boolean {
  return creditRank[required] <= creditRank[available];
}

export function scoreCardFit(
  card: Pick<CardRecord, 'topCategories'>,
  input: CardFitInput
): number {
  let score = 0;

  if (card.topCategories.includes(input.spend) || card.topCategories.includes('all')) {
    score += 2;
  }

  return score;
}

export function estimateCardBenefitAdjustment(plannerBenefitsValue: number): number {
  return roundCurrencyValue(
    Math.min(plannerBenefitsValue * cardOpenScoringPolicy.benefitWeight, cardOpenScoringPolicy.benefitCap)
  );
}

export function estimateCardOpenValue(input: CardOpenValueInput): number {
  return roundCurrencyValue(
    input.bonusValue + estimateCardBenefitAdjustment(input.plannerBenefitsValue) - input.annualFee
  );
}

export function getCardRecommendationEffort(spendRequired: number): RecommendationEffort {
  if (spendRequired <= 2000) return 'low';
  if (spendRequired <= 5000) return 'medium';
  return 'high';
}

export function getBankRecommendationEffort(
  offer: Pick<BankingBonusRecord, 'requiredActions' | 'directDeposit' | 'minimumOpeningDeposit' | 'holdingPeriodDays'>
): RecommendationEffort {
  const score =
    offer.requiredActions.length +
    (offer.directDeposit.required ? 2 : 0) +
    (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000 ? 1 : 0) +
    (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays >= 120 ? 1 : 0);

  if (score <= 2) return 'low';
  if (score <= 4) return 'medium';
  return 'high';
}

export function scoreCardOpenPriority(input: CardPriorityInput): number {
  let score = input.estimatedNetValue + input.fitScore * cardPriorityScoringPolicy.fitWeight;

  score += cardPriorityScoringPolicy.effortAdjustment[input.effort];

  if (input.timelineDays && input.timelineDays <= 90) {
    score += cardPriorityScoringPolicy.timelineAdjustment.within90Days;
  } else if (input.timelineDays && input.timelineDays <= 120) {
    score += cardPriorityScoringPolicy.timelineAdjustment.within120Days;
  }

  return Math.round(score);
}

export function estimateBankBonusNetValue(bonusAmount: number, estimatedFees: number): number {
  return roundCurrencyValue(bonusAmount - estimatedFees);
}

export function scoreBankingPriority(input: BankingPriorityInput): number {
  let score = input.estimatedNetValue;

  score += bankingPriorityScoringPolicy.effortAdjustment[input.effort];

  if (input.timelineDays && input.timelineDays <= 90) {
    score += bankingPriorityScoringPolicy.timelineAdjustment.within90Days;
  } else if (input.timelineDays && input.timelineDays <= 120) {
    score += bankingPriorityScoringPolicy.timelineAdjustment.within120Days;
  }

  if (!input.directDepositRequired) {
    score += bankingPriorityScoringPolicy.directDepositAdjustment.notRequired;
  } else if (input.directDepositAvailability === 'yes') {
    score += bankingPriorityScoringPolicy.directDepositAdjustment.requiredAndAvailable;
  }

  const deposit = input.minimumOpeningDeposit ?? 0;
  if (deposit <= 2000) {
    score += bankingPriorityScoringPolicy.depositAdjustment.upTo2000;
  } else if (deposit <= 10000) {
    score += bankingPriorityScoringPolicy.depositAdjustment.upTo10000;
  }

  return Math.round(score);
}

export function scoreScheduleContribution(input: ScheduleContributionInput): number {
  return Math.round(input.estimatedNetValue * 100) + input.priorityScore;
}
