import type { CardRecord } from '@/lib/cards';
import { isCardBlockedByIssuerRules } from '@/lib/issuer-rules';
import type { PlannerContext } from '@/lib/planner/schemas';
import type { Chase524Status, RecentCardOpenings24Months } from '@/lib/planner/types';
import {
  estimateCardOpenValue,
  meetsCreditTier,
  scoreCardFit
} from '@/lib/scoring-policy';

/**
 * Planner card-ranking logic.
 *
 * The model is heuristic and deterministic: each eligible card gets
 * points for spend-category fit against the user's spending profile.
 */

export type RankedCardResult = CardRecord & { score: number };

type PlannerCardRankingInput = Pick<
  PlannerContext,
  'audience' | 'ownedCardSlugs' | 'amexLifetimeBlockedSlugs' | 'chase524Status'
> & {
  credit?: 'excellent' | 'good' | 'fair' | 'building';
  spend?: CardRecord['topCategories'][number];
};

export function getChase524StatusFromRecentCardOpenings(
  value: RecentCardOpenings24Months | undefined
): Chase524Status {
  if (value === 'five_or_more') {
    return 'at_or_over_5_24';
  }

  if (value === 'two_or_less' || value === 'three_to_four') {
    return 'under_5_24';
  }

  return 'not_sure';
}

function rankCards(
  cards: CardRecord[],
  input: PlannerCardRankingInput,
  options: {
    useCreditProfile: boolean;
    useSpendCategory: boolean;
  }
): RankedCardResult[] {
  const ownedCardSlugSet = new Set(input.ownedCardSlugs);
  const audienceMatchesCardType = (card: CardRecord) =>
    input.audience === 'business' ? card.cardType === 'business' : card.cardType !== 'business';
  const eligible = cards.filter(
    (card) =>
      audienceMatchesCardType(card) &&
      (!options.useCreditProfile ||
        (input.credit !== undefined && meetsCreditTier(card.creditTierMin, input.credit))) &&
      !ownedCardSlugSet.has(card.slug) &&
      !isCardBlockedByIssuerRules(card, input)
  );

  return eligible
    .map((card) => ({
      ...card,
      score:
        options.useSpendCategory && input.spend !== undefined
          ? scoreCardFit(card, { spend: input.spend })
          : 0
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (options.useSpendCategory
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
    );
}

export function rankPlannerResults(
  cards: CardRecord[],
  context: PlannerContext
): RankedCardResult[] {
  return rankCards(cards, context, {
    useCreditProfile: context.mode === 'cards_only',
    useSpendCategory: context.mode === 'cards_only'
  });
}
