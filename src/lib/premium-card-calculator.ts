export type PremiumCardId = 'amex-platinum' | 'chase-sapphire-reserve' | 'capital-one-venture-x';

export type PremiumCardValueInput = {
  id: string;
  label: string;
  note?: string;
  singleLineDisplay?: string;
  defaultValue: number;
};

export type PremiumCardSpendCategory = PremiumCardValueInput & {
  emoji: string;
  multiplier: number;
};

export type PremiumCardRedemptionOption = {
  id: string;
  label: string;
  centsPerPoint: number;
  note?: string;
};

export type PremiumCardProfile = {
  id: PremiumCardId;
  slug: string;
  name: string;
  shortName: string;
  issuer: string;
  headline: string;
  description: string;
  offerCurrencyLabel: string;
  offerCurrencyShortLabel: string;
  annualFee: number;
  eligibilityNote: string;
  welcomeOffer: {
    offerPresets: number[];
    defaultPoints: number;
    spendRequired: number;
    spendWindowMonths: number;
  };
  spendCategories: PremiumCardSpendCategory[];
  redemptionOptions: PremiumCardRedemptionOption[];
  defaultRedemptionId: string;
  credits: PremiumCardValueInput[];
  benefits: PremiumCardValueInput[];
  timingAdjustments: {
    firstYearLabel: string;
    firstYearNote?: string;
    firstYearDefaultValue: number;
    renewalLabel: string;
    renewalNote?: string;
    renewalDefaultValue: number;
  };
};

export type PremiumCardScenario = {
  eligibleForBonus: boolean;
  canMeetSpend: boolean;
  offerPoints: number;
  annualFee: number;
  selectedRedemptionId: string;
  centsPerPoint: number;
  spend: Record<string, number>;
  credits: Record<string, number>;
  benefits: Record<string, number>;
  firstYearExtraValue: number;
  renewalOnlyValue: number;
};

export type PremiumCardSpendResult = {
  id: string;
  label: string;
  note?: string;
  emoji: string;
  multiplier: number;
  spend: number;
  pointsEarned: number;
};

export type PremiumCardCalculation = {
  welcomeOfferPoints: number;
  spendPoints: number;
  totalPointsYear1: number;
  totalPointsYear2: number;
  centsPerPoint: number;
  recurringCreditsValue: number;
  benefitsValue: number;
  firstYearExtraValue: number;
  renewalOnlyValue: number;
  pointsValueYear1: number;
  pointsValueYear2: number;
  expectedValueYear1: number;
  expectedValueYear2: number;
  spendBreakdown: PremiumCardSpendResult[];
};

function buildValueRecord(inputs: ReadonlyArray<PremiumCardValueInput>) {
  return Object.fromEntries(inputs.map((item) => [item.id, item.defaultValue])) as Record<string, number>;
}

