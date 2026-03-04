import type { CardRecord, CreditTierValue } from '@/lib/cards';
import type { QuizResult } from '@/lib/quiz-engine';
import {
  getBankingOfferRequirements,
  type BankingBonusListItem,
  type BankingBonusRecord
} from '@/lib/banking-bonuses';

export type PlannerRecommendationLane = 'cards' | 'banking';
export type PlannerRecommendationKind = 'card_bonus' | 'bank_bonus';
export type PlannerRecommendationEffort = 'low' | 'medium' | 'high';

export type PlannerRecommendation = {
  id: string;
  lane: PlannerRecommendationLane;
  kind: PlannerRecommendationKind;
  title: string;
  provider: string;
  estimatedNetValue: number;
  effort: PlannerRecommendationEffort;
  detailPath: string;
  timelineDays?: number;
  keyRequirements: string[];
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
  return {
    id: `bank:${input.slug}`,
    lane: 'banking',
    kind: 'bank_bonus',
    title: input.offerName,
    provider: input.bankName,
    estimatedNetValue: asNetValue(input.bonusAmount - input.estimatedFees),
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

export function buildPlanRecommendationsFromQuiz(
  cardResults: QuizResult[],
  bankingBonuses: BankingBonusListItem[],
  options: { maxCards?: number; maxBanking?: number } = {}
): PlannerRecommendation[] {
  const maxCards = options.maxCards ?? 3;
  const maxBanking = options.maxBanking ?? 3;

  const cardRecommendations = rankPlannerRecommendationsByValue(
    cardResults.slice(0, maxCards).map((card) =>
      toPlannerRecommendationFromCard({
        slug: card.slug,
        name: card.name,
        issuer: card.issuer,
        annualFee: card.annualFee,
        creditTierMin: card.creditTierMin,
        bonusValue: card.bestSignUpBonusValue ?? 0,
        spendRequired: card.bestSignUpBonusSpendRequired ?? 3000,
        spendPeriodDays: card.bestSignUpBonusSpendPeriodDays ?? 90
      })
    )
  );

  const bankingRecommendations = rankPlannerRecommendationsByValue(
    bankingBonuses.slice(0, maxBanking).map(toPlannerRecommendationFromBankingBonus)
  );

  return [...cardRecommendations, ...bankingRecommendations];
}
