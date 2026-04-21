import {
  getChase524StatusFromRecentCardOpenings
} from '@/lib/planner/ranking-engine';
import type { PlannerMode } from '@/lib/planner/mode';
import {
  cardsOnlyPlannerAnswersSchema,
  fullPlannerAnswersSchema,
  plannerContextSchema,
  plannerEligibilityOverridesSchema,
  type PlannerContext
} from '@/lib/planner/schemas';

const defaultAvailableCash = 'from_2501_to_9999' as const;

type NormalizePlannerContextInput = {
  mode: PlannerMode;
  answers: unknown;
  overrides?: unknown;
};

export function normalizePlannerContext(input: NormalizePlannerContextInput): PlannerContext {
  const overrides = plannerEligibilityOverridesSchema.parse(input.overrides ?? {});

  if (input.mode === 'full') {
    const answers = fullPlannerAnswersSchema.parse(input.answers);
    return plannerContextSchema.parse({
      mode: input.mode,
      audience: answers.audience,
      monthlySpend: answers.monthlySpend,
      directDeposit: answers.directDeposit,
      state: answers.state,
      ownedCardSlugs: answers.ownedCardSlugs,
      availableCash: answers.availableCash ?? defaultAvailableCash,
      ownedBankNames: answers.ownedBankNames,
      amexLifetimeBlockedSlugs: overrides.amexLifetimeBlockedSlugs,
      chase524Status: overrides.chase524Status ?? 'not_sure'
    });
  } else {
    const answers = cardsOnlyPlannerAnswersSchema.parse(input.answers);
    return plannerContextSchema.parse({
      mode: input.mode,
      audience: answers.audience,
      monthlySpend: answers.monthlySpend,
      spend: answers.spend,
      credit: answers.credit,
      ownedCardSlugs: answers.ownedCardSlugs,
      amexLifetimeBlockedSlugs: overrides.amexLifetimeBlockedSlugs,
      chase524Status:
        overrides.chase524Status ??
        getChase524StatusFromRecentCardOpenings(answers.recentCardOpenings24Months)
    });
  }
}
