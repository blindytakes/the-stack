import { describe, expect, it } from 'vitest';
import { normalizePlannerContext } from '@/lib/planner/normalize-context';

describe('normalizePlannerContext', () => {
  it('normalizes full planner answers without fabricating issuer-specific eligibility', () => {
    const context = normalizePlannerContext({
      mode: 'full',
      answers: {
        audience: 'consumer',
        monthlySpend: 'from_2500_to_5000',
        state: 'ny',
        ownedCardSlugs: ['chase-sapphire-preferred'],
        ownedBankNames: ['Chase']
      }
    });

    expect(context).toEqual({
      mode: 'full',
      audience: 'consumer',
      monthlySpend: 'from_2500_to_5000',
      directDeposit: 'yes',
      state: 'NY',
      ownedCardSlugs: ['chase-sapphire-preferred'],
      availableCash: 'from_2501_to_9999',
      ownedBankNames: ['Chase'],
      amexLifetimeBlockedSlugs: [],
      chase524Status: 'not_sure'
    });
  });

  it('assumes direct deposit availability for full planner answers', () => {
    const context = normalizePlannerContext({
      mode: 'full',
      answers: {
        audience: 'consumer',
        monthlySpend: 'from_2500_to_5000',
        state: 'ny',
        ownedCardSlugs: [],
        ownedBankNames: []
      }
    });

    if (context.mode !== 'full') {
      throw new Error('Expected a full planner context');
    }

    expect(context.directDeposit).toBe('yes');
  });

  it('derives Chase 5/24 status for cards-only answers and keeps override-only Amex history separate', () => {
    const context = normalizePlannerContext({
      mode: 'cards_only',
      answers: {
        audience: 'consumer',
        monthlySpend: 'lt_2500',
        spend: 'dining',
        credit: 'good',
        recentCardOpenings24Months: 'five_or_more',
        ownedCardSlugs: []
      },
      overrides: {
        amexLifetimeBlockedSlugs: ['amex-gold-card']
      }
    });

    expect(context).toEqual({
      mode: 'cards_only',
      audience: 'consumer',
      monthlySpend: 'lt_2500',
      spend: 'dining',
      credit: 'good',
      ownedCardSlugs: [],
      amexLifetimeBlockedSlugs: ['amex-gold-card'],
      chase524Status: 'at_or_over_5_24'
    });
  });

  it('prefers explicit override Chase status over derived openings data', () => {
    const context = normalizePlannerContext({
      mode: 'cards_only',
      answers: {
        audience: 'consumer',
        monthlySpend: 'from_2500_to_5000',
        spend: 'travel',
        credit: 'good',
        recentCardOpenings24Months: 'five_or_more',
        ownedCardSlugs: []
      },
      overrides: {
        chase524Status: 'under_5_24'
      }
    });

    expect(context.chase524Status).toBe('under_5_24');
  });

  it('throws when required mode-specific fields are missing', () => {
    expect(() =>
      normalizePlannerContext({
        mode: 'full',
        answers: {
          audience: 'consumer',
          spend: 'travel',
          credit: 'excellent',
          monthlySpend: 'from_2500_to_5000',
          ownedCardSlugs: []
        }
      })
    ).toThrow();
  });
});
