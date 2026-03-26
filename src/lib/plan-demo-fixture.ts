import { buildPlanResultsPayload, type PlanResultsStoragePayload } from '@/lib/plan-results-storage';
import type { PlannerExcludedOffer, PlannerRecommendation } from '@/lib/planner-recommendations';

function at(date: string) {
  return new Date(date).getTime();
}

const savedAt = at('2026-03-12T09:00:00-04:00');

const recommendations: PlannerRecommendation[] = [
  {
    id: 'card:chase-sapphire-preferred',
    lane: 'cards',
    kind: 'card_bonus',
    title: 'Chase Sapphire Preferred Card',
    provider: 'Chase',
    estimatedNetValue: 905,
    valueBreakdown: {
      headlineValue: 1000,
      headlineLabel: 'Welcome bonus',
      annualFee: 95
    },
    priorityScore: 98,
    effort: 'medium',
    detailPath: '/cards/chase-sapphire-preferred',
    timelineDays: 90,
    keyRequirements: [
      'Spend $5,000 within 3 months',
      'Strong fit if you want transferable travel points',
      'Pay statements in full to avoid interest drag'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 5000
    }
  },
  {
    id: 'bank:harbor-federal-checking-savings-500',
    lane: 'banking',
    kind: 'bank_bonus',
    title: 'Premier Checking + Savings Bonus',
    provider: 'Harbor Federal',
    estimatedNetValue: 460,
    valueBreakdown: {
      headlineValue: 500,
      headlineLabel: 'Bank bonus',
      estimatedFees: 40
    },
    priorityScore: 90,
    effort: 'medium',
    detailPath: '/banking/harbor-federal-checking-savings-500',
    timelineDays: 90,
    keyRequirements: [
      'Set up qualifying direct deposit within 60 days',
      'Maintain a $15,000 combined balance through day 90',
      'Save the offer terms and confirmation email'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 21,
      requiredDeposit: 15000,
      requiresDirectDeposit: true
    }
  },
  {
    id: 'card:amex-gold-card',
    lane: 'cards',
    kind: 'card_bonus',
    title: 'American Express Gold Card',
    provider: 'American Express',
    estimatedNetValue: 845,
    valueBreakdown: {
      headlineValue: 1000,
      headlineLabel: 'Welcome bonus',
      benefitAdjustment: 170,
      annualFee: 325
    },
    priorityScore: 84,
    effort: 'medium',
    detailPath: '/cards/amex-gold-card',
    timelineDays: 90,
    keyRequirements: [
      'Spend $4,000 within 3 months',
      'Best fit if dining and grocery spend is already high',
      'Track the annual fee against the first-year value'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 4000
    }
  },
  {
    id: 'bank:summit-national-checking-300',
    lane: 'banking',
    kind: 'bank_bonus',
    title: 'Summit National Checking Bonus',
    provider: 'Summit National',
    estimatedNetValue: 300,
    valueBreakdown: {
      headlineValue: 300,
      headlineLabel: 'Bank bonus',
      estimatedFees: 0
    },
    priorityScore: 78,
    effort: 'low',
    detailPath: '/banking/summit-national-checking-300',
    timelineDays: 90,
    keyRequirements: [
      'Complete 10 debit transactions within 60 days',
      'Receive one qualifying direct deposit',
      'Keep the account open through day 90'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 21,
      requiresDirectDeposit: true
    }
  },
  {
    id: 'card:bilt-mastercard',
    lane: 'cards',
    kind: 'card_bonus',
    title: 'Bilt Mastercard',
    provider: 'Bilt',
    estimatedNetValue: 260,
    valueBreakdown: {
      headlineValue: 300,
      headlineLabel: 'Welcome bonus'
    },
    priorityScore: 71,
    effort: 'low',
    detailPath: '/cards/bilt-mastercard',
    timelineDays: 90,
    keyRequirements: [
      'Make 5 purchases in the first 90 days',
      'Useful if rent payments are part of the monthly mix',
      'Keep usage light if the main goal is just the intro value'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 500
    }
  },
  {
    id: 'card:citi-premier-card',
    lane: 'cards',
    kind: 'card_bonus',
    title: 'Citi Premier Card',
    provider: 'Citi',
    estimatedNetValue: 755,
    valueBreakdown: {
      headlineValue: 850,
      headlineLabel: 'Welcome bonus',
      annualFee: 95
    },
    priorityScore: 68,
    effort: 'medium',
    detailPath: '/cards/citi-premier-card',
    timelineDays: 90,
    keyRequirements: [
      'Spend $4,000 within 3 months',
      'ThankYou points transfer to airline and hotel partners',
      'No 5/24 restriction — opens outside the Chase window'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 4000
    }
  },
  {
    id: 'card:capital-one-savor-rewards',
    lane: 'cards',
    kind: 'card_bonus',
    title: 'Capital One SavorOne Rewards Card',
    provider: 'Capital One',
    estimatedNetValue: 200,
    valueBreakdown: {
      headlineValue: 200,
      headlineLabel: 'Welcome bonus'
    },
    priorityScore: 60,
    effort: 'low',
    detailPath: '/cards/capital-one-savor-rewards',
    timelineDays: 90,
    keyRequirements: [
      'Spend $500 within 3 months',
      'No annual fee — low risk for a bonus slot',
      'Good stacking pick for dining and entertainment'
    ],
    scheduleConstraints: {
      activeDays: 90,
      payoutLagDays: 30,
      requiredSpend: 500
    }
  },
  {
    id: 'bank:coastal-credit-union-checking-200',
    lane: 'banking',
    kind: 'bank_bonus',
    title: 'Coastal Credit Union Checking Bonus',
    provider: 'Coastal Credit Union',
    estimatedNetValue: 200,
    valueBreakdown: {
      headlineValue: 200,
      headlineLabel: 'Bank bonus',
      estimatedFees: 0
    },
    priorityScore: 65,
    effort: 'low',
    detailPath: '/banking/coastal-credit-union-checking-200',
    timelineDays: 60,
    keyRequirements: [
      'Open with $25 minimum deposit',
      'Set up direct deposit within 30 days',
      'Keep the account open for 90 days'
    ],
    scheduleConstraints: {
      activeDays: 60,
      payoutLagDays: 14,
      requiresDirectDeposit: true
    }
  }
];

