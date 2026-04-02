import type { BankingBonusListItem } from '@/lib/banking/schema';
import { formatBankingCurrency } from '@/lib/banking/copy';

export type DecisionMetricTone = 'default' | 'positive' | 'warning' | 'negative';

export function extractActivityRequirement(
  offer: Pick<BankingBonusListItem, 'requiredActions'>
) {
  const combinedActions = offer.requiredActions.join(' ');
  const countedMatch = combinedActions.match(
    /(\d+)\s+(?:qualifying\s+)?(?:debit\s+card\s+|debit\s+)?(?:transactions?|purchases?|swipes?)/i
  );

  if (countedMatch) {
    return `${countedMatch[1]} transactions`;
  }

  if (/bill pay/i.test(combinedActions)) return 'Bill pay required';
  if (/debit|purchase|transaction|activity/i.test(combinedActions)) return 'Activity required';

  return null;
}

export function formatBankingHoldPeriod(days?: number) {
  if (!days || days <= 0) return 'Check terms';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function parseUniqueDollarAmounts(text: string) {
  return Array.from(
    new Set(
      (text.match(/\$[\d,]+/g) ?? []).map((value) => Number.parseInt(value.replace(/[$,]/g, ''), 10))
    )
  ).filter((value) => Number.isFinite(value));
}

export function hasAmbiguousTieredFundingRequirement(
  offer: Pick<BankingBonusListItem, 'headline' | 'requiredActions'>
) {
  const combinedText = `${offer.headline} ${offer.requiredActions.join(' ')}`;
  const dollarAmounts = parseUniqueDollarAmounts(combinedText);

  if (dollarAmounts.length < 2) return false;

  return /up to|tier|tiers|larger payout|larger payouts|top tier|bonus tier/i.test(combinedText);
}

export function getBankingRequiredDirectDepositAmount(
  offer: Pick<BankingBonusListItem, 'bonusAmount' | 'directDeposit' | 'headline' | 'requiredActions'>
) {
  if (!offer.directDeposit.required) return null;

  if (!hasAmbiguousTieredFundingRequirement(offer)) {
    return typeof offer.directDeposit.minimumAmount === 'number'
      ? offer.directDeposit.minimumAmount
      : null;
  }

  const combinedText = `${offer.headline} ${offer.requiredActions.join(' ')}`;
  const tierThresholds = parseUniqueDollarAmounts(combinedText).filter(
    (value) => value !== offer.bonusAmount
  );
  const directDepositFloor =
    typeof offer.directDeposit.minimumAmount === 'number' ? offer.directDeposit.minimumAmount : 0;
  const plausibleThresholds = tierThresholds.filter((value) => value >= directDepositFloor);

  if (plausibleThresholds.length > 0) {
    return Math.max(...plausibleThresholds);
  }

  if (typeof offer.directDeposit.minimumAmount === 'number') {
    return offer.directDeposit.minimumAmount;
  }

  return tierThresholds.length > 0 ? Math.max(...tierThresholds) : null;
}

export function getBankingRequiredFundingAmount(
  offer: Pick<
    BankingBonusListItem,
    'bonusAmount' | 'directDeposit' | 'headline' | 'minimumOpeningDeposit' | 'requiredActions'
  >
) {
  const directDepositAmount = getBankingRequiredDirectDepositAmount(offer);
  if (directDepositAmount != null) {
    return directDepositAmount;
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    return offer.minimumOpeningDeposit;
  }

  return null;
}

export function getBankingBonusRoi(
  offer: Pick<
    BankingBonusListItem,
    'bonusAmount' | 'directDeposit' | 'headline' | 'minimumOpeningDeposit' | 'requiredActions'
  >
) {
  const requiredFunding = getBankingRequiredFundingAmount(offer);
  if (requiredFunding == null) return null;

  return (offer.bonusAmount / requiredFunding) * 100;
}

export function getBankingDecisionMetrics(
  offer: Pick<
    BankingBonusListItem,
    | 'bonusAmount'
    | 'customerType'
    | 'directDeposit'
    | 'estimatedFees'
    | 'headline'
    | 'holdingPeriodDays'
    | 'minimumOpeningDeposit'
    | 'requiredActions'
  >
) {
  const activityRequirement = extractActivityRequirement(offer);
  const openingDepositLabel =
    typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
      ? formatBankingCurrency(offer.minimumOpeningDeposit)
      : 'No min';
  const directDepositMinimum = getBankingRequiredDirectDepositAmount(offer);
  const directDepositLabel = offer.directDeposit.required
    ? typeof directDepositMinimum === 'number'
      ? `${formatBankingCurrency(directDepositMinimum)}+ DD`
      : 'Direct deposit'
    : 'No DD';
  const bonusRoi = getBankingBonusRoi(offer);

  return [
    offer.customerType === 'business' && activityRequirement
      ? {
          label: 'Activity req.',
          value: activityRequirement,
          detail: 'Tracked from listed actions',
          tone: 'default' as DecisionMetricTone
        }
      : {
          label: 'Direct deposit',
          value: directDepositLabel,
          detail: offer.directDeposit.required
            ? 'Qualifying payroll or ACH'
            : 'No payroll switch needed',
          tone: 'default' as DecisionMetricTone
        },
    {
      label: 'Opening deposit',
      value: openingDepositLabel,
      detail:
        typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
          ? 'Minimum cash to start'
          : 'No opening minimum listed',
      tone: 'default' as DecisionMetricTone
    },
    {
      label: 'Hold period',
      value: formatBankingHoldPeriod(offer.holdingPeriodDays),
      detail:
        typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays > 0
          ? 'Keep open through payout'
          : 'Confirm live terms',
      tone: 'default' as DecisionMetricTone
    },
    {
      label: 'Fee',
      value: offer.estimatedFees > 0 ? `~${formatBankingCurrency(offer.estimatedFees)}` : 'No fee',
      detail:
        offer.estimatedFees > 0 ? 'Missed waivers shrink payout' : 'No recurring fee modeled',
      tone: offer.estimatedFees > 0 ? ('warning' as DecisionMetricTone) : ('default' as DecisionMetricTone)
    },
    {
      label: 'Bonus ROI',
      value:
        bonusRoi != null ? `${bonusRoi.toFixed(1)}%` : 'N/A',
      detail:
        bonusRoi != null ? 'Bonus vs required funding' : 'Needs one clear funding threshold',
      tone:
        bonusRoi == null
          ? ('default' as DecisionMetricTone)
          : bonusRoi >= 0
            ? ('positive' as DecisionMetricTone)
            : ('negative' as DecisionMetricTone)
    }
  ];
}
