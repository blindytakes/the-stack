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

export function getAnnualizedBankingRoi(
  offer: Pick<
    BankingBonusListItem,
    'estimatedNetValue' | 'minimumOpeningDeposit' | 'holdingPeriodDays'
  >
) {
  if (
    typeof offer.minimumOpeningDeposit !== 'number' ||
    offer.minimumOpeningDeposit <= 0 ||
    typeof offer.holdingPeriodDays !== 'number' ||
    offer.holdingPeriodDays <= 0
  ) {
    return null;
  }

  return (
    (offer.estimatedNetValue / offer.minimumOpeningDeposit) * (365 / offer.holdingPeriodDays) * 100
  );
}

export function getBankingDecisionMetrics(
  offer: Pick<
    BankingBonusListItem,
    | 'customerType'
    | 'directDeposit'
    | 'estimatedFees'
    | 'estimatedNetValue'
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
  const directDepositLabel = offer.directDeposit.required
    ? typeof offer.directDeposit.minimumAmount === 'number'
      ? `${formatBankingCurrency(offer.directDeposit.minimumAmount)}+ DD`
      : 'Direct deposit'
    : 'No DD';
  const annualizedRoi = getAnnualizedBankingRoi(offer);

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
      label: 'ROI',
      value:
        annualizedRoi != null
          ? `${annualizedRoi.toFixed(1)}%`
          : typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
            ? 'Check terms'
            : 'No cash hurdle',
      detail:
        annualizedRoi != null
          ? 'Annualized on required cash'
          : typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
            ? 'Needs full cash-lock timing'
            : 'Behavior-based bonus path',
      tone:
        annualizedRoi == null
          ? ('default' as DecisionMetricTone)
          : annualizedRoi >= 0
            ? ('positive' as DecisionMetricTone)
            : ('negative' as DecisionMetricTone)
    }
  ];
}
