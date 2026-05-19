import { readAllCardSeedDatasets } from '@/lib/card-seed-files';
import type { CardRecord } from '@/lib/cards';
import { getCardsData } from '@/lib/cards';
import type { CardSeedRecord } from '@/lib/card-seed-schema';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';
import { learnArticles } from '@/lib/learn-articles';
import { assistantToolEntries, type AssistantToolEntry } from '@/lib/assistant/tools';

const MAX_CONTEXT_ITEMS = {
  tools: 6,
  cards: 5,
  banking: 5,
  articles: 3
} as const;

const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'best',
  'can',
  'card',
  'cards',
  'for',
  'from',
  'have',
  'help',
  'how',
  'into',
  'need',
  'should',
  'that',
  'the',
  'this',
  'use',
  'what',
  'when',
  'which',
  'with',
  'would',
  'you'
]);

const CATEGORY_HINTS: Record<string, string[]> = {
  groceries: ['grocery', 'groceries', 'supermarket', 'food'],
  dining: ['dining', 'restaurant', 'restaurants', 'takeout'],
  travel: ['travel', 'flight', 'hotel', 'trip', 'airline', 'airport'],
  gas: ['gas', 'fuel'],
  streaming: ['streaming', 'netflix', 'spotify'],
  online_shopping: ['online', 'shopping', 'amazon'],
  entertainment: ['entertainment', 'concert', 'ticket'],
  utilities: ['utility', 'utilities', 'internet', 'phone']
};

type Ranked<T> = {
  item: T;
  score: number;
};

type AssistantCardItem = {
  slug: string;
  name: string;
  issuer: string;
  cardType?: string;
  rewardType: string;
  topCategories: string[];
  annualFee: number;
  creditTierMin: string;
  headline: string;
  description?: string;
  welcomeBonusValue?: number;
  welcomeSpendRequired?: number;
  welcomeSpendPeriodDays?: number;
  totalBenefitsValue?: number;
  lastVerified?: string;
};

export type AssistantContextResult = {
  text: string;
  warnings: string[];
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeAssistantQuery(query: string): string[] {
  const normalized = normalizeText(query);
  const terms = new Set(
    normalized
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length > 2 && !STOP_WORDS.has(term))
  );

  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((hint) => normalized.includes(hint))) {
      terms.add(category);
    }
  }

  return Array.from(terms);
}

function scoreText(haystack: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const normalized = normalizeText(haystack);
  return terms.reduce((score, term) => {
    if (normalized === term) return score + 8;
    if (normalized.includes(term)) return score + 2;
    return score;
  }, 0);
}

function rankByQuery<T>(
  items: T[],
  queryTerms: string[],
  toHaystack: (item: T) => string,
  extraScore: (item: T) => number = () => 0
): Ranked<T>[] {
  return items
    .map((item) => ({
      item,
      score: scoreText(toHaystack(item), queryTerms) + extraScore(item)
    }))
    .filter((ranked) => ranked.score > 0)
    .sort((left, right) => right.score - left.score);
}

function firstCurrentBonus(card: CardSeedRecord) {
  return card.signUpBonuses?.find((bonus) => bonus.isCurrentOffer !== false);
}

function fromCardRecord(card: CardRecord): AssistantCardItem {
  return {
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    cardType: card.cardType,
    rewardType: card.rewardType,
    topCategories: card.topCategories,
    annualFee: card.annualFee,
    creditTierMin: card.creditTierMin,
    headline: card.headline,
    description: card.description,
    welcomeBonusValue: card.bestSignUpBonusValue,
    welcomeSpendRequired: card.bestSignUpBonusSpendRequired,
    welcomeSpendPeriodDays: card.bestSignUpBonusSpendPeriodDays,
    totalBenefitsValue: card.totalBenefitsValue,
    lastVerified: card.lastVerified
  };
}

