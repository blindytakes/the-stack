import { z } from 'zod';
import type { CardRecord } from '@/lib/cards';
import { spendingCategoryValues } from '@/lib/cards';

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
    .default('NY'),
  openingCash: z.enum(['lt_2000', 'from_2000_to_10000', 'at_least_10000']).default('from_2000_to_10000')
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;

const creditRank: Record<CardRecord['creditTierMin'], number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  building: 1
};

const goalMap: Record<QuizRequest['goal'], CardRecord['rewardType'][]> = {
  cashback: ['cashback'],
  travel: ['points', 'miles'],
  flexibility: ['cashback', 'points', 'miles']
};

function scoreCard(card: CardRecord, input: QuizRequest) {
  let score = 0;

  if (!goalMap[input.goal].includes(card.rewardType)) {
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

export type QuizResult = CardRecord & { score: number };

// Return highest scoring eligible cards first. Keep more than top-3 so
// downstream planners can enforce stricter fit filters without running dry.
export function rankQuizResults(cards: CardRecord[], input: QuizRequest): QuizResult[] {
  const eligible = cards.filter((card) => creditRank[card.creditTierMin] <= creditRank[input.credit]);

  return eligible
    .map((card) => ({
      ...card,
      score: scoreCard(card, input)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
