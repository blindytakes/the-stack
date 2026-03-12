import type { CardRecord } from '@/lib/cards';
import type { QuizRequest, QuizResult } from '@/lib/quiz-engine';
import {
  getBankingOfferRequirements,
  type BankingBonusListItem,
  type BankingBonusRecord
} from '@/lib/banking-bonuses';
import {
  creditTierLabel,
  estimateBankBonusNetValue,
  estimateCardBenefitAdjustment,
  estimateCardOpenValue,
  getBankRecommendationEffort,
  getCardRecommendationEffort,
  meetsCreditTier,
  scoreBankingPriority,
  scoreCardOpenPriority
} from '@/lib/scoring-policy';
import {
  buildPlanSchedule,
  type PlanScheduleIssue,
  type PlanScheduleItem,
  type PlannerRecommendationScheduleConstraints
} from '@/lib/plan-engine';
import { getCardIssuerEligibilityReasons } from '@/lib/issuer-rules';

export type PlannerRecommendationLane = 'cards' | 'banking';
export type PlannerRecommendationKind = 'card_bonus' | 'bank_bonus';
export type PlannerRecommendationEffort = 'low' | 'medium' | 'high';

export type PlannerExclusionReason =
  | 'no_signup_bonus'
  | 'credit_tier'
  | 'amex_lifetime_rule'
  | 'chase_5_24'
  | 'direct_deposit_required'
  | 'state_restricted';

export type PlannerExcludedOffer = {
  id: string;
  lane: PlannerRecommendationLane;
  title: string;
  provider: string;
  reasons: PlannerExclusionReason[];
};

export type PlannerRecommendationValueBreakdown = {
  headlineValue: number;
  headlineLabel: string;
  benefitAdjustment?: number;
  annualFee?: number;
  estimatedFees?: number;
};

export type PlannerRecommendation = {
  id: string;
  lane: PlannerRecommendationLane;
  kind: PlannerRecommendationKind;
  title: string;
  provider: string;
  estimatedNetValue: number;
  valueBreakdown?: PlannerRecommendationValueBreakdown;
  priorityScore: number;
  effort: PlannerRecommendationEffort;
  detailPath: string;
  timelineDays?: number;
  keyRequirements: string[];
  scheduleConstraints: PlannerRecommendationScheduleConstraints;
};

export type PlannerRecommendationBundle = {
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanScheduleItem[];
  scheduleIssues: PlanScheduleIssue[];
};

export type CardPlannerInput = Pick<CardRecord, 'slug' | 'name' | 'issuer' | 'annualFee' | 'creditTierMin'> & {
  bonusValue: number;
  plannerBenefitsValue: number;
  spendRequired: number;
  spendPeriodDays: number;
};

function getCardExclusionReasons(card: QuizResult, input: QuizRequest): PlannerExclusionReason[] {
  const reasons: PlannerExclusionReason[] = [];

  const bonusValue = card.bestSignUpBonusValue ?? 0;
  if (bonusValue <= 0) {
    reasons.push('no_signup_bonus');
  }

  if (!meetsCreditTier(card.creditTierMin, input.credit)) {
    reasons.push('credit_tier');
  }

  reasons.push(...getCardIssuerEligibilityReasons(card, input));

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

  return reasons;
}

export function toPlannerRecommendationFromCard(input: CardPlannerInput): PlannerRecommendation {
  const spendRequired = input.spendRequired > 0 ? input.spendRequired : 3000;
  const spendPeriodDays = input.spendPeriodDays > 0 ? input.spendPeriodDays : 90;
  const benefitAdjustment = estimateCardBenefitAdjustment(input.plannerBenefitsValue);
  const estimatedNetValue = estimateCardOpenValue({
    bonusValue: input.bonusValue,
    plannerBenefitsValue: input.plannerBenefitsValue,
    annualFee: input.annualFee
  });
  const spendMonths = Math.max(1, Math.round(spendPeriodDays / 30));

  return {
    id: `card:${input.slug}`,
    lane: 'cards',
    kind: 'card_bonus',
    title: input.name,
    provider: input.issuer,
    estimatedNetValue,
    valueBreakdown: {
      headlineValue: input.bonusValue,
      headlineLabel: 'Welcome bonus',
      benefitAdjustment,
      annualFee: input.annualFee
    },
    priorityScore: 0,
    effort: getCardRecommendationEffort(spendRequired),
    detailPath: `/cards/${input.slug}`,
    timelineDays: spendPeriodDays,
    keyRequirements: [
      `Spend $${spendRequired.toLocaleString()} within ${spendMonths} months`,
      `Typical approval profile: ${creditTierLabel[input.creditTierMin]} credit or higher`,
      'Pay statements in full to avoid interest drag'
    ],
    scheduleConstraints: {
      activeDays: spendPeriodDays,
      payoutLagDays: 30,
      requiredSpend: spendRequired
    }
  };
}