function fromCardSeedRecord(card: CardSeedRecord): AssistantCardItem {
  const bonus = firstCurrentBonus(card);
  return {
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    cardType: card.cardType,
    rewardType: card.rewardType,
    topCategories: card.topCategories,
    annualFee: card.annualFee,
    creditTierMin: card.creditTierMin,
    headline: card.headline,
    description: card.description,
    welcomeBonusValue: bonus?.bonusValue,
    welcomeSpendRequired: bonus?.spendRequired,
    welcomeSpendPeriodDays: bonus?.spendPeriodDays,
    totalBenefitsValue: card.benefits?.reduce((total, benefit) => total + (benefit.estimatedValue ?? 0), 0),
    lastVerified: card.lastVerified
  };
}

async function loadAssistantCards(): Promise<{ cards: AssistantCardItem[]; warning?: string }> {
  try {
    const { cards } = await getCardsData();
    return { cards: cards.map(fromCardRecord) };
  } catch {
    try {
      const datasets = await readAllCardSeedDatasets();
      return {
        cards: datasets
          .flatMap((dataset) => dataset.cards)
          .filter((card) => card.isActive !== false)
          .map(fromCardSeedRecord),
        warning: 'Card context is using checked-in seed data because runtime card data was unavailable.'
      };
    } catch {
      return {
        cards: [],
        warning: 'Card context was unavailable.'
      };
    }
  }
}

async function loadAssistantBankingOffers(): Promise<{
  offers: BankingBonusListItem[];
  warning?: string;
}> {
  try {
    const { bonuses } = await getBankingBonusesData();
    return { offers: bonuses };
  } catch {
    return {
      offers: [],
      warning: 'Banking bonus context was unavailable.'
    };
  }
}

