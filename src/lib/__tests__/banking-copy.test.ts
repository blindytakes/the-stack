import { describe, expect, it } from 'vitest';
import {
  formatBankingCurrency,
  getBankingOfferAvailabilityLabel,
  getBankingOfferChecklist,
  getBankingOfferExecutionSummary,
  getBankingOfferPrimaryRequirement
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

  it('avoids exposing $0 savings-funding copy when only the action text carries the requirement', () => {
    const savingsOffer = createBankingOffer({
      accountType: 'savings',
      minimumOpeningDeposit: 0,
      requiredActions: [
        'Fund the account within 30 days of opening.',
        'Maintain qualifying balances for at least 45 additional days.'
      ]
    });

    expect(getBankingOfferPrimaryRequirement(savingsOffer)).toBe(
      'Fund with qualifying new money and maintain balance.'
    );
  });

  it('merges opener-style actions into the first checklist step so the order stays sane', () => {
    const checkingOffer = createBankingOffer({
      bonusAmount: 500,
      directDeposit: { required: true, minimumAmount: 2000 },
      holdingPeriodDays: 150,
      requiredActions: [
        'Open a new eligible Bank of America Advantage Banking checking account through the bonus page.',
        'Receive at least $2,000 in qualifying direct deposits within 90 days of account opening.'
      ]
    });

    const checklist = getBankingOfferChecklist(checkingOffer);

    expect(checklist).toHaveLength(3);
    expect(checklist[0]).toMatchObject({
      timing: 'At opening',
      title: 'Open the checking account'
    });
    expect(checklist[0]?.detail).toContain('bonus page');
    expect(checklist[1]).toMatchObject({
      title: 'Route qualifying direct deposit'
    });
    expect(checklist[2]).toMatchObject({
      title: 'Keep the account open until the bonus is safe'
    });
  });
});
