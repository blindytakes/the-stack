import { z } from 'zod';
import type { CardRecord } from '@/lib/cards';
import { spendingCategoryValues } from '@/lib/cards';
import { isCardBlockedByIssuerRules } from '@/lib/issuer-rules';
import type { PlannerQuestionSet } from '@/lib/planner-question-set';
import {
  plannerUsesCreditProfile,
  plannerUsesSpendCategory
} from '@/lib/planner-question-set';
import {
  estimateCardOpenValue,
  meetsCreditTier,
  scoreCardFit
} from '@/lib/scoring-policy';

/**
 * Quiz ranking logic for card recommendations.
 *
 * The model is heuristic and deterministic: each eligible card gets
 * points for spend-category fit against user spending profile.
 */

export const availableCashValues = ['up_to_2500', 'from_2501_to_9999', 'at_least_10000'] as const;
export type AvailableCash = (typeof availableCashValues)[number];

export const bankAccountPreferenceValues = ['checking', 'savings', 'no_preference'] as const;
export type BankAccountPreference = (typeof bankAccountPreferenceValues)[number];

export const plannerAudienceValues = ['consumer', 'business'] as const;
export type PlannerAudience = (typeof plannerAudienceValues)[number];

export const recentCardOpenings24MonthsValues = [
  'two_or_less',
  'three_to_four',
  'five_or_more'
] as const;
export type RecentCardOpenings24Months = (typeof recentCardOpenings24MonthsValues)[number];

export const quizRequestSchema = z.object({
  audience: z.enum(plannerAudienceValues).default('consumer'),
  goal: z.enum(['cashback', 'travel', 'flexibility']),
  spend: z.enum(spendingCategoryValues),
  fee: z.enum(['no_fee', 'up_to_95', 'over_95_ok']),
  credit: z.enum(['excellent', 'good', 'fair', 'building']),
  ownedCardSlugs: z
    .array(z.string().trim().min(1))
    .max(50)
    .default([])
    .transform((slugs) => Array.from(new Set(slugs))),
  amexLifetimeBlockedSlugs: z
    .array(z.string().trim().min(1))
    .max(50)
    .default([])
    .transform((slugs) => Array.from(new Set(slugs))),
  recentCardOpenings24Months: z.enum(recentCardOpenings24MonthsValues).optional(),
  chase524Status: z.enum(['under_5_24', 'at_or_over_5_24', 'not_sure']).default('not_sure'),
  directDeposit: z.enum(['yes', 'no']).default('yes'),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .default('OT'),
  monthlySpend: z
    .enum(['lt_2500', 'from_2500_to_5000', 'at_least_5000'])
    .default('from_2500_to_5000'),
  pace: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
  availableCash: z.enum(availableCashValues).default('from_2501_to_9999'),
  bankAccountPreference: z.enum(bankAccountPreferenceValues).default('no_preference'),
  ownedBankNames: z
    .array(z.string().trim().min(1))
    .max(50)
    .default([])
    .transform((names) => Array.from(new Set(names)))
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;

export type QuizResult = CardRecord & { score: number };

export function getChase524StatusFromRecentCardOpenings(
  value: RecentCardOpenings24Months | undefined
): QuizRequest['chase524Status'] {
  if (value === 'five_or_more') {
    return 'at_or_over_5_24';
  }

  if (value === 'two_or_less' || value === 'three_to_four') {
    return 'under_5_24';
  }

  return 'not_sure';
}

// Return highest scoring eligible cards first. Keep the list focused on
// net-new openings and issuer-eligible bonuses.
export function rankQuizResults(
  cards: CardRecord[],
  input: QuizRequest,
  options: {
    questionSet?: PlannerQuestionSet;
  } = {}
): QuizResult[] {
  const questionSet = options.questionSet ?? 'cards_only';
  const useCreditProfile = plannerUsesCreditProfile(questionSet);
  const useSpendCategory = plannerUsesSpendCategory(questionSet);
  const ownedCardSlugSet = new Set(input.ownedCardSlugs);
  const eligible = cards.filter(
    (card) =>
      (input.audience !== 'business' || card.cardType === 'business') &&
      (!useCreditProfile || meetsCreditTier(card.creditTierMin, input.credit)) &&
      !ownedCardSlugSet.has(card.slug) &&
      !isCardBlockedByIssuerRules(card, input)
  );

  return eligible
    .map((card) => ({
      ...card,
      score: useSpendCategory ? scoreCardFit(card, input) : 0
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (useSpendCategory
          ? 0
          : estimateCardOpenValue({
              bonusValue: b.bestSignUpBonusValue ?? 0,
              plannerBenefitsValue: b.plannerBenefitsValue,
              annualFee: b.annualFee
            }) -
            estimateCardOpenValue({
              bonusValue: a.bestSignUpBonusValue ?? 0,
              plannerBenefitsValue: a.plannerBenefitsValue,
              annualFee: a.annualFee
            }))
    )
    .slice(0, 12);
}
