'use client';

import { usStateOptions, type FinderQuestionStep } from '@/components/tools/card-finder-sections';

const monthlySpendStep: FinderQuestionStep = {
  id: 'monthlySpend',
  type: 'options',
  title: 'How much monthly spend can you shift to a new card?',
  description: 'This keeps the plan realistic when we sequence minimum-spend windows.',
  options: [
    { label: 'Under $2,500', value: 'lt_2500' },
    { label: '$2,500 to $5,000', value: 'from_2500_to_5000' },
    { label: '$5,000+', value: 'at_least_5000' }
  ]
};

const directDepositStep: FinderQuestionStep = {
  id: 'directDeposit',
  type: 'options',
  title: 'Can you route direct deposit to a new bank account?',
  description:
    'This unlocks or removes most checking account bonus paths, which can be stacked to earn over $3,000/year.',
  options: [
    { label: 'Yes, I can route direct deposit', value: 'yes' },
    { label: 'No, I cannot route direct deposit', value: 'no' }
  ]
};

const chase524Step: FinderQuestionStep = {
  id: 'chase524Status',
  type: 'options',
  title: 'What is your Chase 5/24 status?',
  description:
    '5/24 is a Chase rule that limits you to 5 new credit card accounts every 24 months. This impacts which Chase cards you can open and how we sequence your plan.',
  options: [
    { label: 'Under 5/24', value: 'under_5_24' },
    { label: 'At or over 5/24', value: 'at_or_over_5_24' },
    { label: 'Not sure', value: 'not_sure' }
  ]
};

const stateStep: FinderQuestionStep = {
  id: 'state',
  type: 'select',
  title: 'What state do you live in?',
  description: 'Some bank bonuses are state-limited, so this keeps ineligible offers out.',
  placeholder: 'Select your state',
  options: usStateOptions
};

const ownedCardsStep: FinderQuestionStep = {
  id: 'ownedCardSlugs',
  type: 'card_selection',
  title: 'Which cards do you already have?',
  description:
    'We will exclude cards you already have from new-card recommendations.'
};

const availableCashStep: FinderQuestionStep = {
  id: 'availableCash',
  type: 'options',
  title: 'How much cash can you set aside for bank bonuses?',
  description:
    'Optional. Some bank bonuses require a minimum opening deposit. Skip this and we will use a middle-range assumption.',
  optional: true,
  options: [
    { label: 'Up to $2,500', value: 'up_to_2500' },
    { label: '$2,501 – $9,999', value: 'from_2501_to_9999' },
    { label: '$10,000+', value: 'at_least_10000' }
  ]
};

const ownedBanksStep: FinderQuestionStep = {
  id: 'ownedBankNames',
  type: 'bank_selection',
  title: 'Which banks do you already have accounts with?',
  description: 'Optional. We will exclude banks you already use from new-account recommendations.'
};

export function buildCardFinderSteps(directDeposit?: 'yes' | 'no'): FinderQuestionStep[] {
  const includeAvailableCash = directDeposit !== 'no';

  return [
    monthlySpendStep,
    directDepositStep,
    chase524Step,
    stateStep,
    ownedCardsStep,
    ...(includeAvailableCash ? [availableCashStep] : []),
    ownedBanksStep
  ];
}
