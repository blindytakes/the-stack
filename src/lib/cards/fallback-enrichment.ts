import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';
import type {
  CardTypeValue,
  RewardTypeValue,
  SpendingCategoryValue
} from '@/lib/cards/schema';

export type CardFallbackSource = {
  slug: string;
  issuer: string;
  name: string;
  cardType: CardTypeValue;
  annualFee: number;
  foreignTxFee: number;
  rewardType: RewardTypeValue;
  topCategories: SpendingCategoryValue[];
};

export type FallbackBenefit = {
  category: string;
  name: string;
  description: string;
  estimatedValue?: number;
  activationMethod?: string;
};

const cardBrandImageUrlByIssuer: Record<string, string> = {
  'american express': '/card-logos/american-express.svg',
  apple: '/card-logos/apple.svg',
  barclays: '/card-logos/barclays.svg',
  chase: '/card-logos/chase.svg',
  citi: '/card-logos/citi.svg',
  discover: '/card-logos/discover.svg',
  fidelity: '/card-logos/fidelity.svg',
  paypal: '/card-logos/paypal.svg',
  robinhood: '/card-logos/robinhood.svg',
  venmo: '/card-logos/venmo.svg'
};

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesToken(source: CardFallbackSource, ...tokens: string[]) {
  const slug = source.slug.toLowerCase();
  return tokens.some((token) => slug.includes(token));
}

function benefit(
  category: string,
  name: string,
  description: string,
  options?: Pick<FallbackBenefit, 'estimatedValue' | 'activationMethod'>
): FallbackBenefit {
  return {
    category,
    name,
    description,
    ...(options?.estimatedValue != null ? { estimatedValue: options.estimatedValue } : {}),
    ...(options?.activationMethod ? { activationMethod: options.activationMethod } : {})
  };
}

