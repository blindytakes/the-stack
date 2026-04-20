import { z } from 'zod';

export const plannerQuestionSetValues = ['full', 'cards_only'] as const;

export const plannerQuestionSetSchema = z.enum(plannerQuestionSetValues);

export type PlannerQuestionSet = z.infer<typeof plannerQuestionSetSchema>;

export function resolvePlannerQuestionSet(
  questionSet: PlannerQuestionSet | undefined,
  options: { maxBanking?: number } = {}
): PlannerQuestionSet {
  if (questionSet) {
    return questionSet;
  }

  return options.maxBanking === 0 ? 'cards_only' : 'full';
}

export function plannerUsesSpendCategory(questionSet: PlannerQuestionSet): boolean {
  return questionSet === 'cards_only';
}

export function plannerUsesCreditProfile(questionSet: PlannerQuestionSet): boolean {
  return questionSet === 'cards_only';
}