function clampMoney(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function pointsToDollars(points: number, centsPerPoint: number) {
  return Math.round((points * centsPerPoint) / 100);
}

export const premiumCardProfiles = [
  {
    id: 'amex-platinum',
    slug: 'amex-platinum-card',
    name: 'The Platinum Card from American Express',
    shortName: 'Amex Platinum',
    issuer: 'American Express',
    headline: 'Big upside if you redeem well and actually use the credits.',
    description:
      'Best when you want lounge access, premium-travel perks, and you are willing to manage a long credits list.',
    offerCurrencyLabel: 'Membership Rewards points',
    offerCurrencyShortLabel: 'MR',
    annualFee: 895,
    eligibilityNote:
      'You are not eligible if you have or have had the card, even if you never received a bonus.',
    welcomeOffer: {
      offerPresets: [100000, 150000, 175000],
      defaultPoints: 175000,
      spendRequired: 8000,
      spendWindowMonths: 6
    },
    spendCategories: [
      {
        id: 'flights_direct_or_amex_travel',
        label: 'Flights booked directly with airlines or Amex Travel',
        note: '5x points',
        emoji: '✈️',
        multiplier: 5,
        defaultValue: 0
      },
      {
        id: 'prepaid_hotels_amex_travel',
        label: 'Prepaid hotels booked on Amex Travel',
        note: '5x points',
        emoji: '🏨',
        multiplier: 5,
        defaultValue: 0
      },
      {
        id: 'other_purchases',
        label: 'All other purchases',
        note: '1x points',
        emoji: '💳',
        multiplier: 1,
        defaultValue: 0
      }
    ],
    redemptionOptions: [
      { id: 'statement-credit', label: 'Statement credit', centsPerPoint: 0.6, note: '0.6 CPP' },
      { id: 'amazon', label: 'Amazon', centsPerPoint: 0.7, note: '0.7 CPP' },
      { id: 'gift-cards', label: 'Gift cards', centsPerPoint: 1, note: '1 CPP' },
      { id: 'uber', label: 'Uber', centsPerPoint: 1, note: '1 CPP' },
      { id: 'travel', label: 'Travel', centsPerPoint: 1, note: '1 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 2, note: '2 CPP' }
    ],
    defaultRedemptionId: 'transfer-partners',
    credits: [
      {
        id: 'airline-fee-credit',
        label: 'Airline fee credit',
        note: 'Up to $200 per year',
        singleLineDisplay: 'Airline fee credit · Up to $200 per year',
        defaultValue: 0
      },
      {
        id: 'resy-credit',
        label: 'Resy credit',
        note: '$400 annual value, issued as up to $100 per quarter',
        defaultValue: 0
      },
      {
        id: 'lululemon-credit',
        label: 'lululemon credit',
        note: '$300 annual value, issued as up to $75 per quarter',
        defaultValue: 0
      },
      {
        id: 'uber-credit',
        label: 'Uber Cash',
        note: '$200 annual value, issued as $15 monthly plus $20 in December',
        defaultValue: 0
      },
      { id: 'uber-one-credit', label: 'Uber One credit', note: 'Up to $120 per year', defaultValue: 0 },
      {
        id: 'hotel-credit',
        label: 'Hotel credit',
        note: 'Up to $300 semi-annually on prepaid FHR / Hotel Collection stays',
        defaultValue: 0
      },
      {
        id: 'digital-entertainment-credit',
        label: 'Digital entertainment credit',
        note: 'Up to $25 per month',
        defaultValue: 0
      },
      { id: 'clear-credit', label: 'CLEAR Plus credit', note: 'Up to $209 per year', defaultValue: 0 },
      {
        id: 'walmart-credit',
        label: 'Walmart+ membership credit',
        note: 'Up to $12.95 plus tax per month',
        defaultValue: 0
      },
      {
        id: 'saks-credit',
        label: 'Shop Saks with Platinum',
        note: 'Up to $50 Jan-Jun and $50 Jul-Dec',
        defaultValue: 0
      }
    ],
    benefits: [
      { id: 'global-lounge-collection', label: 'Global Lounge Collection access', defaultValue: 0 },
      { id: 'delta-sky-club', label: 'Delta Sky Club visits', note: '10 visits when flying Delta', defaultValue: 0 },
      { id: 'priority-pass', label: 'Priority Pass Select access', defaultValue: 0 },
      { id: 'fine-hotels-resorts', label: 'Fine Hotels + Resorts perks', defaultValue: 0 },
      {
        id: 'hotel-status',
        label: 'Hotel status value',
        note: 'Hilton Honors Gold and Marriott Bonvoy Gold Elite',
        defaultValue: 0
      },
      { id: 'global-dining-access', label: 'Global Dining Access by Resy', defaultValue: 0 },
      { id: 'platinum-nights', label: 'Platinum Nights by Resy', defaultValue: 0 },
      { id: 'concierge', label: 'Concierge and service perks', defaultValue: 0 },
      { id: 'travel-protections', label: 'Travel protections', defaultValue: 0 }
    ],
    timingAdjustments: {
      firstYearLabel: 'Year 1-only extras',
      firstYearNote: 'Use this for opening-year only value, one-time credits, or timing double dips.',
      firstYearDefaultValue: 0,
      renewalLabel: 'Renewal-only extras',
      renewalNote: 'Use this for anniversary-year value that only starts after year 1.',
      renewalDefaultValue: 0
    }
  },
  {
    id: 'chase-sapphire-reserve',
    slug: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    shortName: 'Sapphire Reserve',
    issuer: 'Chase',
    headline: 'Cleaner premium value if you want strong travel protections and flexible points.',
    description:
      'Works best when you book some travel through Chase, spend heavily on dining and travel, and want simpler credits than Amex.',
    offerCurrencyLabel: 'Ultimate Rewards points',
    offerCurrencyShortLabel: 'UR',
    annualFee: 795,
    eligibilityNote:
      'The card is unavailable if you currently hold it, and Chase says the bonus may not be available if you have held it or earned a bonus on it before.',
    welcomeOffer: {
      offerPresets: [75000, 100000, 125000],
      defaultPoints: 125000,
      spendRequired: 6000,
      spendWindowMonths: 3
    },
    spendCategories: [
      {
        id: 'chase-travel',
        label: 'Purchases through Chase Travel, including The Edit',
        note: '8x points',
        emoji: '✈️',
        multiplier: 8,
        defaultValue: 0
      },
      {
        id: 'direct-flights',
        label: 'Flights booked direct with airlines',
        note: '4x points',
        emoji: '✈️',
        multiplier: 4,
        defaultValue: 0
      },
      {
        id: 'direct-hotels',
        label: 'Hotels booked direct',
        note: '4x points',
        emoji: '🏨',
        multiplier: 4,
        defaultValue: 0
      },
      {
        id: 'dining',
        label: 'Dining worldwide',
        note: '3x points',
        emoji: '🍽️',
        multiplier: 3,
        defaultValue: 0
      },
      {
        id: 'all-other',
        label: 'All other purchases',
        note: '1x points',
        emoji: '💳',
        multiplier: 1,
        defaultValue: 0
      }
    ],
    redemptionOptions: [
      { id: 'cash-back', label: 'Cash back', centsPerPoint: 1, note: '1 CPP' },
      { id: 'chase-travel', label: 'Chase Travel', centsPerPoint: 1.5, note: '1.5 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 2, note: '2 CPP' }
    ],
    defaultRedemptionId: 'chase-travel',
    credits: [
      {
        id: 'annual-travel-credit',
        label: 'Annual travel credit',
        note: 'Up to $300 per account anniversary year',
        defaultValue: 0
      },
      {
        id: 'the-edit-credit',
        label: 'The Edit credit',
        note: 'Up to $250 Jan-Jun and $250 Jul-Dec',
        defaultValue: 0
      },
      {
        id: 'select-hotel-credit',
        label: 'Select Chase Travel hotel credit',
        note: 'Up to $250 through 12/31/26',
        defaultValue: 0
      },
      {
        id: 'dining-credit',
        label: 'OpenTable dining credit',
        note: 'Up to $150 Jan-Jun and $150 Jul-Dec',
        defaultValue: 0
      },
      {
        id: 'apple-subscriptions',
        label: 'Apple TV+ and Apple Music',
        note: '$288 annual value through 6/22/27',
        defaultValue: 0
      },
      {
        id: 'dashpass-membership',
        label: 'DashPass membership',
        note: '$120 value for 12 months when activated by 12/31/27',
        defaultValue: 0
      },
      {
        id: 'doordash-promos',
        label: 'DoorDash promos',
        note: 'Up to $25 per month through 12/31/27',
        defaultValue: 0
      },
      {
        id: 'stubhub-credit',
        label: 'StubHub / viagogo credit',
        note: 'Up to $150 Jan-Jun and $150 Jul-Dec through 12/31/27',
        defaultValue: 0
      },
      {
        id: 'lyft-credit',
        label: 'Lyft credit',
        note: 'Up to $10 per month through 9/30/27',
        defaultValue: 0
      },
      {
        id: 'peloton-credit',
        label: 'Peloton membership credit',
        note: 'Up to $10 per month through 12/31/27',
        defaultValue: 0
      }
    ],
    benefits: [
      { id: 'lounge-access', label: 'Sapphire Lounge and Priority Pass access', defaultValue: 0 },
      { id: 'travel-protections', label: 'Trip delay / cancellation protections', defaultValue: 0 },
      { id: 'primary-rental', label: 'Primary rental-car coverage', defaultValue: 0 },
      { id: 'ihg-status', label: 'IHG One Rewards Platinum Elite status', note: 'Through 12/31/27', defaultValue: 0 },
      { id: 'reserve-travel-designers', label: 'Reserve Travel Designers', note: 'Up to $300 per trip', defaultValue: 0 },
      { id: 'global-entry-credit', label: 'Global Entry / TSA PreCheck / NEXUS credit', note: 'Up to $120 every 4 years', defaultValue: 0 },
      { id: 'concierge', label: 'Visa Infinite concierge and protections', defaultValue: 0 }
    ],
    timingAdjustments: {
      firstYearLabel: 'Year 1-only extras',
      firstYearNote: 'Use this if your first year includes unique onboarding value that will not repeat.',
      firstYearDefaultValue: 0,
      renewalLabel: 'Renewal-only extras',
      renewalNote: 'Use this for anniversary or year-2 value that does not show up in year 1.',
      renewalDefaultValue: 0
    }
  },
  {
    id: 'capital-one-venture-x',
    slug: 'capital-one-venture-x',
    name: 'Capital One Venture X Rewards Credit Card',
    shortName: 'Capital One Venture X',
    issuer: 'Capital One',
    headline: 'Strong premium baseline if you want a low-friction keeper card.',
    description:
      'Best when you want a simple 2x floor, some portal bookings, and premium lounge access without managing a coupon-book card.',
    offerCurrencyLabel: 'Capital One miles',
    offerCurrencyShortLabel: 'Miles',
    annualFee: 395,
    eligibilityNote:
      'Capital One says existing or previous cardmembers are not eligible if they earned a new-cardmember bonus on Venture X in the past 48 months.',
    welcomeOffer: {
      offerPresets: [75000, 100000, 125000, 150000],
      defaultPoints: 75000,
      spendRequired: 4000,
      spendWindowMonths: 3
    },
    spendCategories: [
      {
        id: 'capital-one-hotels-rental-cars',
        label: 'Hotels and rental cars through Capital One Travel',
        note: '10x miles',
        emoji: '🏨',
        multiplier: 10,
        defaultValue: 0
      },
      {
        id: 'capital-one-flights-vacation-rentals',
        label: 'Flights and vacation rentals through Capital One Travel',
        note: '5x miles',
        emoji: '✈️',
        multiplier: 5,
        defaultValue: 0
      },
      {
        id: 'travel-outside-portal',
        label: 'Travel booked outside Capital One Travel',
        note: '2x miles',
        emoji: '🌍',
        multiplier: 2,
        defaultValue: 0
      },
      {
        id: 'capital-one-entertainment',
        label: 'Capital One Entertainment purchases',
        note: '5x miles',
        emoji: '🎟️',
        multiplier: 5,
        defaultValue: 0
      },
      {
        id: 'all-other-purchases',
        label: 'All other purchases',
        note: '2x miles',
        emoji: '💳',
        multiplier: 2,
        defaultValue: 0
      }
    ],
    redemptionOptions: [
      { id: 'travel-erase', label: 'Travel statement erase', centsPerPoint: 1, note: '1 CPP' },
      { id: 'capital-one-travel', label: 'Capital One Travel', centsPerPoint: 1, note: '1 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 1.8, note: '1.8 CPP' }
    ],
    defaultRedemptionId: 'transfer-partners',
    credits: [
      {
        id: 'annual-travel-credit',
        label: 'Capital One Travel credit',
        note: 'Up to $300 each account year',
        defaultValue: 0
      },
      {
        id: 'global-entry-credit',
        label: 'Global Entry / TSA PreCheck credit',
        note: 'Up to $120',
        defaultValue: 0
      },
      {
        id: 'lifestyle-collection-credit',
        label: 'Lifestyle Collection experience credit',
        note: '$50 per stay',
        defaultValue: 0
      },
      {
        id: 'premier-collection-credit',
        label: 'Premier Collection experience credit',
        note: '$100 per stay',
        defaultValue: 0
      }
    ],
    benefits: [
      { id: 'lounge-access', label: 'Capital One Lounge / Landing + Priority Pass access', defaultValue: 0 },
      { id: 'anniversary-miles', label: '10,000 anniversary miles', note: 'Starting on the first anniversary', defaultValue: 0 },
      { id: 'hertz-status', label: 'Hertz President’s Circle status', defaultValue: 0 },
      { id: 'travel-protections', label: 'Travel protections', defaultValue: 0 },
      { id: 'capital-one-dining', label: 'Capital One Dining access', defaultValue: 0 },
      { id: 'capital-one-entertainment', label: 'Capital One Entertainment access', defaultValue: 0 },
      { id: 'authorized-users', label: 'Authorized-user value', defaultValue: 0 }
    ],
    timingAdjustments: {
      firstYearLabel: 'Year 1-only extras',
      firstYearNote: 'Use this for any onboarding value that will not repeat.',
      firstYearDefaultValue: 0,
      renewalLabel: 'Renewal-only extras',
      renewalNote: 'Good place to add anniversary-miles value or other year-2 keepers.',
      renewalDefaultValue: 0
    }
  }
] as const satisfies ReadonlyArray<PremiumCardProfile>;

export const premiumCardProfileById = premiumCardProfiles.reduce<Record<PremiumCardId, PremiumCardProfile>>(
  (accumulator, profile) => {
    accumulator[profile.id] = profile;
    return accumulator;
  },
  {} as Record<PremiumCardId, PremiumCardProfile>
);

export function buildInitialPremiumCardScenario(profile: PremiumCardProfile): PremiumCardScenario {
  const defaultRedemption =
    profile.redemptionOptions.find((option) => option.id === profile.defaultRedemptionId) ??
    profile.redemptionOptions[0];

  return {
    eligibleForBonus: true,
    canMeetSpend: true,
    offerPoints: 0,
    annualFee: profile.annualFee,
    selectedRedemptionId: defaultRedemption.id,
    centsPerPoint: defaultRedemption.centsPerPoint,
    spend: buildValueRecord(profile.spendCategories),
    credits: buildValueRecord(profile.credits),
    benefits: buildValueRecord(profile.benefits),
    firstYearExtraValue: 0,
    renewalOnlyValue: 0
  };
}

export function calculatePremiumCardScenario(
  profile: PremiumCardProfile,
  scenario: PremiumCardScenario
): PremiumCardCalculation {
  const spendBreakdown = profile.spendCategories.map((category) => {
    const spend = clampMoney(scenario.spend[category.id] ?? 0);
    return {
      id: category.id,
      label: category.label,
      note: category.note,
      emoji: category.emoji,
      multiplier: category.multiplier,
      spend,
      pointsEarned: Math.round(spend * category.multiplier)
    };
  });

  const spendPoints = spendBreakdown.reduce((sum, category) => sum + category.pointsEarned, 0);
  const recurringCreditsValue = profile.credits.reduce(
    (sum, credit) => sum + clampMoney(scenario.credits[credit.id] ?? 0),
    0
  );
  const benefitsValue = profile.benefits.reduce(
    (sum, benefit) => sum + clampMoney(scenario.benefits[benefit.id] ?? 0),
    0
  );
  const firstYearExtraValue = clampMoney(scenario.firstYearExtraValue);
  const renewalOnlyValue = clampMoney(scenario.renewalOnlyValue);
  const annualFee = clampMoney(scenario.annualFee);
  const centsPerPoint = Number.isFinite(scenario.centsPerPoint) && scenario.centsPerPoint > 0
    ? scenario.centsPerPoint
    : 0;
  const welcomeOfferPoints =
    scenario.eligibleForBonus && scenario.canMeetSpend ? clampMoney(scenario.offerPoints) : 0;
  const totalPointsYear1 = welcomeOfferPoints + spendPoints;
  const totalPointsYear2 = spendPoints;
  const pointsValueYear1 = pointsToDollars(totalPointsYear1, centsPerPoint);
  const pointsValueYear2 = pointsToDollars(totalPointsYear2, centsPerPoint);

  return {
    welcomeOfferPoints,
    spendPoints,
    totalPointsYear1,
    totalPointsYear2,
    centsPerPoint,
    recurringCreditsValue,
    benefitsValue,
    firstYearExtraValue,
    renewalOnlyValue,
    pointsValueYear1,
    pointsValueYear2,
    expectedValueYear1: pointsValueYear1 + recurringCreditsValue + benefitsValue + firstYearExtraValue - annualFee,
    expectedValueYear2: pointsValueYear2 + recurringCreditsValue + benefitsValue + renewalOnlyValue - annualFee,
    spendBreakdown
  };
}
