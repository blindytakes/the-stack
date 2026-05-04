export type PointsProgramId =
  | 'chase-sapphire-reserve'
  | 'chase-sapphire-preferred'
  | 'amex-membership-rewards'
  | 'capital-one-venture-x'
  | 'capital-one-venture-rewards'
  | 'citi-thankyou';

export type PointsGoalId =
  | 'cash_now'
  | 'simple_travel'
  | 'best_value'
  | 'hotel_stay'
  | 'premium_flight'
  | 'not_sure';

export type PointsTimeHorizonId = 'now' | 'soon' | 'later';
export type PointsEffortId = 'low' | 'medium' | 'high';

type RecommendationStrategy =
  | 'cash'
  | 'portal'
  | 'gift'
  | 'airline_transfer'
  | 'hotel_transfer'
  | 'hold';

type GoalFitMap = Record<PointsGoalId, number>;

export type PointsSourceNote = {
  label: string;
  url: string;
  lastVerifiedAt: string;
};

export type PointsAdvisorInput = {
  programId: PointsProgramId;
  pointsBalance: number;
  goal: PointsGoalId;
  timeHorizon: PointsTimeHorizonId;
  effortTolerance: PointsEffortId;
};

export type PointsAdvisorChoice = {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
  bestFor: string;
  watchOut: string;
  strategy: RecommendationStrategy;
  minCpp: number;
  maxCpp: number;
  effort: PointsEffortId;
  timeToValue: PointsTimeHorizonId;
  goalFit: GoalFitMap;
};

export type PointsProgramProfile = {
  id: PointsProgramId;
  name: string;
  currencyName: string;
  title: string;
  headline: string;
  description: string;
  sources: PointsSourceNote[];
  assumptionNotes: string[];
  choices: PointsAdvisorChoice[];
};

export type PointsScoreBreakdown = {
  label: string;
  value: string;
  impact: number;
};

export type RankedPointsRecommendation = PointsAdvisorChoice & {
  rank: number;
  score: number;
  likelyCpp: number;
  estimatedValue: number;
  minimumValue: number;
  maximumValue: number;
  recommendationLabel: string;
  fitSummary: string;
  scoreBreakdown: PointsScoreBreakdown[];
  primaryReasons: string[];
};

export type PointsAdvisorResult = {
  profile: PointsProgramProfile;
  input: PointsAdvisorInput;
  topRecommendations: RankedPointsRecommendation[];
  allRecommendations: RankedPointsRecommendation[];
  easiestGoodOption: RankedPointsRecommendation;
  highestUpsideOption: RankedPointsRecommendation;
};

export type PointsTripRedemptionInput = {
  pointsBalance: number;
  cashPrice: number;
  pointsRequired: number;
  taxesAndFees: number;
  transferRatio: number;
  transferBonusPercent: number;
  baselineCpp: number;
};

export type PointsTripRedemptionStatus =
  | 'invalid'
  | 'not_enough_points'
  | 'strong_value'
  | 'fair_value'
  | 'weak_value';

export type PointsTripRedemptionResult = {
  status: PointsTripRedemptionStatus;
  statusLabel: string;
  summary: string;
  effectivePointsCost: number;
  pointsShortfall: number;
  cashValueAfterFees: number;
  effectiveCpp: number;
  baselineValue: number;
  incrementalValue: number;
};

export const pointsGoalOptions: ReadonlyArray<{
  id: PointsGoalId;
  label: string;
  description: string;
}> = [
  {
    id: 'cash_now',
    label: 'Cash now',
    description: 'Optimize for certainty and immediate spending power.'
  },
  {
    id: 'simple_travel',
    label: 'Simple travel',
    description: 'Keep booking straightforward even if the ceiling is lower.'
  },
  {
    id: 'best_value',
    label: 'Best value',
    description: 'Chase the strongest cents-per-point outcome.'
  },
  {
    id: 'hotel_stay',
    label: 'Hotel stay',
    description: 'Bias toward hotel use cases and avoid weak fixed-value exits.'
  },
  {
    id: 'premium_flight',
    label: 'Premium flight',
    description: 'Aim at the sort of booking where transfer partners can pull away.'
  },
  {
    id: 'not_sure',
    label: 'Not sure yet',
    description: 'You want a recommendation without forcing an immediate redemption.'
  }
];

export const pointsTimeHorizonOptions: ReadonlyArray<{
  id: PointsTimeHorizonId;
  label: string;
  description: string;
}> = [
  {
    id: 'now',
    label: 'Use now',
    description: 'You want value you can reasonably realize right away.'
  },
  {
    id: 'soon',
    label: 'Next few months',
    description: 'Some planning is fine, but this should turn into a real redemption soon.'
  },
  {
    id: 'later',
    label: 'Wait for the right trip',
    description: 'You can hold points and redeem when the fit is better.'
  }
];

export const pointsEffortOptions: ReadonlyArray<{
  id: PointsEffortId;
  label: string;
  description: string;
}> = [
  {
    id: 'low',
    label: 'Low effort',
    description: 'Minimal research, few moving pieces, near-zero award-hunting.'
  },
  {
    id: 'medium',
    label: 'Some work',
    description: 'A little comparison shopping is fine, but not an obsession.'
  },
  {
    id: 'high',
    label: 'I will work it',
    description: 'You are willing to transfer, compare partners, and book strategically.'
  }
];

