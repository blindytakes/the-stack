import { describe, expect, it } from 'vitest';
import {
  formatBankingCurrency,
  getBankingOfferAvailabilityLabel,
  getBankingOfferExecutionSummary
} from '@/lib/banking/copy';
import { createBankingOffer } from '@/lib/__tests__/banking-test-helpers';

describe('banking copy helpers', () => {
  it('formats shared labels and currency without depending on the facade', () => {
    expect(formatBankingCurrency(2500)).toBe('$2,500');
    expect(getBankingOfferAvailabilityLabel(createBankingOffer())).toBe('No state restriction listed');
    expect(
      getBankingOfferAvailabilityLabel(createBankingOffer({ stateRestrictions: ['CA', 'OR', 'WA'] }))
    ).toBe('Limited to CA, OR, and WA');
  });

  it('builds execution summary copy from the underlying offer shape', () => {
    const savingsOffer = createBankingOffer({
      accountType: 'savings',
      minimumOpeningDeposit: 15000,
      holdingPeriodDays: 90,
      requiredActions: ['Deposit fresh funds']
    });

    expect(getBankingOfferExecutionSummary(savingsOffer)).toContain(
      'move at least $15,000 in fresh funds'
    );
    expect(getBankingOfferExecutionSummary(savingsOffer)).toContain('for ~3 months');
  });
});
