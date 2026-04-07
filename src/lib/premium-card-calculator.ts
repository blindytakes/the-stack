export type PremiumCardId = 'amex-platinum' | 'chase-sapphire-reserve' | 'capital-one-venture-x';

export type PremiumCardValueInput = {
  id: string;
  label: string;
  note?: string;
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
    annualFee: 695,
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
        defaultValue: 5000
      },
      {
        id: 'prepaid_hotels_amex_travel',
        label: 'Prepaid hotels booked on Amex Travel',
        note: '5x points',
        emoji: '🏨',
        multiplier: 5,
        defaultValue: 2500
      },
      {
        id: 'cruises_amex_travel',
        label: 'Cruises booked on Amex Travel',
        note: '2x points',
        emoji: '🚢',
        multiplier: 2,
        defaultValue: 2500
      },
      {
        id: 'amex_travel_other_prepaid',
        label: 'Other prepaid travel booked through Amex Travel',
        note: '2x points',
        emoji: '🗺️',
        multiplier: 2,
        defaultValue: 2500
      },
      {
        id: 'other_purchases',
        label: 'All other purchases',
        note: '1x points',
        emoji: '💳',
        multiplier: 1,
        defaultValue: 1000
      }
    ],
    redemptionOptions: [
      { id: 'statement-credit', label: 'Statement credit', centsPerPoint: 0.6, note: '0.6 CPP' },
      { id: 'amazon', label: 'Amazon', centsPerPoint: 0.7, note: '0.7 CPP' },
      { id: 'gift-cards', label: 'Gift cards', centsPerPoint: 1, note: '1 CPP' },
      { id: 'uber', label: 'Uber', centsPerPoint: 1, note: '1 CPP' },
      { id: 'travel', label: 'Travel', centsPerPoint: 1, note: '1 CPP' },
      { id: 'schwab', label: 'Schwab Platinum', centsPerPoint: 1.1, note: '1.1 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 2, note: '2 CPP' }
    ],
    defaultRedemptionId: 'transfer-partners',
    credits: [
      { id: 'airline-fee-credit', label: 'Airline fee credit', defaultValue: 200 },
      { id: 'resy-credit', label: 'Resy dining credit', note: 'Up to $100 per quarter', defaultValue: 400 },
      { id: 'lululemon-credit', label: 'Lululemon credit', note: 'Up to $75 per quarter', defaultValue: 300 },
      { id: 'uber-credit', label: 'Uber credit', note: '$15 monthly and $35 in December', defaultValue: 200 },
      { id: 'uber-one-credit', label: 'Uber One membership credit', defaultValue: 120 },
      { id: 'hotel-credit', label: 'Hotel credit', note: '$300 semi-annually', defaultValue: 600 },
      { id: 'digital-entertainment-credit', label: 'Digital entertainment credit', note: '$25 per month', defaultValue: 300 },
      { id: 'oura-credit', label: 'Oura Ring credit', note: 'Hardware only', defaultValue: 200 },
      { id: 'equinox-credit', label: 'Equinox credit', defaultValue: 300 },
      { id: 'clear-credit', label: 'CLEAR Plus credit', defaultValue: 209 },
      { id: 'walmart-credit', label: 'Walmart+ credit', defaultValue: 155 },
      { id: 'soulcycle-credit', label: 'SoulCycle bike credit', note: 'Only with a qualifying bike purchase', defaultValue: 0 }
    ],
    benefits: [
      { id: 'centurion-lounge', label: 'Centurion Lounge access', defaultValue: 0 },
      { id: 'delta-sky-club', label: 'Delta Sky Club visits', note: 'Set your own annual value', defaultValue: 0 },
      { id: 'priority-pass', label: 'Priority Pass access', defaultValue: 0 },
      { id: 'fine-hotels-resorts', label: 'Fine Hotels + Resorts', defaultValue: 0 },
      { id: 'centurion-suites', label: 'Centurion Suites', defaultValue: 0 },
      { id: 'hotel-status', label: 'Hotel status value', note: 'Marriott Gold + Hilton Gold', defaultValue: 0 },
      { id: 'leaders-club', label: 'Leaders Club status', defaultValue: 0 },
      { id: 'resy-events', label: 'Platinum Nights by Resy', defaultValue: 0 },
      { id: 'concierge', label: 'Concierge and service perks', defaultValue: 0 },
      { id: 'cell-protection', label: 'Cell phone protection', defaultValue: 0 }
    ],
    timingAdjustments: {
      firstYearLabel: 'Year 1-only / double-dip extras',
      firstYearNote: 'Use this to model one-time credits, launch-year perks, or opening-date double dips.',
      firstYearDefaultValue: 1549,
      renewalLabel: 'Renewal-only extras',
      renewalNote: 'Leave at zero unless you expect renewal-only value in year 2.',
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
    annualFee: 550,
    eligibilityNote:
      'Sapphire-family rules can block the bonus if you currently hold another Sapphire card or received a Sapphire bonus recently.',
    welcomeOffer: {
      offerPresets: [60000, 75000, 90000],
      defaultPoints: 75000,
      spendRequired: 4000,
      spendWindowMonths: 3
    },
    spendCategories: [
      {
        id: 'chase-portal-flights',
        label: 'Flights booked through Chase Travel',
        note: '5x points',
        emoji: '✈️',
        multiplier: 5,
        defaultValue: 2000
      },
      {
        id: 'chase-portal-hotels-cars',
        label: 'Hotels and car rentals booked through Chase Travel',
        note: '10x points',
        emoji: '🏨',
        multiplier: 10,
        defaultValue: 3000
      },
      {
        id: 'dining',
        label: 'Dining worldwide',
        note: '3x points',
        emoji: '🍽️',
        multiplier: 3,
        defaultValue: 6000
      },
      {
        id: 'other-travel',
        label: 'Other travel after the annual travel credit',
        note: '3x points',
        emoji: '🌍',
        multiplier: 3,
        defaultValue: 5000
      },
      {
        id: 'all-other',
        label: 'All other purchases',
        note: '1x points',
        emoji: '💳',
        multiplier: 1,
        defaultValue: 4000
      }
    ],
    redemptionOptions: [
      { id: 'cash-back', label: 'Cash back', centsPerPoint: 1, note: '1 CPP' },
      { id: 'chase-travel', label: 'Chase Travel', centsPerPoint: 1.5, note: '1.5 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 2, note: '2 CPP' }
    ],
    defaultRedemptionId: 'chase-travel',
    credits: [
      { id: 'annual-travel-credit', label: 'Annual travel credit', defaultValue: 300 },
      { id: 'delivery-perks', label: 'Food-delivery or DashPass value', defaultValue: 0 },
      { id: 'rideshare-perks', label: 'Rideshare / Lyft value', defaultValue: 0 },
      { id: 'issuer-offers', label: 'Chase Offers or merchant promos', defaultValue: 0 }
    ],
    benefits: [
      { id: 'lounge-access', label: 'Priority Pass or Sapphire lounge access', defaultValue: 0 },
      { id: 'travel-protections', label: 'Trip delay / cancellation protections', defaultValue: 0 },
      { id: 'primary-rental', label: 'Primary rental-car coverage', defaultValue: 0 },
      { id: 'transfer-optionality', label: 'Hyatt / airline transfer flexibility', defaultValue: 0 },
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
      'Capital One repeat-bonus and approval rules can change, so use this toggle based on the current offer terms and your Venture history.',
    welcomeOffer: {
      offerPresets: [75000, 90000, 100000],
      defaultPoints: 75000,
      spendRequired: 4000,
      spendWindowMonths: 3
    },
    spendCategories: [
      {
        id: 'capital-one-hotels',
        label: 'Hotels and vacation rentals through Capital One Travel',
        note: '10x miles',
        emoji: '🏨',
        multiplier: 10,
        defaultValue: 3000
      },
      {
        id: 'capital-one-flights',
        label: 'Flights through Capital One Travel',
        note: '5x miles',
        emoji: '✈️',
        multiplier: 5,
        defaultValue: 2000
      },
      {
        id: 'capital-one-cars',
        label: 'Rental cars through Capital One Travel',
        note: '10x miles',
        emoji: '🚗',
        multiplier: 10,
        defaultValue: 1000
      },
      {
        id: 'travel-outside-portal',
        label: 'Travel booked outside the portal',
        note: '2x miles',
        emoji: '🌍',
        multiplier: 2,
        defaultValue: 4000
      },
      {
        id: 'all-other-purchases',
        label: 'All other purchases',
        note: '2x miles',
        emoji: '💳',
        multiplier: 2,
        defaultValue: 12000
      }
    ],
    redemptionOptions: [
      { id: 'travel-erase', label: 'Travel statement erase', centsPerPoint: 1, note: '1 CPP' },
      { id: 'capital-one-travel', label: 'Capital One Travel', centsPerPoint: 1, note: '1 CPP' },
      { id: 'transfer-partners', label: 'Transfer partners', centsPerPoint: 1.8, note: '1.8 CPP' }
    ],
    defaultRedemptionId: 'transfer-partners',
    credits: [
      { id: 'annual-travel-credit', label: 'Capital One Travel credit', defaultValue: 300 },
      { id: 'hotel-collection-value', label: 'Premier or Lifestyle Collection value', defaultValue: 0 },
      { id: 'issuer-offers', label: 'Capital One Offers or shopping value', defaultValue: 0 }
    ],
    benefits: [
      { id: 'lounge-access', label: 'Capital One Lounge + Priority Pass access', defaultValue: 0 },
      { id: 'hertz-status', label: 'Rental-car status / upgrades', defaultValue: 0 },
      { id: 'travel-protections', label: 'Travel protections', defaultValue: 0 },
      { id: 'authorized-users', label: 'Authorized-user lounge access', defaultValue: 0 }
    ],
    timingAdjustments: {
      firstYearLabel: 'Year 1-only extras',
      firstYearNote: 'Use this for any onboarding value that will not repeat.',
      firstYearDefaultValue: 0,
      renewalLabel: 'Renewal-only extras',
      renewalNote: 'Good place to add anniversary-miles value or other year-2 keepers.',
      renewalDefaultValue: 180
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
    offerPoints: profile.welcomeOffer.defaultPoints,
    annualFee: profile.annualFee,
    selectedRedemptionId: defaultRedemption.id,
    centsPerPoint: defaultRedemption.centsPerPoint,
    spend: buildValueRecord(profile.spendCategories),
    credits: buildValueRecord(profile.credits),
    benefits: buildValueRecord(profile.benefits),
    firstYearExtraValue: profile.timingAdjustments.firstYearDefaultValue,
    renewalOnlyValue: profile.timingAdjustments.renewalDefaultValue
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