function goalFit(
  input: ReadonlyArray<readonly [PointsGoalId, number]>
): GoalFitMap {
  return Object.fromEntries(input) as GoalFitMap;
}

export const pointsProgramProfiles: ReadonlyArray<PointsProgramProfile> = [
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    currencyName: 'Ultimate Rewards',
    title: 'Chase Sapphire Reserve',
    headline: 'Best when you want flexible points with a 1 cent floor and occasional portal boosts that can compete with transfers.',
    description:
      'Reserve points now have a simple 1 cent floor through cash out or ordinary Chase Travel bookings, but select Chase Travel bookings can carry a higher Points Boost rate that changes the math.',
    sources: [
      {
        label: 'Chase Sapphire Reserve benefits',
        url: 'https://www.chase.com/sapphire-cards/personal/reserve',
        lastVerifiedAt: '2026-05-03'
      },
      {
        label: 'Chase Points Boost guide',
        url: 'https://www.chase.com/travel/guide/trips/chase-sapphire-points-boost-benefits-guide',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Standard cash-like and ordinary Chase Travel redemptions are modeled at 1 cent per point.',
      'Points Boost is modeled as an availability-dependent range, not a guaranteed rate on every booking.'
    ],
    choices: [
      {
        id: 'csr-cash-back',
        label: 'Cash back or standard Chase Travel at 1 cent per point',
        shortLabel: '1 cpp floor',
        summary: 'This is the guaranteed floor now that ordinary Chase Travel redemptions no longer carry a built-in 1.5 cent value.',
        bestFor: 'Anyone who wants certainty or does not see a boosted portal rate worth using.',
        watchOut: 'This is the fallback, not the optimized play. If a Points Boost booking or transfer is available, this is usually leaving value behind.',
        strategy: 'cash',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 5],
          ['simple_travel', 1],
          ['best_value', 1],
          ['hotel_stay', 0],
          ['premium_flight', 0],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csr-points-boost',
        label: 'Book a Chase Travel option with Points Boost',
        shortLabel: 'Points Boost',
        summary: 'This is the clean low-effort play when a marked Chase Travel booking is pricing above the 1 cent floor.',
        bestFor: 'Simple travel bookings where a boosted portal rate is available and you do not want transfer-partner complexity.',
        watchOut: 'The boosted rate is not universal. If a booking is not marked for Points Boost, you are back at the standard 1 cent floor.',
        strategy: 'portal',
        minCpp: 1.75,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 5],
          ['best_value', 4],
          ['hotel_stay', 3],
          ['premium_flight', 3],
          ['not_sure', 4]
        ])
      },
      {
        id: 'csr-airline-transfer',
        label: 'Transfer to airline partners for a high-value flight redemption',
        shortLabel: 'Airline transfer',
        summary: 'This is where Reserve points can move past the fixed-value floor.',
        bestFor: 'Premium-cabin or international flight redemptions where partner pricing is meaningfully better.',
        watchOut: 'Award space, taxes, and transfer timing matter. Do not transfer without a specific booking target.',
        strategy: 'airline_transfer',
        minCpp: 1.8,
        maxCpp: 2.4,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csr-hotel-transfer',
        label: 'Transfer to a hotel partner when the stay clearly beats the portal rate',
        shortLabel: 'Hotel transfer',
        summary: 'Worth doing only when the hotel booking is specific and the math is obvious.',
        bestFor: 'A targeted hotel redemption with above-average partner value.',
        watchOut: 'Hotel transfer value is not uniform. If the math is close, keep the flexibility instead.',
        strategy: 'hotel_transfer',
        minCpp: 1.6,
        maxCpp: 2.2,
        effort: 'medium',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 4],
          ['hotel_stay', 5],
          ['premium_flight', 1],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csr-hold',
        label: 'Hold the points until a better trip shows up',
        shortLabel: 'Hold for later',
        summary: 'Flexible points are valuable precisely because you do not have to force the redemption.',
        bestFor: 'Anyone without a real booking lined up yet.',
        watchOut: 'Only hold if you genuinely expect to use a transfer or boosted portal option later. The guaranteed floor is still just 1 cent.',
        strategy: 'hold',
        minCpp: 1,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 3],
          ['hotel_stay', 2],
          ['premium_flight', 3],
          ['not_sure', 5]
        ])
      }
    ]
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    currencyName: 'Ultimate Rewards',
    title: 'Chase Sapphire Preferred',
    headline: 'Best when you want the Chase transfer ecosystem with a lower annual-fee commitment.',
    description:
      'Preferred points keep the same simple 1 cent floor and transfer optionality, while Points Boost can help select Chase Travel bookings clear the floor without partner work.',
    sources: [
      {
        label: 'Chase Points Boost guide',
        url: 'https://www.chase.com/travel/guide/trips/chase-sapphire-points-boost-benefits-guide',
        lastVerifiedAt: '2026-05-03'
      },
      {
        label: 'Chase Sapphire Preferred card',
        url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Standard cash-like and ordinary Chase Travel redemptions are modeled at 1 cent per point.',
      'Preferred Points Boost is modeled below Reserve because the highest advertised boost is lower.'
    ],
    choices: [
      {
        id: 'csp-cash-back',
        label: 'Cash back or standard Chase Travel at 1 cent per point',
        shortLabel: '1 cpp floor',
        summary: 'This is the easy floor when no boosted booking or transfer target is available.',
        bestFor: 'Anyone who wants certainty and does not want to shop transfer partners.',
        watchOut: 'This is usable, but it is rarely the reason to collect flexible Chase points.',
        strategy: 'cash',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 5],
          ['simple_travel', 1],
          ['best_value', 1],
          ['hotel_stay', 0],
          ['premium_flight', 0],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csp-points-boost',
        label: 'Book a Chase Travel option with Points Boost',
        shortLabel: 'Points Boost',
        summary: 'A clean middle path when a marked booking prices better than the 1 cent floor.',
        bestFor: 'Simple travel bookings where the Chase Travel result is clearly boosted.',
        watchOut: 'Boosted inventory rotates and is not guaranteed for every route, hotel, or date.',
        strategy: 'portal',
        minCpp: 1.25,
        maxCpp: 1.5,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 5],
          ['best_value', 3],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 4]
        ])
      },
      {
        id: 'csp-airline-transfer',
        label: 'Transfer to airline partners for a high-value flight redemption',
        shortLabel: 'Airline transfer',
        summary: 'This is where Preferred points can still beat the easy fixed-value paths.',
        bestFor: 'International or premium-cabin awards where partner pricing is materially better.',
        watchOut: 'Transfers are generally one-way, so check the award before moving points.',
        strategy: 'airline_transfer',
        minCpp: 1.7,
        maxCpp: 2.3,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csp-hotel-transfer',
        label: 'Transfer to a hotel partner when the stay clearly beats the portal rate',
        shortLabel: 'Hotel transfer',
        summary: 'A targeted hotel stay can justify a transfer when the cash price is high relative to award cost.',
        bestFor: 'Specific hotel stays where the math beats both Chase Travel and cash.',
        watchOut: 'Do not transfer for a marginal gain; the flexibility loss matters.',
        strategy: 'hotel_transfer',
        minCpp: 1.5,
        maxCpp: 2.1,
        effort: 'medium',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 4],
          ['hotel_stay', 5],
          ['premium_flight', 1],
          ['not_sure', 2]
        ])
      },
      {
        id: 'csp-hold',
        label: 'Hold the points until a real boosted booking or transfer target appears',
        shortLabel: 'Hold for later',
        summary: 'Waiting is reasonable when you do not have a specific trip that clears the floor.',
        bestFor: 'Anyone who wants to preserve optionality instead of forcing a low-value use.',
        watchOut: 'Holding only works if you will come back and actually compare the next trip.',
        strategy: 'hold',
        minCpp: 1,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 3],
          ['hotel_stay', 2],
          ['premium_flight', 3],
          ['not_sure', 5]
        ])
      }
    ]
  },
  {
    id: 'amex-membership-rewards',
    name: 'Amex Membership Rewards',
    currencyName: 'Membership Rewards',
    title: 'Amex Membership Rewards',
    headline: 'Best when you can hold out for airline transfers instead of cashing out cheaply.',
    description:
      'MR points have a weak cash floor and a much better ceiling on the right flight transfer, which means bad redemptions are easier to make by accident.',
    sources: [
      {
        label: 'American Express Membership Rewards',
        url: 'https://www.americanexpress.com/en-us/benefits/rewards/membership-rewards/',
        lastVerifiedAt: '2026-05-03'
      },
      {
        label: 'American Express points value guide',
        url: 'https://www.americanexpress.com/en-us/credit-cards/credit-intel/american-express-points-value/',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Statement credit, gift card, checkout, and travel values can vary by product and offer.',
      'Transfer values are modeled as targeted travel redemptions after checking award space.'
    ],
    choices: [
      {
        id: 'amex-statement-credit',
        label: 'Use points for statement credit at about 0.6 cents each',
        shortLabel: 'Statement credit',
        summary: 'The fastest cash-like exit, but also one of the weakest uses of MR points.',
        bestFor: 'A real need for immediate value where convenience matters more than efficiency.',
        watchOut: 'This is the most obvious value leak in the Amex ecosystem.',
        strategy: 'cash',
        minCpp: 0.6,
        maxCpp: 0.6,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 5],
          ['simple_travel', 0],
          ['best_value', 0],
          ['hotel_stay', 0],
          ['premium_flight', 0],
          ['not_sure', 1]
        ])
      },
      {
        id: 'amex-gift-cards',
        label: 'Use gift cards or checkout redemptions around 0.7 to 1.0 cents each',
        shortLabel: 'Gift cards',
        summary: 'Better than statement credit, but still usually a compromise.',
        bestFor: 'Low-effort value when you are not planning travel and refuse to sit on the points.',
        watchOut: 'This is still well below what a strong airline transfer can do.',
        strategy: 'gift',
        minCpp: 0.7,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 3],
          ['simple_travel', 1],
          ['best_value', 1],
          ['hotel_stay', 0],
          ['premium_flight', 0],
          ['not_sure', 2]
        ])
      },
      {
        id: 'amex-travel',
        label: 'Use Amex Travel around 1 cent per point when simplicity matters',
        shortLabel: 'Amex Travel',
        summary: 'A cleaner fixed-value use than cashing out, especially if you want a simple booking.',
        bestFor: 'Straightforward travel redemptions where convenience matters more than transfer games.',
        watchOut: 'You are still leaving value on the table compared with a good airline transfer.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 4],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 3]
        ])
      },
      {
        id: 'amex-airline-transfer',
        label: 'Transfer to airline partners for the highest-value MR redemptions',
        shortLabel: 'Airline transfer',
        summary: 'This is the core reason to care about MR points in the first place.',
        bestFor: 'Premium flights, international itineraries, and redemptions where partner pricing is materially better.',
        watchOut: 'Award space is the constraint. A transfer without a booking target is how people trap value.',
        strategy: 'airline_transfer',
        minCpp: 1.8,
        maxCpp: 2.5,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'amex-hold',
        label: 'Hold the points for a better airline transfer or bonus window',
        shortLabel: 'Hold for later',
        summary: 'Amex is one of the programs where waiting can be better than settling for a weak fixed-value exit.',
        bestFor: 'Anyone who does not have a strong travel plan today but wants to keep the upside intact.',
        watchOut: 'Holding points only makes sense if you are realistically going to redeem them better later.',
        strategy: 'hold',
        minCpp: 1.8,
        maxCpp: 2.3,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 4],
          ['hotel_stay', 2],
          ['premium_flight', 4],
          ['not_sure', 5]
        ])
      }
    ]
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    currencyName: 'Capital One Miles',
    title: 'Capital One Venture X',
    headline: 'Best when you want a simple 1 cent floor but still have the option to transfer up.',
    description:
      'Venture X miles are easy to use at a predictable rate, which makes them forgiving, but transfers still matter if you want the ceiling.',
    sources: [
      {
        label: 'Capital One miles redemption guide',
        url: 'https://www.capitalone.com/learn-grow/money-management/ways-to-redeem-venture-miles/',
        lastVerifiedAt: '2026-05-03'
      },
      {
        label: 'Capital One transfer partners guide',
        url: 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Travel purchase erase and Capital One Travel are modeled as the easy 1 cent floor.',
      'Transfer values assume a specific award is available before moving miles out.'
    ],
    choices: [
      {
        id: 'vx-travel-erase',
        label: 'Use miles to erase travel purchases at 1 cent each',
        shortLabel: 'Travel erase',
        summary: 'The cleanest low-friction route in the Capital One ecosystem.',
        bestFor: 'Straightforward travel value with almost no complexity.',
        watchOut: 'This is reliable, not exceptional. Transfers can still win by a lot.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 2],
          ['simple_travel', 5],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 4]
        ])
      },
      {
        id: 'vx-capital-one-travel',
        label: 'Book through Capital One Travel at about 1 cent each',
        shortLabel: 'Capital One Travel',
        summary: 'Very similar to purchase erase, but useful if you want the booking inside the issuer portal.',
        bestFor: 'Portal-first travelers who still want a simple fixed-value use.',
        watchOut: 'The value ceiling is still the same 1 cent floor.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 4],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 3]
        ])
      },
      {
        id: 'vx-airline-transfer',
        label: 'Transfer to airline partners for the highest-upside flight value',
        shortLabel: 'Airline transfer',
        summary: 'This is the path that makes Venture X miles more than a simple 1 cent currency.',
        bestFor: 'Flights where partner bookings produce a clear gap over the fixed-value route.',
        watchOut: 'Capital One is strongest when you already know the transfer is worth doing.',
        strategy: 'airline_transfer',
        minCpp: 1.6,
        maxCpp: 2.2,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'vx-hotel-transfer',
        label: 'Transfer to a hotel partner only when the stay clearly beats 1 cent',
        shortLabel: 'Hotel transfer',
        summary: 'Possible, but the standard is simple: it needs to clear the easy 1 cent floor by enough to matter.',
        bestFor: 'Targeted hotel redemptions where the transfer math is already proven.',
        watchOut: 'If the value is only marginally better than 1 cent, the simplicity tradeoff is probably not worth it.',
        strategy: 'hotel_transfer',
        minCpp: 1.3,
        maxCpp: 1.8,
        effort: 'medium',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 3],
          ['hotel_stay', 5],
          ['premium_flight', 1],
          ['not_sure', 2]
        ])
      },
      {
        id: 'vx-hold',
        label: 'Hold the miles until a transfer or travel erase use is obvious',
        shortLabel: 'Hold for later',
        summary: 'A rational move when you do not need to burn a flexible 1 cent floor today.',
        bestFor: 'People who know the miles are more useful on the next trip than the current statement.',
        watchOut: 'Waiting only wins if you actually redeem later instead of forgetting about the balance.',
        strategy: 'hold',
        minCpp: 1.5,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 4],
          ['hotel_stay', 2],
          ['premium_flight', 4],
          ['not_sure', 5]
        ])
      }
    ]
  },
  {
    id: 'capital-one-venture-rewards',
    name: 'Capital One Venture Rewards',
    currencyName: 'Capital One Miles',
    title: 'Capital One Venture Rewards',
    headline: 'Best when you want a simple travel floor and occasional transfer upside.',
    description:
      'Venture miles are forgiving because travel erase and Capital One Travel create a simple floor, while transfer partners still matter for higher-value trips.',
    sources: [
      {
        label: 'Capital One miles redemption guide',
        url: 'https://www.capitalone.com/learn-grow/money-management/ways-to-redeem-venture-miles/',
        lastVerifiedAt: '2026-05-03'
      },
      {
        label: 'Capital One transfer partners guide',
        url: 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Travel purchase erase and Capital One Travel are modeled as the easy 1 cent floor.',
      'Transfer values assume a specific award is available before moving miles out.'
    ],
    choices: [
      {
        id: 'venture-travel-erase',
        label: 'Use miles to erase travel purchases at 1 cent each',
        shortLabel: 'Travel erase',
        summary: 'The cleanest low-friction use if you already have an eligible travel charge.',
        bestFor: 'Straightforward travel value without having to book through an award program.',
        watchOut: 'This is reliable, not exceptional. A good transfer can still beat it.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 2],
          ['simple_travel', 5],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 4]
        ])
      },
      {
        id: 'venture-capital-one-travel',
        label: 'Book through Capital One Travel at about 1 cent each',
        shortLabel: 'Capital One Travel',
        summary: 'Useful when the portal price is competitive and you want one checkout flow.',
        bestFor: 'Portal-first travelers who value simplicity more than transfer maximization.',
        watchOut: 'The value ceiling is still the same 1 cent floor.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 4],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 3]
        ])
      },
      {
        id: 'venture-airline-transfer',
        label: 'Transfer to airline partners for the highest-upside flight value',
        shortLabel: 'Airline transfer',
        summary: 'The path that can make Venture miles worth more than a simple 1 cent currency.',
        bestFor: 'Flights where partner pricing creates a clear spread over the fixed-value route.',
        watchOut: 'Confirm the award can be booked before you move the miles.',
        strategy: 'airline_transfer',
        minCpp: 1.6,
        maxCpp: 2.2,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'venture-hotel-transfer',
        label: 'Transfer to a hotel partner only when the stay clearly beats 1 cent',
        shortLabel: 'Hotel transfer',
        summary: 'Possible, but the value needs to clear the easy travel floor by enough to matter.',
        bestFor: 'Targeted hotel redemptions where the partner math is already proven.',
        watchOut: 'If the win is marginal, the simple travel erase is usually the better user experience.',
        strategy: 'hotel_transfer',
        minCpp: 1.3,
        maxCpp: 1.8,
        effort: 'medium',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 3],
          ['hotel_stay', 5],
          ['premium_flight', 1],
          ['not_sure', 2]
        ])
      },
      {
        id: 'venture-hold',
        label: 'Hold the miles until a travel erase use or transfer target is obvious',
        shortLabel: 'Hold for later',
        summary: 'A rational move when you do not need to burn a flexible 1 cent floor today.',
        bestFor: 'People who know the miles are more useful on an upcoming trip.',
        watchOut: 'Waiting only wins if you actually redeem later instead of forgetting about the balance.',
        strategy: 'hold',
        minCpp: 1.5,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 4],
          ['hotel_stay', 2],
          ['premium_flight', 4],
          ['not_sure', 5]
        ])
      }
    ]
  },
  {
    id: 'citi-thankyou',
    name: 'Citi ThankYou Points',
    currencyName: 'ThankYou Points',
    title: 'Citi ThankYou Points',
    headline: 'Best when you want a 1 cent floor with transfer upside on the right flight.',
    description:
      'ThankYou points can be simple at the floor, but the stronger case comes from a specific transfer redemption where partner pricing clearly beats cash-like uses.',
    sources: [
      {
        label: 'Citi Strata Elite Card',
        url: 'https://www.citi.com/credit-cards/citi-strata-elite-credit-card',
        lastVerifiedAt: '2026-05-03'
      }
    ],
    assumptionNotes: [
      'Cash-like and Citi Travel uses are modeled at 1 cent per point for the cards currently covered by The Stack.',
      'Transfer values are modeled as targeted travel redemptions after checking partner availability.'
    ],
    choices: [
      {
        id: 'citi-cash-back',
        label: 'Use points for cash back or statement credit around 1 cent each',
        shortLabel: '1 cpp floor',
        summary: 'The easiest route when certainty matters more than squeezing extra travel value.',
        bestFor: 'Users who want immediate, low-friction value.',
        watchOut: 'This gives up the main upside of a transferable points currency.',
        strategy: 'cash',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 5],
          ['simple_travel', 1],
          ['best_value', 1],
          ['hotel_stay', 0],
          ['premium_flight', 0],
          ['not_sure', 2]
        ])
      },
      {
        id: 'citi-travel',
        label: 'Book through Citi Travel around 1 cent per point',
        shortLabel: 'Citi Travel',
        summary: 'A straightforward travel exit when the portal price is competitive.',
        bestFor: 'Simple travel bookings where you do not want partner research.',
        watchOut: 'The portal route is convenient, but it is still a fixed-value use.',
        strategy: 'portal',
        minCpp: 1,
        maxCpp: 1,
        effort: 'low',
        timeToValue: 'now',
        goalFit: goalFit([
          ['cash_now', 1],
          ['simple_travel', 5],
          ['best_value', 2],
          ['hotel_stay', 3],
          ['premium_flight', 2],
          ['not_sure', 3]
        ])
      },
      {
        id: 'citi-airline-transfer',
        label: 'Transfer to airline partners for a higher-value flight redemption',
        shortLabel: 'Airline transfer',
        summary: 'The highest-upside Citi path when an award seat prices well against cash.',
        bestFor: 'International or premium-cabin flights where the transfer partner price is compelling.',
        watchOut: 'Award availability and transfer timing are the constraint.',
        strategy: 'airline_transfer',
        minCpp: 1.6,
        maxCpp: 2.2,
        effort: 'high',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 5],
          ['hotel_stay', 1],
          ['premium_flight', 5],
          ['not_sure', 2]
        ])
      },
      {
        id: 'citi-hotel-transfer',
        label: 'Transfer to a hotel partner only when the stay clearly beats the floor',
        shortLabel: 'Hotel transfer',
        summary: 'Worth checking for specific stays, but it needs to beat the easy 1 cent path.',
        bestFor: 'Hotel bookings where the partner award math is obvious.',
        watchOut: 'If the value is close, keep the points flexible.',
        strategy: 'hotel_transfer',
        minCpp: 1.2,
        maxCpp: 1.7,
        effort: 'medium',
        timeToValue: 'soon',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 2],
          ['best_value', 3],
          ['hotel_stay', 5],
          ['premium_flight', 1],
          ['not_sure', 2]
        ])
      },
      {
        id: 'citi-hold',
        label: 'Hold the points until a stronger transfer or travel use appears',
        shortLabel: 'Hold for later',
        summary: 'Waiting can be better than forcing a fixed-value redemption without a real trip.',
        bestFor: 'Users who do not need cash now and expect a better travel use soon.',
        watchOut: 'Holding has value only if you come back with a specific redemption to test.',
        strategy: 'hold',
        minCpp: 1,
        maxCpp: 2,
        effort: 'low',
        timeToValue: 'later',
        goalFit: goalFit([
          ['cash_now', 0],
          ['simple_travel', 1],
          ['best_value', 4],
          ['hotel_stay', 2],
          ['premium_flight', 4],
          ['not_sure', 5]
        ])
      }
    ]
  }
] as const;

