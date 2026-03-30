const issuerNameAliases: Record<string, string[]> = {
  'american express': ['amex'],
  'bank of america': ['bofa'],
  'u.s. bank': ['us bank', 'u s bank']
};

const fallbackLabelStopwords = new Set([
  'card',
  'credit',
  'rewards',
  'reward',
  'business',
  'personal',
  'world',
  'elite',
  'mastercard',
  'visa',
  'signature',
  'infinite',
  'select',
  'of',
  'from',
  'the'
]);

function normalizeComparableText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
    .filter(Boolean);
}

export function cardNameReferencesIssuer(cardName: string | undefined, issuer: string) {
  if (!cardName) return true;

  const normalizedCardName = normalizeComparableText(cardName);
  const normalizedIssuer = normalizeComparableText(issuer);
  if (normalizedIssuer === 'chase') return true;
  const aliases = issuerNameAliases[normalizedIssuer] ?? [];

  return [normalizedIssuer, ...aliases.map(normalizeComparableText)].some((candidate) => {
    return candidate.length > 0 && normalizedCardName.includes(candidate);
  });
}

export function getCardFallbackLabel(cardName: string, issuer: string) {
  const tokens = tokenize(cardName);
  const uppercaseBrandToken = tokens.find((token) => {
    const cleaned = token.replace(/[^A-Z0-9]/g, '');
    return cleaned.length >= 2 && cleaned.length <= 5 && cleaned === cleaned.toUpperCase();
  });

  if (uppercaseBrandToken) {
    return uppercaseBrandToken.replace(/[^A-Z0-9]/g, '');
  }

  const normalizedIssuer = normalizeComparableText(issuer);
  const meaningfulTokens = tokens.filter((token) => {
    const normalizedToken = token.toLowerCase();
    return (
      normalizedToken &&
      normalizeComparableText(token) !== normalizedIssuer &&
      !fallbackLabelStopwords.has(normalizedToken)
    );
  });

  if (meaningfulTokens.length >= 2) {
    return meaningfulTokens.slice(0, 2).join(' ');
  }

  if (meaningfulTokens.length === 1) {
    return meaningfulTokens[0] ?? cardName;
  }

  return cardName;
}
