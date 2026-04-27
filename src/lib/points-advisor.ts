export type PointsProgramId =
  | 'chase-sapphire-reserve'
  | 'amex-membership-rewards'
  | 'capital-one-venture-x';

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
  choices: PointsAdvisorChoice[];
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
};

export type PointsAdvisorResult = {
  profile: PointsProgramProfile;
  input: PointsAdvisorInput;
  topRecommendations: RankedPointsRecommendation[];
  allRecommendations: RankedPointsRecommendation[];
  easiestGoodOption: RankedPointsRecommendation;
  highestUpsideOption: RankedPointsRecommendation;
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
    id: 'amex-membership-rewards',
    name: 'Amex Membership Rewards',
    currencyName: 'Membership Rewards',
    title: 'Amex Membership Rewards',
    headline: 'Best when you can hold out for airline transfers instead of cashing out cheaply.',
    description:
      'MR points have a weak cash floor and a much better ceiling on the right flight transfer, which means bad redemptions are easier to make by accident.',
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
  }
] as const;

export const pointsProgramById = Object.fromEntries(
  pointsProgramProfiles.map((profile) => [profile.id, profile])
) as Record<PointsProgramId, PointsProgramProfile>;

const pointsAdvisorProgramByCardSlug = {
  'amex-platinum-card': 'amex-membership-rewards',
  'chase-sapphire-reserve': 'chase-sapphire-reserve',
  'capital-one-venture-x': 'capital-one-venture-x'
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
  pointsBalance
}: {
  cardSlug?: string;
  programId?: PointsProgramId;
  pointsBalance?: number | null;
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

function getScore(choice: PointsAdvisorChoice, input: PointsAdvisorInput, likelyCpp: number) {
  let score = choice.goalFit[input.goal] * 18 + likelyCpp * 18;

  const effortDiff = effortRank[choice.effort] - effortRank[input.effortTolerance];
  if (effortDiff <= 0) {
    score += 12;
  } else {
    score -= effortDiff * 12;
  }

  const timingDiff = horizonRank[choice.timeToValue] - horizonRank[input.timeHorizon];
  if (timingDiff <= 0) {
    score += 4;
  } else {
    score -= timingDiff * 10;
  }

  if (choice.strategy === 'hold' && input.timeHorizon === 'later') {
    score += 8;
  }

  if (choice.strategy === 'cash' && input.goal === 'cash_now') {
    score += 6;
  }

  if (choice.strategy === 'portal' && input.goal === 'simple_travel') {
    score += 6;
  }

  if (isTransferStrategy(choice.strategy) && input.goal === 'best_value') {
    score += 8;
  }

  if (isTransferStrategy(choice.strategy) && input.goal === 'premium_flight') {
    score += 8;
  }

  return Number(score.toFixed(1));
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
      const score = getScore(choice, normalizedInput, likelyCpp);

      return {
        ...choice,
        rank: 0,
        score,
        likelyCpp,
        estimatedValue: pointsToDollars(normalizedInput.pointsBalance, likelyCpp),
        minimumValue: pointsToDollars(normalizedInput.pointsBalance, choice.minCpp),
        maximumValue: pointsToDollars(normalizedInput.pointsBalance, choice.maxCpp),
        recommendationLabel: '',
        fitSummary: ''
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
