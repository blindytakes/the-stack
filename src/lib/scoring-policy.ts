import type { BankingBonusListItem, BankingBonusRecord } from '@/lib/banking-bonuses';
import type { CardRecord, CreditTierValue, SpendingCategoryValue } from '@/lib/cards';

type RewardGoal = 'cashback' | 'travel' | 'flexibility';
type FeePreference = 'no_fee' | 'up_to_95' | 'over_95_ok';
type DirectDepositAvailability = 'yes' | 'no';
type RecommendationEffort = 'low' | 'medium' | 'high';

type CardFitInput = {
  goal: RewardGoal;
  spend: SpendingCategoryValue;
  fee: FeePreference;
};

type CardOpenValueInput = {
  bonusValue: number;
  plannerBenefitsValue: number;
  annualFee: number;
};

type CardPriorityInput = {
  estimatedNetValue: number;
  fitScore: number;
  annualFee: number;
  feePreference: FeePreference;
  effort: RecommendationEffort;
  timelineDays?: number;
};

type BankingPriorityInput = {
  estimatedNetValue: number;
  effort: RecommendationEffort;
  timelineDays?: number;
  directDepositRequired: boolean;
  stateRestricted: boolean;
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

const goalRewardTypes: Record<RewardGoal, CardRecord['rewardType'][]> = {
  cashback: ['cashback'],
  travel: ['points', 'miles'],
  flexibility: ['cashback', 'points', 'miles']
};

export const cardOpenScoringPolicy = {
  benefitWeight: 0.5,
  benefitCap: 250
} as const;

function roundCurrencyValue(value: number): number {
  return Number(value.toFixed(2));
}

export function meetsCreditTier(required: CreditTierValue, available: CreditTierValue): boolean {
  return creditRank[required] <= creditRank[available];
}

export function scoreCardFit(
  card: Pick<CardRecord, 'rewardType' | 'topCategories' | 'annualFee'>,
  input: CardFitInput
): number {
  let score = 0;

  if (!goalRewardTypes[input.goal].includes(card.rewardType)) {
    score -= 1;
  } else {
    score += input.goal === 'flexibility' ? 2 : 3;
  }

  if (card.topCategories.includes(input.spend) || card.topCategories.includes('all')) {
    score += 2;
  }

  if (input.fee === 'no_fee') {
    score += card.annualFee === 0 ? 2 : -2;
  } else if (input.fee === 'up_to_95') {
    score += card.annualFee <= 95 ? 2 : -1;
  } else {
    score += card.annualFee > 95 ? 1 : 0;
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
  let score = input.estimatedNetValue + input.fitScore * 60;

  if (input.effort === 'low') score += 50;
  if (input.effort === 'medium') score += 15;
  if (input.effort === 'high') score -= 25;

  if (input.timelineDays && input.timelineDays <= 90) score += 20;
  else if (input.timelineDays && input.timelineDays <= 120) score += 10;

  if (input.feePreference === 'no_fee' && input.annualFee === 0) score += 25;
  if (input.feePreference === 'up_to_95' && input.annualFee <= 95) score += 15;

  return Math.round(score);
}

export function estimateBankBonusNetValue(bonusAmount: number, estimatedFees: number): number {
  return roundCurrencyValue(bonusAmount - estimatedFees);
}

export function scoreBankingPriority(input: BankingPriorityInput): number {
  let score = input.estimatedNetValue;

  if (input.effort === 'low') score += 45;
  if (input.effort === 'medium') score += 15;
  if (input.effort === 'high') score -= 20;

  if (input.timelineDays && input.timelineDays <= 90) score += 20;
  else if (input.timelineDays && input.timelineDays <= 120) score += 10;

  if (!input.directDepositRequired) score += 20;
  else if (input.directDepositAvailability === 'yes') score += 8;

  if (!input.stateRestricted) score += 10;

  const deposit = input.minimumOpeningDeposit ?? 0;
  if (deposit <= 2000) score += 20;
  else if (deposit <= 10000) score += 10;

  return Math.round(score);
}

export function scoreScheduleContribution(input: ScheduleContributionInput): number {
  return Math.round(input.estimatedNetValue * 100) + input.priorityScore;
}

export function isStateRestricted(offer: Pick<BankingBonusListItem, 'stateRestrictions'>, state: string): boolean {
  if (state === 'OT') {
    return false;
  }

  return Boolean(
    offer.stateRestrictions &&
      offer.stateRestrictions.length > 0 &&
      !offer.stateRestrictions.includes(state)
  );
}