export const pointsProgramById = Object.fromEntries(
  pointsProgramProfiles.map((profile) => [profile.id, profile])
) as Record<PointsProgramId, PointsProgramProfile>;

const pointsAdvisorProgramByCardSlug = {
  'amex-platinum-card': 'amex-membership-rewards',
  'amex-gold-card': 'amex-membership-rewards',
  'amex-green-card': 'amex-membership-rewards',
  'chase-sapphire-reserve': 'chase-sapphire-reserve',
  'chase-sapphire-preferred': 'chase-sapphire-preferred',
  'capital-one-venture-x': 'capital-one-venture-x',
  'capital-one-venture-rewards': 'capital-one-venture-rewards',
  'citi-strata-elite-card': 'citi-thankyou'
} as const satisfies Record<string, PointsProgramId>;

export function getPointsAdvisorProgramFromCardSlug(
  slug: string
): PointsProgramId | null {
  return pointsAdvisorProgramByCardSlug[
    slug as keyof typeof pointsAdvisorProgramByCardSlug
  ] ?? null;
}

const effortRank: Record<PointsEffortId, number> = {
  low: 0,
  medium: 1,
  high: 2
};

const horizonRank: Record<PointsTimeHorizonId, number> = {
  now: 0,
  soon: 1,
  later: 2
};

