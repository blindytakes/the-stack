'use client';

import type { FinderQuestionStep } from '@/components/tools/card-finder-sections';

export const cardFinderSteps: FinderQuestionStep[] = [
  {
    id: 'ownedCardSlugs',
    type: 'card_selection',
    title: 'Which cards do you already have?',
    description: 'Optional, but useful. We will exclude cards you already have from new-card recommendations.'
  },
  {
    id: 'chase524Status',
    type: 'options',
    title: 'What is your Chase 5/24 status?',
    options: [
      { label: 'Under 5/24', value: 'under_5_24' },
      { label: 'At or over 5/24', value: 'at_or_over_5_24' },
      { label: 'Not sure', value: 'not_sure' }
    ]
  },
  {
    id: 'credit',
    type: 'options',
    title: 'Credit tier',
    options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Building', value: 'building' }
    ]
  },
  {
    id: 'directDeposit',
    type: 'options',
    title: 'Can you route direct deposit to a new bank account?',
    options: [
      { label: 'Yes, I can route direct deposit', value: 'yes' },
      { label: 'No, I cannot route direct deposit', value: 'no' }
    ]
  }
];
