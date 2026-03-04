import type { CardRecord, CreditTierValue } from '@/lib/cards';
import type { QuizRequest, QuizResult } from '@/lib/quiz-engine';
import {
  getBankingOfferRequirements,
  type BankingBonusListItem,
  type BankingBonusRecord
} from '@/lib/banking-bonuses';

export type PlannerRecommendationLane = 'cards' | 'banking';
export type PlannerRecommendationKind = 'card_bonus' | 'bank_bonus';
export type PlannerRecommendationEffort = 'low' | 'medium' | 'high';

export type PlannerExclusionReason =
  | 'no_signup_bonus'
  | 'fee_preference'
  | 'credit_tier'
  | 'direct_deposit_required'
  | 'state_restricted'
  | 'opening_deposit_too_high';

export type PlannerExcludedOffer = {
  id: string;
  lane: PlannerRecommendationLane;
  title: string;
  provider: string;
  reasons: PlannerExclusionReason[];
};

export type PlannerRecommendation = {
  id: string;
  lane: PlannerRecommendationLane;
  kind: PlannerRecommendationKind;
  title: string;
  provider: string;
  estimatedNetValue: number;
  priorityScore: number;
  effort: PlannerRecommendationEffort;
  detailPath: string;
  timelineDays?: number;
  keyRequirements: string[];
};

export type PlannerRecommendationBundle = {
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
};

export type CardPlannerInput = Pick<CardRecord, 'slug' | 'name' | 'issuer' | 'annualFee' | 'creditTierMin'> & {
  bonusValue: number;
  spendRequired: number;
  spendPeriodDays: number;
};

const creditTierLabel: Record<CreditTierValue, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  building: 'Building'
};

const creditRank: Record<CreditTierValue, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  building: 1
};

function cardEffortFromSpend(spendRequired: number): PlannerRecommendationEffort {
  if (spendRequired <= 2000) return 'low';
  if (spendRequired <= 5000) return 'medium';
  return 'high';
}

function bankEffortFromOffer(offer: BankingBonusRecord): PlannerRecommendationEffort {
  const score =
    offer.requiredActions.length +
    (offer.directDeposit.required ? 2 : 0) +
    (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000 ? 1 : 0) +
    (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays >= 120 ? 1 : 0);

  if (score <= 2) return 'low';
  if (score <= 4) return 'medium';
  return 'high';
}

function asNetValue(value: number): number {
  return Number(value.toFixed(2));
}

function availableOpeningCash(input: QuizRequest): number {
  if (input.openingCash === 'lt_2000') return 1999;
  if (input.openingCash === 'from_2000_to_10000') return 10000;
  return Number.POSITIVE_INFINITY;
}

function getCardExclusionReasons(card: QuizResult, input: QuizRequest): PlannerExclusionReason[] {
  const reasons: PlannerExclusionReason[] = [];

  const bonusValue = card.bestSignUpBonusValue ?? 0;
  if (bonusValue <= 0) {
    reasons.push('no_signup_bonus');
  }

  if (input.fee === 'no_fee' && card.annualFee > 0) {
    reasons.push('fee_preference');
  }
  if (input.fee === 'up_to_95' && card.annualFee > 95) {
    reasons.push('fee_preference');
  }

  if (creditRank[card.creditTierMin] > creditRank[input.credit]) {
    reasons.push('credit_tier');
  }

  return reasons;
}

function getBankingExclusionReasons(
  offer: BankingBonusListItem,
  input: QuizRequest
): PlannerExclusionReason[] {
  const reasons: PlannerExclusionReason[] = [];

  if (input.directDeposit === 'no' && offer.directDeposit.required) {
    reasons.push('direct_deposit_required');
  }

  if (
    offer.stateRestrictions &&
    offer.stateRestrictions.length > 0 &&
    !offer.stateRestrictions.includes(input.state)
  ) {
    reasons.push('state_restricted');
  }

  const availableCash = availableOpeningCash(input);
  if (
    typeof offer.minimumOpeningDeposit === 'number' &&
    Number.isFinite(availableCash) &&
    offer.minimumOpeningDeposit > availableCash
  ) {
    reasons.push('opening_deposit_too_high');
  }

  return reasons;
}

function cardPriorityScore(
  card: QuizResult,
  recommendation: PlannerRecommendation,
  input: QuizRequest
): number {
  let score = recommendation.estimatedNetValue + card.score * 60;

  if (recommendation.effort === 'low') score += 50;
  if (recommendation.effort === 'medium') score += 15;
  if (recommendation.effort === 'high') score -= 25;

  if (recommendation.timelineDays && recommendation.timelineDays <= 90) score += 20;
  else if (recommendation.timelineDays && recommendation.timelineDays <= 120) score += 10;

  if (input.fee === 'no_fee' && card.annualFee === 0) score += 25;
  if (input.fee === 'up_to_95' && card.annualFee <= 95) score += 15;

  return Math.round(score);
}

