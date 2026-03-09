import type { FinderCardSelectionStep } from '@/components/tools/card-finder-sections';
import type { PlanResultsStoragePayload } from '@/lib/plan-results-storage';
import type { QuizRequest } from '@/lib/quiz-engine';
import type {
  PlannerExcludedOffer,
  PlannerExclusionReason,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

export type EligibilityDraft = Pick<
  QuizRequest,
  'ownedCardSlugs' | 'amexLifetimeBlockedSlugs' | 'chase524Status'
>;

export type PlanApiResponse = {
  generatedAt: number;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanResultsStoragePayload['schedule'];
};

export const ownedCardsEditorStep: FinderCardSelectionStep = {
  id: 'ownedCardSlugs',
  type: 'card_selection',
  title: 'Which cards do you already have?',
  description: 'We will keep current cards out of new-card recommendations.'
};

export const amexHistoryEditorStep: FinderCardSelectionStep = {
  id: 'amexLifetimeBlockedSlugs',
  type: 'card_selection',
  title: 'Any other Amex cards you have had before?',
  description:
    'Skip Amex cards you already marked as open. We use this only for additional Amex cards you have opened in the past and closed.'
};

export const chase524Options: Array<{
  label: string;
  value: QuizRequest['chase524Status'];
  description: string;
}> = [
  {
    label: 'Under 5/24',
    value: 'under_5_24',
    description: 'Keep Chase cards eligible.'
  },
  {
    label: 'At or over 5/24',
    value: 'at_or_over_5_24',
    description: 'Hide Chase cards until you drop below the rule.'
  },
  {
    label: 'Not sure',
    value: 'not_sure',
    description: 'Leave Chase cards in the mix for now.'
  }
];

export const exclusionActions: Record<PlannerExclusionReason, string> = {
  no_signup_bonus: 'Focus on offers with active welcome bonuses only.',
  fee_preference: 'Loosen your annual-fee preference to see more high-upside card options.',
  credit_tier: 'Raise approval odds first with utilization and on-time payment improvements.',
  amex_lifetime_rule: 'Amex bonuses are usually once per lifetime per card, so prior Amex holdings can block those offers.',
  chase_5_24: 'Chase cards are hidden when you mark yourself at or above 5/24.',
  direct_deposit_required: 'Routing payroll direct deposit unlocks most checking bonuses.',
  state_restricted: 'Some bank bonuses are limited by state eligibility rules.'
};
