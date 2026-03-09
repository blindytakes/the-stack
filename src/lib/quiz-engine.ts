import { z } from 'zod';
import type { CardRecord } from '@/lib/cards';
import { spendingCategoryValues } from '@/lib/cards';
import { meetsCreditTier, scoreCardFit } from '@/lib/scoring-policy';

/**
 * Quiz ranking logic for card recommendations.
 *
 * The model is heuristic and deterministic: each eligible card gets
 * points/penalties for goal fit, spend-category fit, and fee tolerance.
 */

export const quizRequestSchema = z.object({
  goal: z.enum(['cashback', 'travel', 'flexibility']),
  spend: z.enum(spendingCategoryValues),
  fee: z.enum(['no_fee', 'up_to_95', 'over_95_ok']),
  credit: z.enum(['excellent', 'good', 'fair', 'building']),
  directDeposit: z.enum(['yes', 'no']).default('yes'),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .default('OT'),
  openingCash: z.enum(['lt_2000', 'from_2000_to_10000', 'at_least_10000']).default('from_2000_to_10000'),
  monthlySpend: z
    .enum(['lt_1000', 'from_1000_to_2500', 'from_2500_to_5000', 'at_least_5000'])
    .default('from_2500_to_5000'),
  pace: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced')
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;

export type QuizResult = CardRecord & { score: number };

// Return highest scoring eligible cards first. Keep more than top-3 so
// downstream planners can enforce stricter fit filters without running dry.
export function rankQuizResults(cards: CardRecord[], input: QuizRequest): QuizResult[] {
  const eligible = cards.filter((card) => meetsCreditTier(card.creditTierMin, input.credit));

  return eligible
    .map((card) => ({
      ...card,
      score: scoreCardFit(card, input)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
