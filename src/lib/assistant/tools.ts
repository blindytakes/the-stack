export type AssistantToolEntry = {
  title: string;
  href: string;
  description: string;
  keywords: string[];
};

export const assistantToolEntries: AssistantToolEntry[] = [
  {
    title: 'Personalized Bonus Plan',
    href: '/tools/card-finder?mode=full',
    description: 'Build a card and banking bonus plan from spend, credit profile, and effort level.',
    keywords: ['plan', 'bonus', 'signup', 'welcome', 'strategy', 'recommend', 'personalized']
  },
  {
    title: 'Card Comparison Tool',
    href: '/cards/compare',
    description: 'Compare two credit cards using year-one value, annual fees, credits, and spend assumptions.',
    keywords: ['compare', 'versus', 'vs', 'card', 'annual fee', 'value']
  },
  {
    title: 'Personal Finance Tracker',
    href: '/tools/personal-finance-tracker',
    description: 'Download the spreadsheet tracker for spending, bills, savings goals, and cash flow.',
    keywords: ['budget', 'tracker', 'spreadsheet', 'cash flow', 'spending']
  },
  {
    title: 'Premium Card Calculator',
    href: '/tools/premium-card-calculator',
    description: 'Run annual-fee math for premium cards like Platinum, Sapphire Reserve, and Venture X.',
    keywords: ['premium', 'platinum', 'sapphire', 'venture x', 'annual fee', 'credits']
  },
  {
    title: 'Card Benefit Calendar',
    href: '/tools/card-benefit-calendar',
    description: 'Create calendar reminders for credits, bonus deadlines, annual fees, and renewals.',
    keywords: ['calendar', 'reminder', 'credit', 'deadline', 'renewal', 'benefit']
  },
  {
    title: 'Points Redemption Tool',
    href: '/tools/points-advisor',
    description: 'Rank redemption paths and estimate whether a transfer or cash-like redemption makes sense.',
    keywords: ['points', 'miles', 'redeem', 'redemption', 'transfer', 'travel']
  }
];
