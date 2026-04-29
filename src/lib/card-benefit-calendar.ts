export type BenefitCalendarCardId =
  | 'amex-platinum'
  | 'amex-gold'
  | 'chase-sapphire-reserve'
  | 'chase-sapphire-preferred'
  | 'capital-one-venture-x'
  | 'citi-strata-elite';

export type BenefitCalendarCard = {
  id: BenefitCalendarCardId;
  name: string;
  shortName: string;
  issuer: string;
  annualFee: number;
  accentClassName: string;
  artUrl: string;
  summary: string;
};

export type BenefitCalendarRule = {
  id: string;
  cardId: BenefitCalendarCardId;
  title: string;
  description: string;
  value?: number;
  category: 'credit' | 'activation' | 'bonus' | 'renewal' | 'benefit';
  cadence: 'monthly' | 'quarterly' | 'semiannual' | 'annual-calendar' | 'annual-anniversary' | 'trusted-traveler';
  month?: number;
  day?: number;
  reminderDay?: number;
  offsetDays?: number;
};

export type BenefitCalendarSettings = {
  anniversaryDate: string;
  bonusStartDate?: string;
};

export type BenefitCalendarEvent = {
  id: string;
  cardId: BenefitCalendarCardId;
  cardName: string;
  title: string;
  description: string;
  startsAt: Date;
  value?: number;
  category: BenefitCalendarRule['category'];
};