export function toPlannerRecommendationFromBankingBonus(
  input: BankingBonusRecord | BankingBonusListItem
): PlannerRecommendation {
  const estimatedNetValue = estimateBankBonusNetValue(input.bonusAmount, input.estimatedFees);

  return {
    id: `bank:${input.slug}`,
    lane: 'banking',
    kind: 'bank_bonus',
    title: input.offerName,
    provider: input.bankName,
    estimatedNetValue,
    valueBreakdown: {
      headlineValue: input.bonusAmount,
      headlineLabel: 'Bank bonus',
      estimatedFees: input.estimatedFees
    },
    priorityScore: 0,
    effort: getBankRecommendationEffort(input),
    detailPath: `/banking/${input.slug}`,
    timelineDays: input.holdingPeriodDays,
    keyRequirements: getBankingOfferRequirements(input),
    scheduleConstraints: {
      activeDays: input.holdingPeriodDays ?? 90,
      payoutLagDays: 21,
      requiredDeposit: input.minimumOpeningDeposit,
      requiresDirectDeposit: input.directDeposit.required
    }
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
  options: { maxCards?: number; maxBanking?: number; startAt?: number } = {}
): PlannerRecommendationBundle {
  const maxCards = options.maxCards ?? 3;
  const maxBanking = options.maxBanking ?? 3;
  const ownedCardSlugSet = new Set(input.ownedCardSlugs);

  const exclusions: PlannerExcludedOffer[] = [];

  const eligibleCards: PlannerRecommendation[] = [];
  for (const card of cardResults) {
    if (ownedCardSlugSet.has(card.slug)) {
      continue;
    }

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
      plannerBenefitsValue: card.plannerBenefitsValue,
      spendRequired: card.bestSignUpBonusSpendRequired ?? 3000,
      spendPeriodDays: card.bestSignUpBonusSpendPeriodDays ?? 90
    });

    eligibleCards.push({
      ...recommendation,
      priorityScore: scoreCardOpenPriority({
        estimatedNetValue: recommendation.estimatedNetValue,
        fitScore: card.score,
        effort: recommendation.effort,
        timelineDays: recommendation.timelineDays
      })
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
      priorityScore: scoreBankingPriority({
        estimatedNetValue: recommendation.estimatedNetValue,
        effort: recommendation.effort,
        timelineDays: recommendation.timelineDays,
        directDepositRequired: offer.directDeposit.required,
        minimumOpeningDeposit: offer.minimumOpeningDeposit,
        directDepositAvailability: input.directDeposit
      })
    });
  }

  const scheduleResult = buildPlanSchedule(
    [...eligibleCards, ...eligibleBanking],
    input,
    {
      startAt: options.startAt,
      maxCards,
      maxBanking
    }
  );
  const recommendationsById = new Map(
    [...eligibleCards, ...eligibleBanking].map((recommendation) => [recommendation.id, recommendation])
  );
  const scheduledRecommendations = scheduleResult.scheduled
    .map((item) => recommendationsById.get(item.recommendationId))
    .filter((recommendation): recommendation is PlannerRecommendation => Boolean(recommendation));

  return {
    recommendations: scheduledRecommendations,
    exclusions,
    schedule: scheduleResult.scheduled,
    scheduleIssues: scheduleResult.issues
  };
}
