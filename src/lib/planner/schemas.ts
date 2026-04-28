import { z } from 'zod';
import { spendingCategoryValues } from '@/lib/cards';
import {
  availableCashValues,
  chase524StatusValues,
  plannerAudienceValues,
  recentCardOpenings24MonthsValues
} from '@/lib/planner/types';
import { plannerModeSchema } from '@/lib/planner/mode';

const creditProfileValues = ['excellent', 'good', 'fair', 'building'] as const;

const slugArraySchema = z
  .array(z.string().trim().min(1))
  .max(50)
  .default([])
  .transform((values) => Array.from(new Set(values)));

const bankNameArraySchema = z
  .array(z.string().trim().min(1))
  .max(50)
  .default([])
  .transform((values) => Array.from(new Set(values)));

const stateSchema = z
  .string()
  .trim()
  .length(2)
  .transform((value) => value.toUpperCase());

const monthlySpendSchema = z.enum(['lt_2500', 'from_2500_to_5000', 'at_least_5000']);
const audienceSchema = z.enum(plannerAudienceValues).default('consumer');

export const fullPlannerAnswersSchema = z.object({
  audience: audienceSchema,
  monthlySpend: monthlySpendSchema,
  state: stateSchema,
  ownedCardSlugs: slugArraySchema,
  availableCash: z.enum(availableCashValues).optional(),
  ownedBankNames: bankNameArraySchema
});

export const cardsOnlyPlannerAnswersSchema = z.object({
  audience: audienceSchema,
  monthlySpend: monthlySpendSchema,
  spend: z.enum(spendingCategoryValues),
  credit: z.enum(creditProfileValues),
  recentCardOpenings24Months: z.enum(recentCardOpenings24MonthsValues).optional(),
  ownedCardSlugs: slugArraySchema
});

export const plannerEligibilityOverridesSchema = z.object({
  amexLifetimeBlockedSlugs: slugArraySchema,
  chase524Status: z.enum(chase524StatusValues).optional()
});

const plannerContextBaseSchema = z.object({
  mode: plannerModeSchema,
  audience: audienceSchema,
  monthlySpend: monthlySpendSchema,
  ownedCardSlugs: slugArraySchema,
  amexLifetimeBlockedSlugs: slugArraySchema,
  chase524Status: z.enum(chase524StatusValues)
});

export const fullPlannerContextSchema = plannerContextBaseSchema.extend({
  mode: z.literal('full'),
  directDeposit: z.enum(['yes', 'no']),
  state: stateSchema,
  availableCash: z.enum(availableCashValues),
  ownedBankNames: bankNameArraySchema
});

export const cardsOnlyPlannerContextSchema = plannerContextBaseSchema.extend({
  mode: z.literal('cards_only'),
  spend: z.enum(spendingCategoryValues),
  credit: z.enum(creditProfileValues)
});

export const plannerContextSchema = z.discriminatedUnion('mode', [
  fullPlannerContextSchema,
  cardsOnlyPlannerContextSchema
]);

export type FullPlannerAnswers = z.infer<typeof fullPlannerAnswersSchema>;
export type CardsOnlyPlannerAnswers = z.infer<typeof cardsOnlyPlannerAnswersSchema>;
export type PlannerEligibilityOverrides = z.infer<typeof plannerEligibilityOverridesSchema>;
export type FullPlannerContext = z.infer<typeof fullPlannerContextSchema>;
export type CardsOnlyPlannerContext = z.infer<typeof cardsOnlyPlannerContextSchema>;
export type PlannerContext = z.infer<typeof plannerContextSchema>;
