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
  }
];
