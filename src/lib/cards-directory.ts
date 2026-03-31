import type { CardRecord } from '@/lib/cards';

const supportedDirectoryIssuerLabels = [
  'American Express',
  'Capital One',
  'Chase',
  'Citi',
  'Wells Fargo',
  'Bilt',
  'Discover',
  'Apple',
  'Robinhood',
  'Bank of America',
  'U.S. Bank',
  'Barclays',
  'SoFi',
  'PayPal',
  'Fidelity',
  'Venmo'
] as const;

export function normalizeIssuerLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function issuerKey(value: string): string {
  return normalizeIssuerLabel(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const supportedDirectoryIssuerKeys = new Set(
  supportedDirectoryIssuerLabels.map((issuer) => issuerKey(issuer))
);

export function isSupportedDirectoryIssuer(issuer: string): boolean {
  return supportedDirectoryIssuerKeys.has(issuerKey(issuer));
}

export function filterCardsForDirectory(cards: CardRecord[]): CardRecord[] {
  return cards.filter(
    (card) => isSupportedDirectoryIssuer(card.issuer) && card.cardType !== 'business'
  );
}
