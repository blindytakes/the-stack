'use client';

import { usStateOptions, type FinderQuestionStep } from '@/components/tools/card-finder-sections';

export const cardFinderSteps: FinderQuestionStep[] = [
  {
    id: 'monthlySpend',
    type: 'options',
    title: 'How much normal monthly spend can you put on a new card?',
    description: 'This keeps the plan realistic when we sequence minimum-spend windows.',
    options: [
      { label: 'Under $2,500', value: 'lt_2500' },
      { label: '$2,500 to $5,000', value: 'from_2500_to_5000' },
      { label: '$5,000+', value: 'at_least_5000' }
    ]
  },
  {
    id: 'directDeposit',
    type: 'options',
    title: 'Can you route direct deposit to a new bank account?',
    description: 'This unlocks or removes most checking account bonus paths, which can be stacked to earn over $3,000/year.',
    options: [
      { label: 'Yes, I can route direct deposit', value: 'yes' },
      { label: 'No, I cannot route direct deposit', value: 'no' }
    ]
  },
  {
    id: 'credit',
    type: 'options',
    title: 'How would you describe your credit profile?',
    description: 'We use this to keep recommendations inside a realistic approval band.',
    options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Building', value: 'building' }
    ]
  },
  {
    id: 'chase524Status',
    type: 'options',
    title: 'What is your Chase 5/24 status?',
    description: '5/24 is a Chase rule that limits you to 5 new credit card accounts every 24 months. This impacts which Chase cards you can open and how we sequence your plan.',
    options: [
      { label: 'Under 5/24', value: 'under_5_24' },
      { label: 'At or over 5/24', value: 'at_or_over_5_24' },
      { label: 'Not sure', value: 'not_sure' }
    ]
  },
  {
    id: 'state',
    type: 'select',
    title: 'What state do you live in?',
    description: 'Some bank bonuses are state-limited, so this keeps ineligible offers out.',
    placeholder: 'Select your state',
    helperText: 'Choose "Other / not listed" if you are outside the 50 states or D.C.',
    options: usStateOptions
  },
  {
    id: 'ownedCardSlugs',
    type: 'card_selection',
    title: 'Which cards do you already have?',
    description: 'Optional, but useful. We will exclude cards you already have from new-card recommendations.'
  }
];
