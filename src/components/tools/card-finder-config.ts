'use client';

import type { QuizRequest } from '@/lib/quiz-engine';

export type FinderStep = {
  id: keyof QuizRequest;
  title: string;
  options: Array<{ label: string; value: string }>;
};

export const cardFinderSteps: FinderStep[] = [
  {
    id: 'goal',
    title: 'Your main goal',
    options: [
      { label: 'Fast cash value', value: 'cashback' },
      { label: 'High travel upside', value: 'travel' },
      { label: 'Flexible everyday returns', value: 'flexibility' }
    ]
  },
  {
    id: 'spend',
    title: 'Biggest monthly spend',
    options: [
      { label: 'Groceries', value: 'groceries' },
      { label: 'Dining', value: 'dining' },
      { label: 'Travel', value: 'travel' },
      { label: 'Everything', value: 'all' }
    ]
  },
  {
    id: 'fee',
    title: 'Annual fee preference',
    options: [
      { label: 'No annual fee', value: 'no_fee' },
      { label: 'Up to $95', value: 'up_to_95' },
      { label: 'Over $95 is ok', value: 'over_95_ok' }
    ]
  },
  {
    id: 'credit',
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
    title: 'Can you route direct deposit to a new bank account?',
    options: [
      { label: 'Yes, I can route direct deposit', value: 'yes' },
      { label: 'No, I cannot route direct deposit', value: 'no' }
    ]
  },
  {
    id: 'openingCash',
    title: 'How much cash can you set aside for opening deposits?',
    options: [
      { label: 'Under $2,000', value: 'lt_2000' },
      { label: '$2,000 to $10,000', value: 'from_2000_to_10000' },
      { label: '$10,000+', value: 'at_least_10000' }
    ]
  },
  {
    id: 'state',
    title: 'Where do you live?',
    options: [
      { label: 'California (CA)', value: 'CA' },
      { label: 'Oregon (OR)', value: 'OR' },
      { label: 'Washington (WA)', value: 'WA' },
      { label: 'New York (NY)', value: 'NY' },
      { label: 'Texas (TX)', value: 'TX' },
      { label: 'Florida (FL)', value: 'FL' },
      { label: 'Other U.S. State', value: 'OT' }
    ]
  }
];
