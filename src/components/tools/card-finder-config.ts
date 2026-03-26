'use client';

import { usStateOptions, type FinderQuestionStep } from '@/components/tools/card-finder-sections';
import type { PlannerAudience } from '@/lib/quiz-engine';

function buildMonthlySpendStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'monthlySpend',
    type: 'options',
    title:
      audience === 'business'
        ? 'How much monthly business spend can you shift to a new card?'
        : 'How much monthly spend can you shift to a new card?',
    description:
      audience === 'business'
        ? 'This keeps business-card minimum-spend targets grounded in the expenses your business can actually route.'
        : 'This keeps the plan realistic when we sequence minimum-spend windows.',
    options: [
      { label: 'Under $2,500', value: 'lt_2500' },
      { label: '$2,500 to $5,000', value: 'from_2500_to_5000' },
      { label: '$5,000+', value: 'at_least_5000' }
    ]
  };
}

function buildDirectDepositStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'directDeposit',
    type: 'options',
    title:
      audience === 'business'
        ? 'Can your business route qualifying deposits to a new bank account?'
        : 'Can you route direct deposit to a new bank account?',
    description:
      audience === 'business'
        ? 'This keeps the business-banking lane focused on offers your company can actually complete.'
        : 'This unlocks or removes most checking account bonus paths, which can be stacked to earn over $3,000/year.',
    options: [
      { label: 'Yes, I can route direct deposit', value: 'yes' },
      { label: 'No, I cannot route direct deposit', value: 'no' }
    ]
  };
}

function buildChase524Step(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'chase524Status',
    type: 'options',
    title: 'What is your Chase 5/24 status?',
    description:
      audience === 'business'
        ? 'Most business-card applications still lean on your personal credit profile, so 5/24 can change which Chase business cards stay viable.'
        : '5/24 is a Chase rule that limits you to 5 new credit card accounts every 24 months. This impacts which Chase cards you can open and how we sequence your plan.',
    options: [
      { label: 'Under 5/24', value: 'under_5_24' },
      { label: 'At or over 5/24', value: 'at_or_over_5_24' },
      { label: 'Not sure', value: 'not_sure' }
    ]
  };
}

function buildStateStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'state',
    type: 'select',
    title:
      audience === 'business'
        ? 'What state is your business based in?'
        : 'What state do you live in?',
    description:
      audience === 'business'
        ? 'Some business bank bonuses are state-limited, so this keeps ineligible offers out.'
        : 'Some bank bonuses are state-limited, so this keeps ineligible offers out.',
    placeholder: 'Select your state',
    options: usStateOptions
  };
}

function buildOwnedCardsStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'ownedCardSlugs',
    type: 'card_selection',
    title:
      audience === 'business'
        ? 'Which business cards do you already have?'
        : 'Which cards do you already have?',
    description:
      audience === 'business'
        ? 'We will exclude business cards you already have from new-business-card recommendations.'
        : 'We will exclude cards you already have from new-card recommendations.'
  };
}

function buildAvailableCashStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'availableCash',
    type: 'options',
    title:
      audience === 'business'
        ? 'How much cash can your business set aside for bank bonuses?'
        : 'How much cash can you set aside for bank bonuses?',
    description:
      audience === 'business'
        ? 'Optional. Some business bank bonuses require a minimum opening deposit. Skip this and we will use a middle-range assumption.'
        : 'Optional. Some bank bonuses require a minimum opening deposit. Skip this and we will use a middle-range assumption.',
    optional: true,
    options: [
      { label: 'Up to $2,500', value: 'up_to_2500' },
      { label: '$2,501 – $9,999', value: 'from_2501_to_9999' },
      { label: '$10,000+', value: 'at_least_10000' }
    ]
  };
}

function buildOwnedBanksStep(audience: PlannerAudience): FinderQuestionStep {
  return {
    id: 'ownedBankNames',
    type: 'bank_selection',
    title:
      audience === 'business'
        ? 'Which banks do you already use for business banking?'
        : 'Which banks do you already have accounts with?',
    description:
      audience === 'business'
        ? 'Optional. We will exclude banks you already use for business banking from new-account recommendations.'
        : 'Optional. We will exclude banks you already use from new-account recommendations.'
  };
}

export function buildCardFinderSteps(options: {
  directDeposit?: 'yes' | 'no';
  audience?: PlannerAudience;
} = {}): FinderQuestionStep[] {
  const audience = options.audience ?? 'consumer';
  const includeAvailableCash = options.directDeposit !== 'no';
  const includeChase524Step = audience !== 'business';

  return [
    buildMonthlySpendStep(audience),
    buildDirectDepositStep(audience),
    ...(includeChase524Step ? [buildChase524Step(audience)] : []),
    buildStateStep(audience),
    buildOwnedCardsStep(audience),
    ...(includeAvailableCash ? [buildAvailableCashStep(audience)] : []),
    buildOwnedBanksStep(audience)
  ];
}
