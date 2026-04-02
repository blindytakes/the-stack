import { describe, expect, it } from 'vitest';
import {
  getBankingBonusRoi,
  getBankingDecisionMetrics,
  getBankingRequiredDirectDepositAmount,
  getBankingRequiredFundingAmount,
  hasAmbiguousTieredFundingRequirement
} from '../banking/presentation-metrics';
import { createBankingListItem } from './banking-test-helpers';

describe('banking presentation metrics', () => {
  it('calculates required funding from the direct-deposit minimum when no opening deposit is listed', () => {
    const offer = createBankingListItem({
      bonusAmount: 400,
      minimumOpeningDeposit: undefined,
      directDeposit: { required: true, minimumAmount: 2000 }
    });

    expect(getBankingRequiredFundingAmount(offer)).toBe(2000);
  });

  it('prioritizes the direct-deposit minimum when both direct deposit and opening deposit are listed', () => {
    const offer = createBankingListItem({
      bonusAmount: 500,
      minimumOpeningDeposit: 50,
      directDeposit: { required: true, minimumAmount: 5000 }
    });

    expect(getBankingRequiredFundingAmount(offer)).toBe(5000);
  });

  it('infers the matching direct-deposit threshold for tiered up-to offers', () => {
    const offer = createBankingListItem({
      bonusAmount: 400,
      headline: 'Earn up to $400 with qualifying direct deposits after opening a new Virtual Wallet account.',
      minimumOpeningDeposit: undefined,
      directDeposit: { required: true, minimumAmount: 500 },
      requiredActions: [
        'Receive qualifying direct deposits within 60 days ($500+ for Virtual Wallet, $5,000+ for Virtual Wallet with Performance Select).'
      ]
    });

    expect(hasAmbiguousTieredFundingRequirement(offer)).toBe(true);
    expect(getBankingRequiredDirectDepositAmount(offer)).toBe(5000);
    expect(getBankingRequiredFundingAmount(offer)).toBe(5000);
    expect(getBankingBonusRoi(offer)).toBe(8);
  });

  it('calculates bonus ROI from total required funding', () => {
    const offer = createBankingListItem({
      bonusAmount: 400,
      estimatedNetValue: 250,
      minimumOpeningDeposit: undefined,
      directDeposit: { required: true, minimumAmount: 2000 }
    });

    expect(getBankingBonusRoi(offer)).toBe(20);
  });

  it('returns null when no deposit or direct-deposit threshold is listed', () => {
    const offer = createBankingListItem({
      bonusAmount: 300,
      minimumOpeningDeposit: undefined,
      directDeposit: { required: false }
    });

    expect(getBankingBonusRoi(offer)).toBeNull();
  });

  it('surfaces the banking ROI metric as bonus ROI', () => {
    const offer = createBankingListItem({
      bonusAmount: 400,
      estimatedNetValue: 250,
      minimumOpeningDeposit: undefined,
      directDeposit: { required: true, minimumAmount: 2000 }
    });

    const metric = getBankingDecisionMetrics(offer).find((item) => item.label === 'Bonus ROI');

    expect(metric).toMatchObject({
      label: 'Bonus ROI',
      value: '20.0%',
      detail: 'Bonus vs required funding'
    });
  });

  it('shows the inferred direct-deposit threshold in decision metrics for tiered offers', () => {
    const offer = createBankingListItem({
      bonusAmount: 400,
      headline: 'Earn up to $400 with qualifying direct deposits after opening a new Virtual Wallet account.',
      minimumOpeningDeposit: undefined,
      directDeposit: { required: true, minimumAmount: 500 },
      requiredActions: [
        'Receive qualifying direct deposits within 60 days ($500+ for Virtual Wallet, $5,000+ for Virtual Wallet with Performance Select).'
      ]
    });

    const metric = getBankingDecisionMetrics(offer).find((item) => item.label === 'Direct deposit');

    expect(metric).toMatchObject({
      label: 'Direct deposit',
      value: '$5,000+ DD'
    });
  });
});