const exclusions: PlannerExcludedOffer[] = [
  {
    id: 'card:capital-one-venture-x-rewards',
    lane: 'cards',
    title: 'Capital One Venture X Rewards Credit Card',
    provider: 'Capital One',
    reasons: ['credit_tier']
  },
  {
    id: 'card:amex-platinum-card',
    lane: 'cards',
    title: 'The Platinum Card from American Express',
    provider: 'American Express',
    reasons: ['amex_lifetime_rule']
  },
  {
    id: 'bank:atlas-online-savings-250',
    lane: 'banking',
    title: 'Atlas Online Savings Bonus',
    provider: 'Atlas Bank',
    reasons: ['state_restricted']
  },
  {
    id: 'bank:granite-state-checking-150',
    lane: 'banking',
    title: 'Granite State Checking Bonus',
    provider: 'Granite State',
    reasons: ['direct_deposit_required']
  }
];

const schedule = [
  {
    recommendationId: 'card:chase-sapphire-preferred',
    lane: 'cards' as const,
    startAt: at('2026-03-14T09:00:00-04:00'),
    completeAt: at('2026-06-12T09:00:00-04:00'),
    payoutAt: at('2026-07-12T09:00:00-04:00')
  },
  {
    recommendationId: 'bank:harbor-federal-checking-savings-500',
    lane: 'banking' as const,
    startAt: at('2026-04-02T09:00:00-04:00'),
    completeAt: at('2026-06-30T09:00:00-04:00'),
    payoutAt: at('2026-07-21T09:00:00-04:00')
  },
  {
    recommendationId: 'card:amex-gold-card',
    lane: 'cards' as const,
    startAt: at('2026-06-20T09:00:00-04:00'),
    completeAt: at('2026-09-18T09:00:00-04:00'),
    payoutAt: at('2026-10-18T09:00:00-04:00')
  },
  {
    recommendationId: 'bank:summit-national-checking-300',
    lane: 'banking' as const,
    startAt: at('2026-08-08T09:00:00-04:00'),
    completeAt: at('2026-11-06T09:00:00-05:00'),
    payoutAt: at('2026-11-27T09:00:00-05:00')
  },
  {
    recommendationId: 'card:bilt-mastercard',
    lane: 'cards' as const,
    startAt: at('2026-10-05T09:00:00-04:00'),
    completeAt: at('2027-01-03T09:00:00-05:00'),
    payoutAt: at('2027-02-02T09:00:00-05:00')
  },
  {
    recommendationId: 'card:citi-premier-card',
    lane: 'cards' as const,
    startAt: at('2026-04-15T09:00:00-04:00'),
    completeAt: at('2026-07-14T09:00:00-04:00'),
    payoutAt: at('2026-08-13T09:00:00-04:00')
  },
  {
    recommendationId: 'card:capital-one-savor-rewards',
    lane: 'cards' as const,
    startAt: at('2026-07-20T09:00:00-04:00'),
    completeAt: at('2026-10-18T09:00:00-04:00'),
    payoutAt: at('2026-11-17T09:00:00-05:00')
  },
  {
    recommendationId: 'bank:coastal-credit-union-checking-200',
    lane: 'banking' as const,
    startAt: at('2026-05-10T09:00:00-04:00'),
    completeAt: at('2026-07-09T09:00:00-04:00'),
    payoutAt: at('2026-07-23T09:00:00-04:00')
  }
];

export function getDemoPlanPayload(options: {
  cardsOnlyMode?: boolean;
} = {}): PlanResultsStoragePayload {
  const cardsOnlyMode = options.cardsOnlyMode ?? false;
  const filteredRecommendations = cardsOnlyMode
    ? recommendations.filter((item) => item.lane === 'cards')
    : recommendations;
  const recommendationIds = new Set(filteredRecommendations.map((item) => item.id));

  return buildPlanResultsPayload({
    savedAt,
    answers: {
      audience: 'consumer',
      goal: 'travel',
      spend: 'dining',
      fee: 'over_95_ok',
      credit: 'excellent',
      ownedCardSlugs: ['chase-freedom-unlimited', 'amex-green-card', 'capital-one-quicksilver', 'discover-it-cash-back'],
      amexLifetimeBlockedSlugs: ['amex-platinum-card'],
      chase524Status: 'under_5_24',
      directDeposit: 'yes',
      state: 'NY',
      monthlySpend: 'from_2500_to_5000',
      pace: 'balanced',
      availableCash: 'from_2501_to_9999',
      bankAccountPreference: 'no_preference',
      ownedBankNames: []
    },
    recommendations: filteredRecommendations,
    exclusions: cardsOnlyMode ? exclusions.filter((item) => item.lane === 'cards') : exclusions,
    schedule: schedule.filter((item) => recommendationIds.has(item.recommendationId))
  });
}