export const benefitCalendarCards: BenefitCalendarCard[] = [
  {
    id: 'amex-platinum',
    name: 'The Platinum Card from American Express',
    shortName: 'Amex Platinum',
    issuer: 'American Express',
    annualFee: 895,
    accentClassName: 'border-[#d6e5ff]/35 bg-[#d6e5ff]/8',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png',
    summary: 'High-value but high-maintenance credits across travel, dining, rideshare, and lifestyle.'
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    shortName: 'Amex Gold',
    issuer: 'American Express',
    annualFee: 325,
    accentClassName: 'border-[#f6d36b]/35 bg-[#f6d36b]/8',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/gold-card.png',
    summary: 'Monthly food and dining credits that are easy to miss without a habit.'
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    shortName: 'Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795,
    accentClassName: 'border-[#5ae0ff]/35 bg-[#5ae0ff]/8',
    artUrl:
      'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/sapphire_reserve_card_Halo.png',
    summary: 'Simpler travel value, strong protections, and renewal timing that deserves a decision point.'
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    shortName: 'Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    accentClassName: 'border-[#739dff]/35 bg-[#739dff]/8',
    artUrl:
      'https://images.ctfassets.net/8qmz0ef3xzub/7iFzyweepMTrfGn2VrDdL5/6adcc35d50cef1e3087ced153d3b7bee/sapphire_preferred_card.png',
    summary: 'Lower-fee travel card with anniversary hotel credit and bonus-deadline tracking.'
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X Rewards Credit Card',
    shortName: 'Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    accentClassName: 'border-[#ff6a55]/35 bg-[#ff6a55]/8',
    artUrl: 'https://ecm.capitalone.com/WCM/card/products/venture-x-card-art.png',
    summary: 'Low-lift premium card with anniversary miles and portal travel credit reminders.'
  },
  {
    id: 'citi-strata-elite',
    name: 'Citi Strata Elite Card',
    shortName: 'Citi Strata Elite',
    issuer: 'Citi',
    annualFee: 595,
    accentClassName: 'border-[#7ab4ff]/35 bg-[#7ab4ff]/8',
    artUrl:
      'https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-strata-elite-credit-card/citi-strata-elite-credit-card_306x192.webp',
    summary: 'Premium travel credits and hotel credits that benefit from calendar-year planning.'
  }
];

export const benefitCalendarRules: BenefitCalendarRule[] = [
  {
    id: 'amex-platinum-uber',
    cardId: 'amex-platinum',
    title: 'Use monthly Uber Cash',
    description: 'Check Uber Cash before month-end. December is usually richer than other months.',
    value: 15,
    category: 'credit',
    cadence: 'monthly',
    reminderDay: 24
  },
  {
    id: 'amex-platinum-digital-entertainment',
    cardId: 'amex-platinum',
    title: 'Confirm digital entertainment credit posted',
    description: 'Verify the monthly streaming or entertainment credit posted before the month closes.',
    value: 25,
    category: 'credit',
    cadence: 'monthly',
    reminderDay: 24
  },
  {
    id: 'amex-platinum-resy',
    cardId: 'amex-platinum',
    title: 'Use quarterly Resy credit',
    description: 'Use the quarterly Resy dining credit before the quarter resets.',
    value: 100,
    category: 'credit',
    cadence: 'quarterly',
    reminderDay: 20
  },
  {
    id: 'amex-platinum-hotel',
    cardId: 'amex-platinum',
    title: 'Use semiannual hotel credit',
    description: 'Book eligible prepaid Fine Hotels + Resorts or Hotel Collection stays before the half-year window closes.',
    value: 300,
    category: 'credit',
    cadence: 'semiannual',
    reminderDay: 15
  },
  {
    id: 'amex-platinum-airline',
    cardId: 'amex-platinum',
    title: 'Check airline fee credit balance',
    description: 'Review eligible airline incidental credits before the calendar year ends.',
    value: 200,
    category: 'credit',
    cadence: 'annual-calendar',
    month: 12,
    day: 10
  },
  {
    id: 'amex-gold-dining',
    cardId: 'amex-gold',
    title: 'Use monthly dining credit',
    description: 'Use eligible dining partners before the monthly credit expires.',
    value: 10,
    category: 'credit',
    cadence: 'monthly',
    reminderDay: 23
  },
  {
    id: 'amex-gold-uber',
    cardId: 'amex-gold',
    title: 'Use monthly Uber Cash',
    description: 'Check Uber or Uber Eats before month-end.',
    value: 10,
    category: 'credit',
    cadence: 'monthly',
    reminderDay: 23
  },
  {
    id: 'amex-gold-resy',
    cardId: 'amex-gold',
    title: 'Use semiannual Resy credit',
    description: 'Use the dining credit before the six-month window resets.',
    value: 50,
    category: 'credit',
    cadence: 'semiannual',
    reminderDay: 15
  },
  {
    id: 'chase-sapphire-reserve-travel',
    cardId: 'chase-sapphire-reserve',
    title: 'Check annual travel credit balance',
    description: 'Confirm how much of the annual travel credit has posted before renewal math gets fuzzy.',
    value: 300,
    category: 'credit',
    cadence: 'annual-anniversary',
    offsetDays: -45
  },
  {
    id: 'chase-sapphire-reserve-quarterly',
    cardId: 'chase-sapphire-reserve',
    title: 'Review quarterly partner credits',
    description: 'Check active dining, delivery, rideshare, or travel partner credits before the quarter closes.',
    category: 'activation',
    cadence: 'quarterly',
    reminderDay: 18
  },
  {
    id: 'chase-sapphire-preferred-hotel',
    cardId: 'chase-sapphire-preferred',
    title: 'Use anniversary hotel credit',
    description: 'Plan a Chase Travel hotel booking before the anniversary hotel credit goes stale.',
    value: 50,
    category: 'credit',
    cadence: 'annual-anniversary',
    offsetDays: -30
  },
  {
    id: 'capital-one-venture-x-travel',
    cardId: 'capital-one-venture-x',
    title: 'Use Capital One Travel credit',
    description: 'Check the annual Capital One Travel credit and route an eligible booking through the portal if needed.',
    value: 300,
    category: 'credit',
    cadence: 'annual-anniversary',
    offsetDays: -60
  },
  {
    id: 'capital-one-venture-x-anniversary-miles',
    cardId: 'capital-one-venture-x',
    title: 'Confirm anniversary miles posted',
    description: 'Look for the annual bonus miles after renewal and include them in the keep-or-cancel math.',
    value: 100,
    category: 'benefit',
    cadence: 'annual-anniversary',
    offsetDays: 15
  },
  {
    id: 'citi-strata-elite-hotel',
    cardId: 'citi-strata-elite',
    title: 'Use hotel credit',
    description: 'Check eligible hotel credit terms and book before the year-end rush.',
    value: 300,
    category: 'credit',
    cadence: 'annual-calendar',
    month: 11,
    day: 15
  },
  {
    id: 'citi-strata-elite-splurge',
    cardId: 'citi-strata-elite',
    title: 'Review annual lifestyle credits',
    description: 'Check any merchant or lifestyle credits still unused before the calendar year closes.',
    category: 'credit',
    cadence: 'annual-calendar',
    month: 12,
    day: 5
  },
  {
    id: 'trusted-traveler',
    cardId: 'amex-platinum',
    title: 'Check Global Entry or TSA PreCheck credit eligibility',
    description: 'Trusted traveler credits usually reset on a multi-year cycle. Check whether this is your renewal year.',
    value: 120,
    category: 'benefit',
    cadence: 'trusted-traveler',
    month: 10,
    day: 1
  }
];

const renewalOffsets = [-60, -30, 3];

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function dateForMonth(year: number, month: number, day: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, lastDay), 9, 0, 0, 0);
}

