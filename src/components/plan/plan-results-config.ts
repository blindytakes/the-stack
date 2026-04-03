import type { FinderCardSelectionStep } from '@/components/tools/card-finder-sections';
import type { PlanScheduleIssueReason } from '@/lib/plan-engine';
import type { QuizRequest } from '@/lib/quiz-engine';
import type { PlannerExclusionReason } from '@/lib/planner-recommendations';

export type EligibilityDraft = Pick<
  QuizRequest,
  'ownedCardSlugs' | 'amexLifetimeBlockedSlugs' | 'chase524Status'
>;

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
  credit_tier: 'Raise approval odds first with utilization and on-time payment improvements.',
  amex_lifetime_rule: 'Amex bonuses are usually once per lifetime per card, so prior Amex holdings can block those offers.',
  chase_5_24: 'Chase cards are hidden when you mark yourself at or above 5/24.',
  direct_deposit_required: 'Routing qualifying direct deposit unlocks most checking bonuses.',
  state_restricted: 'Switch your home state only if it is inaccurate, because some bank offers are region-limited.',
  existing_bank: 'Banks you already use are excluded because most bonuses are for new customers only.',
  insufficient_cash: 'This offer requires a larger opening deposit than your available cash tier allows.'
};

export const scheduleIssueActions: Record<PlanScheduleIssueReason, string> = {
  lane_limit: 'Stronger offers in the same lane took the available plan slots first.',
  spend_capacity: 'Your current spend capacity fit better elsewhere in the sequence.',
  direct_deposit_slot: 'Your direct-deposit bandwidth was already committed to higher-priority banking moves.',
  pace_limit: 'Adding it would have pushed the plan past your selected pace.',
  timeline_overflow: 'It did not fit cleanly inside the current planning window.',
  candidate_pool_limit:
    'It stayed eligible, but it never reached the final scheduler pool after stronger lane candidates were prioritized first.',
  dominated_offer:
    'A stronger offer with equal-or-easier constraints covered the same role in the plan, so this one was dropped before final scheduling.'
};