function bankingPriorityScore(
  offer: BankingBonusListItem,
  recommendation: PlannerRecommendation,
  input: QuizRequest
): number {
  let score = recommendation.estimatedNetValue;

  if (recommendation.effort === 'low') score += 45;
  if (recommendation.effort === 'medium') score += 15;
  if (recommendation.effort === 'high') score -= 20;

  if (recommendation.timelineDays && recommendation.timelineDays <= 90) score += 20;
  else if (recommendation.timelineDays && recommendation.timelineDays <= 120) score += 10;

  if (!offer.directDeposit.required) score += 20;
  else if (input.directDeposit === 'yes') score += 8;

  if (!offer.stateRestrictions || offer.stateRestrictions.length === 0) score += 10;

  const deposit = offer.minimumOpeningDeposit ?? 0;
  if (deposit <= 2000) score += 20;
  else if (deposit <= 10000) score += 10;

  return Math.round(score);
}

export function toPlannerRecommendationFromCard(input: CardPlannerInput): PlannerRecommendation {
  const estimatedNetValue = asNetValue(input.bonusValue - input.annualFee);
  const spendMonths = Math.max(1, Math.round(input.spendPeriodDays / 30));

  return {
    id: `card:${input.slug}`,
    lane: 'cards',
    kind: 'card_bonus',
    title: input.name,
    provider: input.issuer,
    estimatedNetValue,
    priorityScore: estimatedNetValue,
    effort: cardEffortFromSpend(input.spendRequired),
    detailPath: `/cards/${input.slug}`,
    timelineDays: input.spendPeriodDays,
    keyRequirements: [
      `Spend $${input.spendRequired.toLocaleString()} within ${spendMonths} months`,
      `Typical approval profile: ${creditTierLabel[input.creditTierMin]} credit or higher`,
      'Pay statements in full to avoid interest drag'
    ]
  };
}

export function toPlannerRecommendationFromBankingBonus(
  input: BankingBonusRecord | BankingBonusListItem
): PlannerRecommendation {
  const estimatedNetValue = asNetValue(input.bonusAmount - input.estimatedFees);

  return {
    id: `bank:${input.slug}`,
    lane: 'banking',
    kind: 'bank_bonus',
    title: input.offerName,
    provider: input.bankName,
    estimatedNetValue,
    priorityScore: estimatedNetValue,
    effort: bankEffortFromOffer(input),
    detailPath: `/banking/${input.slug}`,
    timelineDays: input.holdingPeriodDays,
    keyRequirements: getBankingOfferRequirements(input)
  };
}

export function rankPlannerRecommendationsByValue(
  recommendations: PlannerRecommendation[]
): PlannerRecommendation[] {
  return [...recommendations].sort((a, b) => b.estimatedNetValue - a.estimatedNetValue);
}

export function rankPlannerRecommendationsByPriority(
  recommendations: PlannerRecommendation[]
): PlannerRecommendation[] {
  return [...recommendations].sort(
    (a, b) => b.priorityScore - a.priorityScore || b.estimatedNetValue - a.estimatedNetValue
  );
}

export function buildPlanRecommendationsFromQuiz(
  cardResults: QuizResult[],
  bankingBonuses: BankingBonusListItem[],
  input: QuizRequest,
  options: { maxCards?: number; maxBanking?: number } = {}
): PlannerRecommendationBundle {
  const maxCards = options.maxCards ?? 3;
  const maxBanking = options.maxBanking ?? 3;

  const exclusions: PlannerExcludedOffer[] = [];

  const eligibleCards: PlannerRecommendation[] = [];
  for (const card of cardResults) {
    const reasons = getCardExclusionReasons(card, input);
    if (reasons.length > 0) {
      exclusions.push({
        id: `card:${card.slug}`,
        lane: 'cards',
        title: card.name,
        provider: card.issuer,
        reasons
      });
      continue;
    }

    const recommendation = toPlannerRecommendationFromCard({
      slug: card.slug,
      name: card.name,
      issuer: card.issuer,
      annualFee: card.annualFee,
      creditTierMin: card.creditTierMin,
      bonusValue: card.bestSignUpBonusValue ?? 0,
      spendRequired: card.bestSignUpBonusSpendRequired ?? 3000,
      spendPeriodDays: card.bestSignUpBonusSpendPeriodDays ?? 90
    });

    eligibleCards.push({
      ...recommendation,
      priorityScore: cardPriorityScore(card, recommendation, input)
    });
  }

  const eligibleBanking: PlannerRecommendation[] = [];
  for (const offer of bankingBonuses) {
    const reasons = getBankingExclusionReasons(offer, input);
    if (reasons.length > 0) {
      exclusions.push({
        id: `bank:${offer.slug}`,
        lane: 'banking',
        title: offer.offerName,
        provider: offer.bankName,
        reasons
      });
      continue;
    }

    const recommendation = toPlannerRecommendationFromBankingBonus(offer);
    eligibleBanking.push({
      ...recommendation,
      priorityScore: bankingPriorityScore(offer, recommendation, input)
    });
  }

  const selectedCards = rankPlannerRecommendationsByPriority(eligibleCards).slice(0, maxCards);
  const selectedBanking = rankPlannerRecommendationsByPriority(eligibleBanking).slice(0, maxBanking);

  return {
    recommendations: [...selectedCards, ...selectedBanking],
    exclusions
  };
}
