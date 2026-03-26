import type { CardRecord, CreditTierValue } from '@/lib/cards/schema';

export type DecisionMetricTone = 'default' | 'positive' | 'warning' | 'negative';

const creditLikeBenefitCategories = new Set([
  'streaming credits',
  'dining credits',
  'travel credits',
  'tsa global entry'
]);

export function formatCardCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatSignedCardCurrency(value: number) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

export function formatCardCreditTier(tier: CreditTierValue) {
  if (tier === 'excellent') return 'Excellent';
  if (tier === 'good') return 'Good+';
  if (tier === 'fair') return 'Fair+';
  return 'Building';
}

export function formatCardSpendWindow(days?: number) {
  if (typeof days !== 'number' || days <= 0) return null;

  if (days % 30 === 0) {
    const months = Math.round(days / 30);
    return `${months} mo${months === 1 ? '' : 's'}`;
  }

  if (days % 7 === 0 && days < 60) {
    const weeks = Math.round(days / 7);
    return `${weeks} wk${weeks === 1 ? '' : 's'}`;
  }

  return `${days} days`;
}

export function isOffsettingCreditBenefit(
  benefit: {
    category: string;
    name: string;
    description: string;
    estimatedValue?: number | null;
  }
) {
  if (benefit.estimatedValue == null || benefit.estimatedValue <= 0) return false;

  const normalizedCategory = benefit.category.toLowerCase().replace(/_/g, ' ');
  const searchableText =
    `${normalizedCategory} ${benefit.name} ${benefit.description}`.toLowerCase();

  return (
    creditLikeBenefitCategories.has(normalizedCategory) ||
    /credit|statement|global entry|tsa precheck|precheck|clear/i.test(searchableText)
  );
}

export function deriveOffsettingCreditsValue(
  benefits: Array<{
    category: string;
    name: string;
    description: string;
    estimatedValue?: number | null;
  }>
) {
  return benefits.reduce(
    (sum, benefit) => sum + (isOffsettingCreditBenefit(benefit) ? (benefit.estimatedValue ?? 0) : 0),
    0
  );
}

export function getCardRequiredSpendLabel(
  card: Pick<CardRecord, 'bestSignUpBonusSpendRequired' | 'bestSignUpBonusSpendPeriodDays'>
) {
  if (
    typeof card.bestSignUpBonusSpendRequired !== 'number' ||
    card.bestSignUpBonusSpendRequired <= 0 ||
    typeof card.bestSignUpBonusSpendPeriodDays !== 'number' ||
    card.bestSignUpBonusSpendPeriodDays <= 0
  ) {
    return 'No listed offer';
  }

  const spendWindow = formatCardSpendWindow(card.bestSignUpBonusSpendPeriodDays);
  return spendWindow
    ? `${formatCardCurrency(card.bestSignUpBonusSpendRequired)} / ${spendWindow}`
    : formatCardCurrency(card.bestSignUpBonusSpendRequired);
}

export function getCardModeledFirstYearNet(
  card: Pick<CardRecord, 'annualFee' | 'bestSignUpBonusValue' | 'offsettingCreditsValue'>
) {
  return (card.bestSignUpBonusValue ?? 0) + (card.offsettingCreditsValue ?? 0) - card.annualFee;
}

export function getCardSpendRoi(
  card: Pick<
    CardRecord,
    'annualFee' | 'bestSignUpBonusValue' | 'bestSignUpBonusSpendRequired' | 'offsettingCreditsValue'
  >
) {
  if (
    typeof card.bestSignUpBonusSpendRequired !== 'number' ||
    card.bestSignUpBonusSpendRequired <= 0
  ) {
    return null;
  }

  return (getCardModeledFirstYearNet(card) / card.bestSignUpBonusSpendRequired) * 100;
}

export function getCardDecisionMetrics(
  card: Pick<
    CardRecord,
    | 'annualFee'
    | 'bestSignUpBonusValue'
    | 'bestSignUpBonusSpendPeriodDays'
    | 'bestSignUpBonusSpendRequired'
    | 'creditTierMin'
    | 'offsettingCreditsValue'
  >
) {
  const spendRoi = getCardSpendRoi(card);
  const offsettingCreditsValue = card.offsettingCreditsValue ?? 0;

  return [
    {
      label: 'Annual fee',
      value: card.annualFee === 0 ? 'No fee' : formatCardCurrency(card.annualFee),
      detail: card.annualFee === 0 ? 'No yearly fee listed' : 'Year-one card cost',
      tone: 'default' as DecisionMetricTone
    },
    {
      label: 'Credit needed',
      value: formatCardCreditTier(card.creditTierMin),
      detail: 'Issuer approval tier',
      tone: 'default' as DecisionMetricTone
    },
    {
      label: 'Required spend',
      value: getCardRequiredSpendLabel(card),
      detail:
        typeof card.bestSignUpBonusSpendRequired === 'number' && card.bestSignUpBonusSpendRequired > 0
          ? 'Welcome-offer threshold'
          : 'No active spend hurdle',
      tone: 'default' as DecisionMetricTone
    },
    {
      label: 'Offsetting credits',
      value:
        offsettingCreditsValue > 0
          ? `~${formatCardCurrency(offsettingCreditsValue)}/yr`
          : 'None listed',
      detail:
        offsettingCreditsValue > 0 ? 'Recurring credits in dataset' : 'No recurring credits in dataset',
      tone: offsettingCreditsValue > 0 ? ('warning' as DecisionMetricTone) : ('default' as DecisionMetricTone)
    },
    {
      label: 'ROI on spend',
      value: spendRoi != null ? `${spendRoi.toFixed(1)}%` : 'N/A',
      detail: spendRoi != null ? 'Net value on required spend' : 'Needs a listed spend threshold',
      tone:
        spendRoi == null
          ? ('default' as DecisionMetricTone)
          : spendRoi >= 0
            ? ('positive' as DecisionMetricTone)
            : ('negative' as DecisionMetricTone)
    }
  ];
}