function formatCurrency(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function formatCard(card: AssistantCardItem): string {
  const bonus =
    typeof card.welcomeBonusValue === 'number'
      ? ` welcome value ${formatCurrency(card.welcomeBonusValue)} after ${formatCurrency(
          card.welcomeSpendRequired
        )} spend/${card.welcomeSpendPeriodDays ?? 'n/a'} days;`
      : '';

  return [
    `- ${card.name} (${card.issuer})`,
    `path /cards/${card.slug};`,
    `fee ${formatCurrency(card.annualFee)};`,
    `type ${card.cardType ?? 'unknown'} ${card.rewardType};`,
    `categories ${card.topCategories.join(', ')};`,
    `credit ${card.creditTierMin};`,
    bonus,
    `headline: ${card.headline}`,
    card.description ? `; note: ${card.description}` : '',
    card.lastVerified ? `; verified ${card.lastVerified}` : ''
  ].join(' ');
}

function formatBankingOffer(offer: BankingBonusListItem): string {
  const directDeposit = offer.directDeposit.required
    ? `direct deposit required ${formatCurrency(offer.directDeposit.minimumAmount)}`
    : 'no direct deposit required';
  const states =
    offer.stateRestrictions && offer.stateRestrictions.length > 0
      ? `state-limited to ${offer.stateRestrictions.join(', ')}`
      : 'not state-limited in Stack data';

  return [
    `- ${offer.bankName} ${offer.offerName}`,
    `path /banking/${offer.slug};`,
    `bonus ${formatCurrency(offer.bonusAmount)};`,
    `net ${formatCurrency(offer.estimatedNetValue)};`,
    `${offer.accountType};`,
    `${directDeposit};`,
    `opening deposit ${formatCurrency(offer.minimumOpeningDeposit)};`,
    `holding ${offer.holdingPeriodDays ?? 'n/a'} days;`,
    `${states};`,
    offer.lastVerified ? `verified ${offer.lastVerified};` : '',
    `headline: ${offer.headline}`
  ].join(' ');
}

function formatTool(tool: AssistantToolEntry): string {
  return `- ${tool.title}: ${tool.description} Path ${tool.href}.`;
}

function formatArticle(slug: string, article: (typeof learnArticles)[string]): string {
  return `- ${article.title}: ${article.description} Path /learn/${slug}. Key takeaway: ${
    article.keyTakeaway ?? 'n/a'
  }`;
}

function scoreCardExtra(card: AssistantCardItem): number {
  return Math.min(Math.max(card.welcomeBonusValue ?? 0, 0) / 250, 4);
}

function scoreBankingExtra(offer: BankingBonusListItem): number {
  return Math.min(Math.max(offer.estimatedNetValue ?? offer.bonusAmount, 0) / 250, 4);
}

function wantsCardContext(question: string): boolean {
  return /\b(card|cards|credit|cashback|points|miles|travel|groceries|dining|gas|bonus|welcome)\b/i.test(
    question
  );
}

function wantsBankingContext(question: string): boolean {
  return /\b(bank|banking|checking|savings|deposit|apy|direct deposit|bonus)\b/i.test(question);
}

export async function buildAssistantContext(question: string): Promise<AssistantContextResult> {
  const queryTerms = tokenizeAssistantQuery(question);
  const [{ cards, warning: cardWarning }, { offers, warning: bankingWarning }] = await Promise.all([
    loadAssistantCards(),
    loadAssistantBankingOffers()
  ]);

  const rankedTools = rankByQuery(
    assistantToolEntries,
    queryTerms,
    (tool) => `${tool.title} ${tool.description} ${tool.keywords.join(' ')}`
  );
  const tools = (rankedTools.length > 0 ? rankedTools.map((ranked) => ranked.item) : assistantToolEntries).slice(
    0,
    MAX_CONTEXT_ITEMS.tools
  );

  const rankedCardMatches = rankByQuery(
    cards,
    queryTerms,
    (card) =>
      `${card.name} ${card.issuer} ${card.cardType ?? ''} ${card.rewardType} ${card.topCategories.join(
        ' '
      )} ${card.headline} ${card.description ?? ''}`,
    scoreCardExtra
  );
  const rankedCards =
    rankedCardMatches.length > 0
      ? rankedCardMatches.slice(0, MAX_CONTEXT_ITEMS.cards)
      : wantsCardContext(question)
        ? cards
            .map((card) => ({ item: card, score: scoreCardExtra(card) }))
            .sort((left, right) => right.score - left.score)
            .slice(0, MAX_CONTEXT_ITEMS.cards)
        : [];

  const rankedBankingMatches = rankByQuery(
    offers,
    queryTerms,
    (offer) =>
      `${offer.bankName} ${offer.offerName} ${offer.accountType} ${offer.headline} ${
        offer.requiredActions?.join(' ') ?? ''
      }`,
    scoreBankingExtra
  );
  const rankedBanking =
    rankedBankingMatches.length > 0
      ? rankedBankingMatches.slice(0, MAX_CONTEXT_ITEMS.banking)
      : wantsBankingContext(question)
        ? offers
            .map((offer) => ({ item: offer, score: scoreBankingExtra(offer) }))
            .sort((left, right) => right.score - left.score)
            .slice(0, MAX_CONTEXT_ITEMS.banking)
        : [];

  const articleEntries = Object.entries(learnArticles);
  const rankedArticles = rankByQuery(
    articleEntries,
    queryTerms,
    ([slug, article]) =>
      `${slug} ${article.title} ${article.category} ${article.description} ${
        article.keyTakeaway ?? ''
      } ${article.sections.map((section) => `${section.heading} ${section.body}`).join(' ')}`,
    () => 0
  ).slice(0, MAX_CONTEXT_ITEMS.articles);

  const warnings = [cardWarning, bankingWarning].filter((warning): warning is string => Boolean(warning));
  const sections = [
    `Relevant Stack tools:\n${tools.map(formatTool).join('\n')}`,
    rankedCards.length > 0
      ? `Relevant credit cards:\n${rankedCards.map((ranked) => formatCard(ranked.item)).join('\n')}`
      : 'Relevant credit cards: none matched the current question.',
    rankedBanking.length > 0
      ? `Relevant banking offers:\n${rankedBanking.map((ranked) => formatBankingOffer(ranked.item)).join('\n')}`
      : 'Relevant banking offers: none matched the current question.',
    rankedArticles.length > 0
      ? `Relevant Stack articles:\n${rankedArticles
          .map((ranked) => formatArticle(ranked.item[0], ranked.item[1]))
          .join('\n')}`
      : 'Relevant Stack articles: none matched the current question.',
    warnings.length > 0 ? `Context warnings:\n${warnings.map((warning) => `- ${warning}`).join('\n')}` : ''
  ].filter(Boolean);

  return {
    text: sections.join('\n\n'),
    warnings
  };
}