function isWithinWindow(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function getNextAnniversary(base: Date, start: Date) {
  let candidate = new Date(start.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0, 0);
  if (candidate < start) candidate = addYears(candidate, 1);
  return candidate;
}

function buildRuleEvents(
  rule: BenefitCalendarRule,
  card: BenefitCalendarCard,
  settings: BenefitCalendarSettings,
  start: Date,
  end: Date
) {
  const events: BenefitCalendarEvent[] = [];
  const pushEvent = (startsAt: Date, suffix: string) => {
    if (!isWithinWindow(startsAt, start, end)) return;
    events.push({
      id: `${rule.id}-${suffix}`,
      cardId: card.id,
      cardName: card.shortName,
      title: rule.title,
      description: rule.description,
      startsAt,
      value: rule.value,
      category: rule.category
    });
  };

  if (rule.cadence === 'monthly') {
    for (let cursor = new Date(start.getFullYear(), start.getMonth(), 1); cursor <= end; cursor = addMonths(cursor, 1)) {
      const month = cursor.getMonth() + 1;
      pushEvent(dateForMonth(cursor.getFullYear(), month, rule.reminderDay ?? 24), `${cursor.getFullYear()}-${month}`);
    }
  }

  if (rule.cadence === 'quarterly') {
    const quarterMonths = [3, 6, 9, 12];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      for (const month of quarterMonths) {
        pushEvent(dateForMonth(year, month, rule.reminderDay ?? 20), `${year}-${month}`);
      }
    }
  }

  if (rule.cadence === 'semiannual') {
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      pushEvent(dateForMonth(year, 6, rule.reminderDay ?? 15), `${year}-6`);
      pushEvent(dateForMonth(year, 12, rule.reminderDay ?? 15), `${year}-12`);
    }
  }

  if (rule.cadence === 'annual-calendar' || rule.cadence === 'trusted-traveler') {
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      pushEvent(dateForMonth(year, rule.month ?? 12, rule.day ?? 1), `${year}`);
    }
  }

  if (rule.cadence === 'annual-anniversary') {
    const anniversary = getNextAnniversary(parseLocalDate(settings.anniversaryDate), start);
    pushEvent(addDays(anniversary, rule.offsetDays ?? 0), `${anniversary.getFullYear()}`);
    pushEvent(addDays(addYears(anniversary, 1), rule.offsetDays ?? 0), `${anniversary.getFullYear() + 1}`);
  }

  return events;
}

export function buildBenefitCalendarEvents({
  selectedCardIds,
  settingsByCardId,
  startDate = new Date(),
  months = 12
}: {
  selectedCardIds: BenefitCalendarCardId[];
  settingsByCardId: Partial<Record<BenefitCalendarCardId, BenefitCalendarSettings>>;
  startDate?: Date;
  months?: number;
}) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = addMonths(start, months);
  const events: BenefitCalendarEvent[] = [];

  for (const cardId of selectedCardIds) {
    const card = benefitCalendarCards.find((item) => item.id === cardId);
    const settings = settingsByCardId[cardId];
    if (!card || !settings) continue;

    for (const offset of renewalOffsets) {
      const anniversary = getNextAnniversary(parseLocalDate(settings.anniversaryDate), start);
      const date = addDays(anniversary, offset);
      if (isWithinWindow(date, start, end)) {
        const title = offset < 0 ? `Renewal decision in ${Math.abs(offset)} days` : 'Check annual fee posted';
        events.push({
          id: `${card.id}-renewal-${offset}`,
          cardId: card.id,
          cardName: card.shortName,
          title,
          description:
            offset < 0
              ? `Review ${card.shortName}'s used credits, annual fee, and downgrade or retention options before renewal.`
              : `Confirm the annual fee posted correctly and decide whether the card still earns its place.`,
          startsAt: date,
          value: card.annualFee,
          category: 'renewal'
        });
      }
    }

    if (settings.bonusStartDate) {
      const bonusStart = parseLocalDate(settings.bonusStartDate);
      const bonusDeadline = addDays(bonusStart, 85);
      if (isWithinWindow(bonusDeadline, start, end)) {
        events.push({
          id: `${card.id}-bonus-deadline`,
          cardId: card.id,
          cardName: card.shortName,
          title: 'Sign-up bonus spend deadline check',
          description: `Check whether ${card.shortName}'s minimum spend is complete before the welcome offer window closes.`,
          startsAt: bonusDeadline,
          category: 'bonus'
        });
      }
    }

    const cardRules = benefitCalendarRules.filter((rule) => rule.cardId === cardId);
    for (const rule of cardRules) {
      events.push(...buildRuleEvents(rule, card, settings, start, end));
    }
  }

  return events.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatIcsDate(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildBenefitCalendarIcs(events: BenefitCalendarEvent[]) {
  const now = formatIcsDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Stack//Card Benefit Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:The Stack Card Benefit Calendar'
  ];

  for (const event of events) {
    const end = addDays(event.startsAt, 1);
    const valueText = typeof event.value === 'number' ? ` Estimated value or fee: $${event.value}.` : '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@thestackhq.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(event.startsAt)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(`${event.cardName}: ${event.title}`)}`,
      `DESCRIPTION:${escapeIcsText(`${event.description}${valueText}`)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
