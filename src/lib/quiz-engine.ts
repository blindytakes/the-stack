import { z } from 'zod';
import type { CardRecord } from '@/lib/cards';
import { spendingCategoryValues } from '@/lib/cards';
import { isCardBlockedByIssuerRules } from '@/lib/issuer-rules';
import { meetsCreditTier, scoreCardFit } from '@/lib/scoring-policy';

/**
 * Quiz ranking logic for card recommendations.
 *
 * The model is heuristic and deterministic: each eligible card gets
 * points for spend-category fit against user spending profile.
 */

export const quizRequestSchema = z.object({
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
  pace: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced')
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;

export type QuizResult = CardRecord & { score: number };

// Return highest scoring eligible cards first. Keep the list focused on
// net-new openings and issuer-eligible bonuses.
export function rankQuizResults(cards: CardRecord[], input: QuizRequest): QuizResult[] {
  const ownedCardSlugSet = new Set(input.ownedCardSlugs);
  const eligible = cards.filter(
    (card) =>
      meetsCreditTier(card.creditTierMin, input.credit) &&
      !ownedCardSlugSet.has(card.slug) &&
      !isCardBlockedByIssuerRules(card, input)
  );

  return eligible
    .map((card) => ({
      ...card,
      score: scoreCardFit(card, input)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