function normalizePointsBalance(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

export function buildPointsAdvisorHref({
  cardSlug,
  programId,
  pointsBalance,
  goal,
  timeHorizon,
  effortTolerance
}: {
  cardSlug?: string;
  programId?: PointsProgramId;
  pointsBalance?: number | null;
  goal?: PointsGoalId;
  timeHorizon?: PointsTimeHorizonId;
  effortTolerance?: PointsEffortId;
}) {
  const resolvedProgramId =
    programId ?? (cardSlug ? getPointsAdvisorProgramFromCardSlug(cardSlug) : null);
  const params = new URLSearchParams();
  const normalizedPointsBalance = normalizePointsBalance(pointsBalance ?? 0);

  if (resolvedProgramId) {
    params.set('program', resolvedProgramId);
  }

  if (normalizedPointsBalance > 0) {
    params.set('points', String(normalizedPointsBalance));
  }

  if (goal) {
    params.set('goal', goal);
  }

  if (timeHorizon) {
    params.set('time', timeHorizon);
  }

  if (effortTolerance) {
    params.set('effort', effortTolerance);
  }

  const query = params.toString();
  return query ? `/tools/points-advisor?${query}` : '/tools/points-advisor';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsToDollars(points: number, centsPerPoint: number) {
  return Math.round((points * centsPerPoint) / 100);
}

function isTransferStrategy(strategy: RecommendationStrategy) {
  return strategy === 'airline_transfer' || strategy === 'hotel_transfer';
}

function getLikelyCpp(choice: PointsAdvisorChoice, input: PointsAdvisorInput) {
  if (choice.minCpp === choice.maxCpp) return choice.minCpp;

  let factor = 0.35;

  if (input.effortTolerance === 'medium') factor += 0.1;
  if (input.effortTolerance === 'high') factor += 0.2;
  if (input.timeHorizon === 'later') factor += 0.15;
  if (input.timeHorizon === 'soon') factor += 0.05;

  if (
    (input.goal === 'best_value' || input.goal === 'premium_flight') &&
    isTransferStrategy(choice.strategy)
  ) {
    factor += 0.15;
  }

  if (input.goal === 'hotel_stay' && choice.strategy === 'hotel_transfer') {
    factor += 0.12;
  }

  if (input.goal === 'not_sure' && choice.strategy === 'hold') {
    factor += 0.15;
  }

  if (input.goal === 'simple_travel' && choice.strategy === 'portal') {
    factor += 0.08;
  }

  return Number((choice.minCpp + (choice.maxCpp - choice.minCpp) * clamp(factor, 0.15, 0.9)).toFixed(2));
}

function formatImpact(value: number) {
  return value > 0 ? `+${Number(value.toFixed(1))}` : Number(value.toFixed(1)).toString();
}

function getScoreBreakdown(
  choice: PointsAdvisorChoice,
  input: PointsAdvisorInput,
  likelyCpp: number
): PointsScoreBreakdown[] {
  const scoreBreakdown: PointsScoreBreakdown[] = [
    {
      label: 'Goal fit',
      value: `${choice.goalFit[input.goal]}/5`,
      impact: choice.goalFit[input.goal] * 18
    },
    {
      label: 'Likely value',
      value: `${likelyCpp.toFixed(2)} cpp`,
      impact: likelyCpp * 18
    }
  ];

  const effortDiff = effortRank[choice.effort] - effortRank[input.effortTolerance];
  if (effortDiff <= 0) {
    scoreBreakdown.push({
      label: 'Effort fit',
      value: `${choice.effort} effort fits ${input.effortTolerance}`,
      impact: 12
    });
  } else {
    scoreBreakdown.push({
      label: 'Effort gap',
      value: `${choice.effort} effort vs ${input.effortTolerance}`,
      impact: -effortDiff * 12
    });
  }

  const timingDiff = horizonRank[choice.timeToValue] - horizonRank[input.timeHorizon];
  if (timingDiff <= 0) {
    scoreBreakdown.push({
      label: 'Timing fit',
      value: `${choice.timeToValue} fits ${input.timeHorizon}`,
      impact: 4
    });
  } else {
    scoreBreakdown.push({
      label: 'Timing gap',
      value: `${choice.timeToValue} vs ${input.timeHorizon}`,
      impact: -timingDiff * 10
    });
  }

  if (choice.strategy === 'hold' && input.timeHorizon === 'later') {
    scoreBreakdown.push({
      label: 'Wait fit',
      value: 'User can wait',
      impact: 8
    });
  }

  if (choice.strategy === 'cash' && input.goal === 'cash_now') {
    scoreBreakdown.push({
      label: 'Cash certainty',
      value: 'Matches cash-now goal',
      impact: 6
    });
  }

  if (choice.strategy === 'portal' && input.goal === 'simple_travel') {
    scoreBreakdown.push({
      label: 'Simple booking',
      value: 'Matches simple-travel goal',
      impact: 6
    });
  }

  if (isTransferStrategy(choice.strategy) && input.goal === 'best_value') {
    scoreBreakdown.push({
      label: 'Transfer upside',
      value: 'Matches best-value goal',
      impact: 8
    });
  }

  if (isTransferStrategy(choice.strategy) && input.goal === 'premium_flight') {
    scoreBreakdown.push({
      label: 'Premium-flight fit',
      value: 'Transfer route fits the trip',
      impact: 8
    });
  }

  return scoreBreakdown.map((item) => ({
    ...item,
    impact: Number(item.impact.toFixed(1))
  }));
}

function getScore(scoreBreakdown: PointsScoreBreakdown[]) {
  return Number(
    scoreBreakdown.reduce((total, item) => total + item.impact, 0).toFixed(1)
  );
}

function buildPrimaryReasons(scoreBreakdown: PointsScoreBreakdown[]) {
  return scoreBreakdown
    .filter((item) => item.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.value} (${formatImpact(item.impact)})`);
}

function buildRecommendationLabel(
  choice: PointsAdvisorChoice,
  rank: number
): string {
  if (rank === 1) return 'Best overall fit';
  if (choice.strategy === 'hold') return 'Best wait-and-see route';
  if (choice.strategy === 'cash') return 'Cash-value floor';
  if (isTransferStrategy(choice.strategy)) return 'Highest upside';
  if (choice.effort === 'low') return 'Simplest good option';
  return 'Alternative path';
}

function buildFitSummary(choice: PointsAdvisorChoice, input: PointsAdvisorInput) {
  if (input.goal === 'cash_now' && choice.strategy === 'cash') {
    return 'This matches your need for immediate certainty better than trying to squeeze value out of a travel redemption.';
  }

  if (input.goal === 'simple_travel' && choice.strategy === 'portal') {
    return 'This keeps the booking flow simple and gives you a predictable value floor without partner research.';
  }

  if (input.goal === 'best_value' && isTransferStrategy(choice.strategy)) {
    return 'This is where the real cents-per-point upside lives if you are willing to transfer and book strategically.';
  }

  if (input.goal === 'hotel_stay' && choice.strategy === 'hotel_transfer') {
    return 'This is the hotel-specific route worth checking first when you already have a stay in mind.';
  }

  if (input.goal === 'premium_flight' && choice.strategy === 'airline_transfer') {
    return 'Premium-cabin and international partner redemptions are exactly the kind of use case that can justify the extra work.';
  }

  if (input.goal === 'not_sure' && choice.strategy === 'hold') {
    return 'Holding a flexible currency is rational when nothing is booked yet and the easy fallback is still available later.';
  }

  if (choice.effort === 'low') {
    return 'This works well when you want something usable without a lot of award-search overhead.';
  }

  if (choice.effort === 'high') {
    return 'The value can be strong here, but only if you are willing to do the partner-by-partner work.';
  }

  return 'This is a viable middle path if the top recommendation does not match how you actually redeem points.';
}

export function buildPointsAdvisorResult(input: PointsAdvisorInput): PointsAdvisorResult {
  const profile = pointsProgramById[input.programId];
  const normalizedInput = {
    ...input,
    pointsBalance: normalizePointsBalance(input.pointsBalance)
  };

  const allRecommendations = profile.choices
    .map((choice) => {
      const likelyCpp = getLikelyCpp(choice, normalizedInput);
      const scoreBreakdown = getScoreBreakdown(choice, normalizedInput, likelyCpp);
      const score = getScore(scoreBreakdown);

      return {
        ...choice,
        rank: 0,
        score,
        likelyCpp,
        estimatedValue: pointsToDollars(normalizedInput.pointsBalance, likelyCpp),
        minimumValue: pointsToDollars(normalizedInput.pointsBalance, choice.minCpp),
        maximumValue: pointsToDollars(normalizedInput.pointsBalance, choice.maxCpp),
        recommendationLabel: '',
        fitSummary: '',
        scoreBreakdown,
        primaryReasons: buildPrimaryReasons(scoreBreakdown)
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.likelyCpp - a.likelyCpp ||
        profile.choices.findIndex((choice) => choice.id === a.id) -
          profile.choices.findIndex((choice) => choice.id === b.id)
    )
    .map((choice, index) => ({
      ...choice,
      rank: index + 1,
      recommendationLabel: buildRecommendationLabel(choice, index + 1),
      fitSummary: buildFitSummary(choice, normalizedInput)
    }));

  const easiestGoodOption =
    [...allRecommendations]
      .filter((choice) => choice.effort === 'low' && choice.strategy !== 'hold')
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.maximumValue - a.maximumValue ||
          a.rank - b.rank
      )[0] ?? allRecommendations[0];
  const highestUpsideOption =
    [...allRecommendations]
      .filter((choice) => isTransferStrategy(choice.strategy))
      .sort(
        (a, b) =>
          b.maximumValue - a.maximumValue ||
          b.score - a.score ||
          a.rank - b.rank
      )[0] ?? allRecommendations[0];

  return {
    profile,
    input: normalizedInput,
    topRecommendations: allRecommendations.slice(0, 3),
    allRecommendations,
    easiestGoodOption,
    highestUpsideOption
  };
}

function normalizeMoneyInput(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function normalizeRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Number(value.toFixed(2));
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return clamp(Number(value.toFixed(2)), 0, 100);
}

export function calculateTripRedemption(
  input: PointsTripRedemptionInput
): PointsTripRedemptionResult {
  const pointsBalance = normalizePointsBalance(input.pointsBalance);
  const cashPrice = normalizeMoneyInput(input.cashPrice);
  const pointsRequired = normalizePointsBalance(input.pointsRequired);
  const taxesAndFees = normalizeMoneyInput(input.taxesAndFees);
  const transferRatio = normalizeRatio(input.transferRatio);
  const transferBonusPercent = normalizePercent(input.transferBonusPercent);
  const baselineCpp = clamp(input.baselineCpp || 1, 0.1, 5);

  if (cashPrice <= 0 || pointsRequired <= 0) {
    return {
      status: 'invalid',
      statusLabel: 'Add trip numbers',
      summary: 'Enter a cash price and points cost to compare this redemption against the easy floor.',
      effectivePointsCost: 0,
      pointsShortfall: 0,
      cashValueAfterFees: 0,
      effectiveCpp: 0,
      baselineValue: 0,
      incrementalValue: 0
    };
  }

  const transferMultiplier = transferRatio * (1 + transferBonusPercent / 100);
  const effectivePointsCost = Math.ceil(pointsRequired / transferMultiplier);
  const cashValueAfterFees = Math.max(0, cashPrice - taxesAndFees);
  const effectiveCpp = Number(((cashValueAfterFees * 100) / effectivePointsCost).toFixed(2));
  const baselineValue = pointsToDollars(effectivePointsCost, baselineCpp);
  const incrementalValue = Math.round(cashValueAfterFees - baselineValue);
  const pointsShortfall = Math.max(0, effectivePointsCost - pointsBalance);

  if (pointsShortfall > 0) {
    return {
      status: 'not_enough_points',
      statusLabel: 'Need more points',
      summary: `You are short ${pointsShortfall.toLocaleString()} points after transfer-ratio and bonus math.`,
      effectivePointsCost,
      pointsShortfall,
      cashValueAfterFees,
      effectiveCpp,
      baselineValue,
      incrementalValue
    };
  }

  if (effectiveCpp >= baselineCpp + 0.5 && effectiveCpp >= 1.5) {
    return {
      status: 'strong_value',
      statusLabel: 'Strong redemption',
      summary: 'This clears the easy floor by enough to justify the extra redemption work.',
      effectivePointsCost,
      pointsShortfall,
      cashValueAfterFees,
      effectiveCpp,
      baselineValue,
      incrementalValue
    };
  }

  if (effectiveCpp >= baselineCpp) {
    return {
      status: 'fair_value',
      statusLabel: 'Fair redemption',
      summary: 'This beats or matches the easy floor, but the margin is not huge.',
      effectivePointsCost,
      pointsShortfall,
      cashValueAfterFees,
      effectiveCpp,
      baselineValue,
      incrementalValue
    };
  }

  return {
    status: 'weak_value',
    statusLabel: 'Weak redemption',
    summary: 'The easy cash-like or portal floor is probably better unless convenience is the point.',
    effectivePointsCost,
    pointsShortfall,
    cashValueAfterFees,
    effectiveCpp,
    baselineValue,
    incrementalValue
  };
}