function dedupeBenefits(benefits: FallbackBenefit[]) {
  const seen = new Set<string>();
  return benefits.filter((entry) => {
    const key = `${entry.category}:${entry.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function genericBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [];

  if (source.annualFee === 0) {
    benefits.push(
      benefit(
        'OTHER',
        'No Annual Fee',
        'You can keep the card long term without paying a recurring annual fee.'
      )
    );
  }

  if (source.foreignTxFee === 0) {
    benefits.push(
      benefit(
        'OTHER',
        'No Foreign Transaction Fees',
        'Eligible international purchases do not incur an added foreign transaction surcharge.'
      )
    );
  }

  if (source.cardType === 'business') {
    benefits.push(
      benefit(
        'OTHER',
        'Business Account Controls',
        'Business cards usually include account-management tools that help separate company spend and monitor employee purchases.'
      )
    );
  }

  if (source.rewardType !== 'cashback' || source.topCategories.includes('travel')) {
    benefits.push(
      benefit(
        'OTHER',
        'Travel Rewards Ecosystem',
        'The card is designed to fit into a broader travel-rewards setup through issuer redemptions, hotel stays, flights, or travel-portal bookings.'
      )
    );
  }

  if (benefits.length < 2 && source.rewardType === 'cashback') {
    benefits.push(
      benefit(
        'OTHER',
        'Everyday Cashback Simplicity',
        'The card is built around easy day-to-day redemption without needing to manage a complex points program.'
      )
    );
  }

  return benefits;
}

function americanExpressBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [
    benefit(
      'OTHER',
      'Amex Offers Access',
      'Eligible cardholders can add targeted Amex Offers for statement credits or bonus rewards with participating merchants.'
    ),
    benefit(
      'PURCHASE_PROTECTION',
      'Purchase and Warranty Protections',
      'American Express cards commonly include purchase-protection and extended-warranty style coverage on eligible purchases.'
    )
  ];

  if (includesToken(source, 'platinum')) {
    benefits.unshift(
      benefit(
        'LOUNGE_ACCESS',
        'Premium Lounge Access',
        'Platinum-tier cards are built around airport-lounge access across the Amex lounge ecosystem and partner lounge programs.'
      )
    );
  }

  if (includesToken(source, 'hilton')) {
    benefits.unshift(
      benefit(
        'OTHER',
        'Hilton Honors Status Perks',
        'Hilton co-brand cardholders can unlock hotel-program benefits such as elite-status value, bonus earnings on stays, and on-property perks.'
      )
    );
  }

  return benefits;
}

function capitalOneBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [
    benefit(
      'PRICE_PROTECTION',
      'Capital One Travel Booking Tools',
      'Capital One Travel includes booking features such as price monitoring, change-support workflows, and issuer-managed travel booking features.'
    ),
    benefit(
      'OTHER',
      'Capital One Entertainment Access',
      'Eligible cardholders can access event inventory and experiences through the Capital One Entertainment platform.'
    )
  ];

  if (source.cardType === 'business') {
    benefits.push(
      benefit(
        'OTHER',
        'Employee Cards and Virtual Cards',
        'Capital One business cards are geared toward teams, with employee-card support and account tools for business spend management.'
      )
    );
  }

  if (includesToken(source, 'venture-x')) {
    benefits.unshift(
      benefit(
        'LOUNGE_ACCESS',
        'Airport Lounge Access',
        'Venture X cards are built around premium airport-lounge access and high-end travel benefits.'
      ),
      benefit(
        'TRAVEL_CREDITS',
        'Annual Travel Credit',
        'Venture X products include an annual travel-credit mechanic when eligible bookings are made through Capital One Travel.',
        { estimatedValue: 300 }
      )
    );
  }

  return benefits;
}

function chaseBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [];

  if (includesToken(source, 'united')) {
    if (!includesToken(source, 'gateway')) {
      benefits.push(
        benefit(
          'OTHER',
          'United Checked Bag and Boarding Perks',
          'Most United co-brand cards bundle airline perks such as checked-bag value and priority-boarding style benefits on eligible United itineraries.'
        )
      );
    }

    if (includesToken(source, 'club')) {
      benefits.push(
        benefit(
          'LOUNGE_ACCESS',
          'United Club Access',
          'Club-tier United cards are designed around airport-lounge access and premium airport treatment.'
        )
      );
    }
  }

  if (includesToken(source, 'southwest')) {
    benefits.push(
      benefit(
        'OTHER',
        'Southwest Anniversary Value',
        'Southwest cards are centered on Rapid Rewards value through anniversary points, flight-related perks, or other airline-program benefits.'
      )
    );

    if (includesToken(source, 'priority')) {
      benefits.push(
        benefit(
          'TRAVEL_CREDITS',
          'Southwest Annual Travel Credit',
          'Priority-tier Southwest cards include an annual travel-credit style perk that offsets part of the yearly fee.'
        )
      );
    }
  }

  if (includesToken(source, 'hyatt')) {
    benefits.push(
      benefit(
        'OTHER',
        'World of Hyatt Elite Value',
        'Hyatt co-brand cards are tied to hotel-program perks such as elite-status value, award-night enhancements, and qualifying-night progress.'
      )
    );
  }

  if (includesToken(source, 'ihg')) {
    benefits.push(
      benefit(
        'OTHER',
        'IHG Award-Night Perks',
        'IHG co-brand cards are built around hotel-program value such as elite-style perks and award-night enhancements on eligible stays.'
      )
    );
  }

  if (includesToken(source, 'marriott')) {
    benefits.push(
      benefit(
        'OTHER',
        'Marriott Bonvoy Hotel Perks',
        'Marriott co-brand cards typically provide hotel-program benefits such as elite-status value and anniversary-night style benefits.'
      )
    );
  }

  if (source.cardType === 'business') {
    benefits.push(
      benefit(
        'OTHER',
        'Chase Business Account Tools',
        'Chase business cards are designed to support employee spending, account segmentation, and business purchase tracking.'
      )
    );
  }

  return benefits;
}

function bankOfAmericaBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [
    benefit(
      'OTHER',
      source.cardType === 'business'
        ? 'Preferred Rewards for Business Upside'
        : 'Preferred Rewards Upside',
      'Eligible Bank of America relationship customers can unlock higher effective earnings through the issuer’s relationship-based rewards boost programs.'
    )
  ];

  if (includesToken(source, 'alaska')) {
    benefits.push(
      benefit(
        'OTHER',
        'Alaska Airlines Travel Perks',
        'The Alaska co-brand card is designed around Mileage Plan value, including airline-trip perks such as companion-style value and checked-bag savings.'
      )
    );
  }

  if (includesToken(source, 'premium-rewards')) {
    benefits.push(
      benefit(
        'TSA_GLOBAL_ENTRY',
        'Trusted Traveler Credit',
        'Premium Rewards cards are positioned as travel cards and commonly include Global Entry or TSA PreCheck application-fee value.'
      )
    );
  }

  return benefits;
}

function barclaysBenefits(source: CardFallbackSource): FallbackBenefit[] {
  if (includesToken(source, 'wyndham')) {
    return [
      benefit(
        'OTHER',
        'Wyndham Hotel Program Perks',
        'The Wyndham Earner family is built around hotel-program value such as elite-style perks and anniversary-points style benefits.'
      ),
      benefit(
        'OTHER',
        'Hotel Status and Award Value',
        'Wyndham co-brand cardholders can turn ongoing spend into stronger hotel-stay value across the Wyndham ecosystem.'
      )
    ];
  }

  if (includesToken(source, 'jetblue')) {
    return [
      benefit(
        'OTHER',
        'JetBlue Travel Perks',
        'JetBlue co-brand cards are centered on TrueBlue value, airline savings, and cardholder-only travel perks on eligible itineraries.'
      ),
      benefit(
        'OTHER',
        'In-Flight Savings',
        'JetBlue cardholders commonly get airline-linked savings or bonus value on eligible in-flight purchases and JetBlue bookings.'
      )
    ];
  }

  if (includesToken(source, 'aadvantage')) {
    return [
      benefit(
        'OTHER',
        'American Airlines Trip Perks',
        'AAdvantage co-brand cards are designed around airline-trip value such as checked-bag savings and boarding-related perks.'
      ),
      benefit(
        'OTHER',
        'AAdvantage Program Value',
        'The card is built to strengthen value inside the American Airlines AAdvantage ecosystem through travel perks and bonus mileage earning.'
      )
    ];
  }

  return [];
}

function citiBenefits(source: CardFallbackSource): FallbackBenefit[] {
  if (includesToken(source, 'aadvantage')) {
    const benefits = [
      benefit(
        'OTHER',
        'American Airlines Trip Perks',
        'Citi AAdvantage cards are built around checked-bag savings, boarding-related perks, and stronger value for frequent American Airlines travelers.'
      ),
      benefit(
        'OTHER',
        'AAdvantage Mileage Program Integration',
        'The card deepens value inside the American Airlines ecosystem through mileage earning and airline-specific cardholder benefits.'
      )
    ];

    if (includesToken(source, 'executive')) {
      benefits.unshift(
        benefit(
          'LOUNGE_ACCESS',
          'Admirals Club Access',
          'Executive-tier AAdvantage cards are positioned around premium airport-lounge access and richer travel perks.'
        )
      );
    }

    return benefits;
  }

  if (includesToken(source, 'strata')) {
    return [
      benefit(
        'OTHER',
        'Citi ThankYou Rewards Access',
        'Strata cards keep you in Citi’s ThankYou-style rewards ecosystem for travel or statement-credit redemptions.'
      ),
      benefit(
        'OTHER',
        'Everyday Category Coverage',
        'The card is designed to deliver stronger value on everyday spend categories without carrying an annual fee.'
      )
    ];
  }

  return [
    benefit(
      'OTHER',
      'Flexible Citi Rewards Redemptions',
      'The card stays inside Citi’s cash-back or ThankYou-style redemption ecosystem with simple digital redemption options.'
    )
  ];
}

function usBankBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const benefits: FallbackBenefit[] = [];

  if (includesToken(source, 'altitude-reserve')) {
    benefits.push(
      benefit(
        'TRAVEL_CREDITS',
        'Annual Travel and Dining Credit',
        'Altitude Reserve is built around a large recurring travel-and-dining credit that offsets part of the annual fee.',
        { estimatedValue: 325 }
      ),
      benefit(
        'LOUNGE_ACCESS',
        'Airport Lounge Access',
        'Altitude Reserve is positioned as a premium travel card with airport-lounge access benefits.'
      ),
      benefit(
        'TSA_GLOBAL_ENTRY',
        'Trusted Traveler Credit',
        'Premium Altitude products commonly include Global Entry or TSA PreCheck application-fee value.'
      )
    );
  }

  if (includesToken(source, 'altitude-go')) {
    benefits.push(
      benefit(
        'STREAMING_CREDITS',
        'Annual Streaming Credit',
        'Altitude Go includes a recurring streaming-service credit mechanic for eligible subscriptions.',
        { estimatedValue: 15 }
      )
    );
  }

  if (includesToken(source, 'cash-plus')) {
    benefits.push(
      benefit(
        'OTHER',
        'Selectable Bonus Categories',
        'Cash+ is built around customizable high-earn categories that cardholders can adjust inside the issuer experience.'
      )
    );
  }

  if (includesToken(source, 'shopper')) {
    benefits.push(
      benefit(
        'OTHER',
        'Retailer Choice Flexibility',
        'Shopper Cash Rewards is designed around elevated earnings at select retailers that cardholders choose.'
      )
    );
  }

  if (includesToken(source, 'smartly')) {
    benefits.push(
      benefit(
        'OTHER',
        'Relationship-Based Earning Boost',
        'Smartly is designed to reward broader U.S. Bank relationships with stronger effective earnings.'
      )
    );
  }

  if (source.cardType === 'business') {
    benefits.push(
      benefit(
        'OTHER',
        'Business Spend Management',
        'U.S. Bank business cards are geared toward business account controls, team spending, and issuer-managed account tools.'
      )
    );
  }

  return benefits;
}

function wellsFargoBenefits(source: CardFallbackSource): FallbackBenefit[] {
  if (includesToken(source, 'autograph-journey')) {
    return [
      benefit(
        'TRAVEL_CREDITS',
        '$50 Annual Airline Credit',
        'Autograph Journey includes an annual airline-ticket statement-credit mechanic on eligible direct airline purchases.',
        { estimatedValue: 50 }
      ),
      benefit(
        'CELL_PHONE',
        'Cell Phone Protection',
        'Eligible monthly wireless bills paid with the card can unlock cell phone protection under issuer terms.'
      ),
      benefit(
        'OTHER',
        'Travel Transfer Ecosystem',
        'Autograph Journey is built to sit inside Wells Fargo’s travel-rewards ecosystem with richer travel redemption options.'
      )
    ];
  }

  return [];
}

function fintechBenefits(source: CardFallbackSource): FallbackBenefit[] {
  if (includesToken(source, 'apple-card')) {
    return [
      benefit(
        'OTHER',
        'Daily Cash Ecosystem',
        'Apple Card is built around Daily Cash with its best economics tied to Apple Pay and Apple purchases.'
      ),
      benefit(
        'OTHER',
        'Apple Card Monthly Installments',
        'Eligible Apple purchases can be financed through Apple Card Monthly Installments under issuer terms.'
      ),
      benefit(
        'OTHER',
        'No Fee Structure',
        'Apple Card is positioned around no annual, late, or foreign transaction fees.'
      )
    ];
  }

  if (includesToken(source, 'robinhood-gold')) {
    return [
      benefit(
        'OTHER',
        'Robinhood Gold Integration',
        'The card is designed to work inside the Robinhood Gold ecosystem and is most relevant for customers already using that subscription.'
      ),
      benefit(
        'OTHER',
        'Enhanced Flat-Rate Rewards',
        'Robinhood Gold Card is positioned as a high-earn flat-rate option relative to the broader no-fee market.'
      ),
      benefit(
        'OTHER',
        'Travel Portal Upside',
        'Eligible bookings through Robinhood’s travel flow can unlock elevated travel earning.'
      )
    ];
  }

  if (includesToken(source, 'paypal')) {
    return [
      benefit(
        'OTHER',
        'PayPal Checkout Integration',
        'The card is built to work naturally inside the PayPal checkout flow and reward PayPal-based purchases more heavily.'
      ),
      benefit(
        'OTHER',
        'Straightforward Cashback Redemptions',
        'Rewards are structured to be simple for cardholders already active in the PayPal wallet ecosystem.'
      )
    ];
  }

  if (includesToken(source, 'sofi')) {
    return [
      benefit(
        'OTHER',
        'SoFi Ecosystem Redemptions',
        'The card is designed to work best when rewards flow back into the wider SoFi ecosystem for saving, investing, or debt payoff.'
      ),
      benefit(
        'OTHER',
        'Flat-Rate Simplicity',
        'The card is positioned as an uncomplicated catch-all card for users already active with SoFi.'
      )
    ];
  }

  if (includesToken(source, 'fidelity')) {
    return [
      benefit(
        'OTHER',
        'Direct Fidelity Account Deposits',
        'Rewards can be directed into eligible Fidelity accounts, which is the main differentiator for the card.'
      ),
      benefit(
        'OTHER',
        'Simple Long-Term Hold Value',
        'The card is designed as a set-it-and-forget-it catch-all option for customers who already use Fidelity.'
      )
    ];
  }

  if (includesToken(source, 'venmo')) {
    return [
      benefit(
        'OTHER',
        'Automatic Top-Category Earning',
        'Venmo Credit Card stands out by dynamically rewarding the category where you spend the most each statement cycle.'
      ),
      benefit(
        'OTHER',
        'Venmo App Integration',
        'The card is designed around the broader Venmo app experience, notifications, and social-payments familiarity.'
      )
    ];
  }

  return [];
}

function discoverBenefits(source: CardFallbackSource): FallbackBenefit[] {
  const issuer = normalizeKey(source.issuer);

  if (issuer === 'american express') return americanExpressBenefits(source);
  if (issuer === 'capital one') return capitalOneBenefits(source);
  if (issuer === 'chase') return chaseBenefits(source);
  if (issuer === 'bank of america') return bankOfAmericaBenefits(source);
  if (issuer === 'barclays') return barclaysBenefits(source);
  if (issuer === 'citi') return citiBenefits(source);
  if (issuer === 'u.s. bank') return usBankBenefits(source);
  if (issuer === 'wells fargo') return wellsFargoBenefits(source);
  if (['apple', 'robinhood', 'paypal', 'sofi', 'fidelity', 'venmo'].includes(issuer)) {
    return fintechBenefits(source);
  }

  if (issuer === 'discover' && includesToken(source, 'miles')) {
    return [
      benefit(
        'OTHER',
        'Miles Match First-Year Value',
        'Discover it Miles is built around Discover’s first-year rewards match mechanic, which can materially increase first-year value.'
      ),
      benefit(
        'OTHER',
        'No Foreign Transaction Fees',
        'The card remains useful for international spend because eligible purchases do not incur a foreign transaction surcharge.'
      )
    ];
  }

  return [];
}

export function resolveCardBrandImageUrl(issuer: string, imageUrl?: string | null) {
  const curatedCardImageUrl = cardBrandImageUrlByIssuer[normalizeKey(issuer)];

  if (imageUrl) {
    const normalizedImageUrl = imageUrl.trim();
    if (curatedCardImageUrl && isLowValueCardImageUrl(normalizedImageUrl)) {
      return curatedCardImageUrl;
    }

    return normalizedImageUrl;
  }

  return curatedCardImageUrl ?? resolveBankingBrandImageUrl(issuer);
}

export function resolveCardFallbackBenefits(source: CardFallbackSource): FallbackBenefit[] {
  return dedupeBenefits([...discoverBenefits(source), ...genericBenefits(source)]).slice(0, 4);
}
