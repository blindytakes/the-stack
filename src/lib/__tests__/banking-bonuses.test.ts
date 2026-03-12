import { describe, expect, it } from 'vitest';
import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,
  getAllBankingBonusSlugs,
  getBankingBonusBySlug,
  getBankingBonusesData,
  getBankingOfferCashRequirementLevel,
  getBankingOfferChecklist,
  getBankingOfferPrimaryConstraint,
  getBankingOfferPrimaryRequirement,
  getBankingOfferDifficulty,
  getBankingOfferRequirements,
  getBankingOfferTimelineBucket,
  getBankingOfferTimeline,
  paginateBankingBonuses,
  sortBankingBonuses
} from '../banking-bonuses';
import { resolveBankingBrandImageUrl } from '../banking-brand-assets';

async function getBonuses() {
  return (await getBankingBonusesData()).bonuses;
}

describe('getBankingBonusesData', () => {
  it('returns active records from configured source', async () => {
    const { bonuses, source } = await getBankingBonusesData();
    expect(['seed', 'db']).toContain(source);
    expect(bonuses.length).toBeGreaterThan(0);
    expect(bonuses.every((bonus) => bonus.isActive)).toBe(true);
    expect(bonuses.some((bonus) => bonus.slug === 'oak-legacy-checking-300-legacy')).toBe(false);
  });

  it('sorts by estimated net value descending', async () => {
    const { bonuses } = await getBankingBonusesData();
    for (let i = 1; i < bonuses.length; i += 1) {
      expect(bonuses[i - 1].estimatedNetValue).toBeGreaterThanOrEqual(bonuses[i].estimatedNetValue);
    }
  });
});

describe('banking slug helpers', () => {
  it('returns active slugs only', async () => {
    const slugs = await getAllBankingBonusSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.includes('oak-legacy-checking-300-legacy')).toBe(false);
  });

  it('finds active offer by slug', async () => {
    const offer = await getBankingBonusBySlug('summit-national-checking-300');
    expect(offer).toBeTruthy();
    expect(offer?.bankName).toBe('Summit National Bank');
  });

  it('returns null for inactive or unknown slugs', async () => {
    expect(await getBankingBonusBySlug('oak-legacy-checking-300-legacy')).toBeNull();
    expect(await getBankingBonusBySlug('does-not-exist')).toBeNull();
  });
});

describe('bankingBonusesQuerySchema', () => {
  it('normalizes state to uppercase and applies pagination defaults', () => {
    const parsed = bankingBonusesQuerySchema.safeParse({ state: 'wa' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.state).toBe('WA');
      expect(parsed.data.sort).toBe('net');
      expect(parsed.data.limit).toBe(20);
      expect(parsed.data.offset).toBe(0);
    }
  });

  it('rejects invalid state inputs', () => {
    const parsed = bankingBonusesQuerySchema.safeParse({ state: 'washington' });
    expect(parsed.success).toBe(false);
  });
});

describe('filterBankingBonuses', () => {
  it('filters by account type', async () => {
    const bonuses = await getBonuses();
    const result = filterBankingBonuses(bonuses, {
      accountType: 'savings',
      sort: 'net',
      limit: 20,
      offset: 0
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((bonus) => bonus.accountType === 'savings')).toBe(true);
  });

  it('filters by direct deposit requirement', async () => {
    const bonuses = await getBonuses();
    const result = filterBankingBonuses(bonuses, {
      requiresDirectDeposit: 'yes',
      sort: 'net',
      limit: 20,
      offset: 0
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((bonus) => bonus.directDeposit.required)).toBe(true);
  });

  it('filters by execution difficulty, cash requirement, timeline, and state-limited status', async () => {
    const bonuses = await getBonuses();
    const lowFriction = filterBankingBonuses(bonuses, {
      difficulty: 'low',
      sort: 'net',
      limit: 20,
      offset: 0
    });
    const highCash = filterBankingBonuses(bonuses, {
      cashRequirement: 'high',
      sort: 'net',
      limit: 20,
      offset: 0
    });
    const fastTimeline = filterBankingBonuses(bonuses, {
      timeline: 'fast',
      sort: 'net',
      limit: 20,
      offset: 0
    });
    const stateLimited = filterBankingBonuses(bonuses, {
      stateLimited: 'yes',
      sort: 'net',
      limit: 20,
      offset: 0
    });

    expect(lowFriction.length).toBeGreaterThan(0);
    expect(lowFriction.every((bonus) => getBankingOfferDifficulty(bonus).level === 'low')).toBe(true);

    expect(highCash.length).toBeGreaterThan(0);
    expect(highCash.every((bonus) => getBankingOfferCashRequirementLevel(bonus) === 'high')).toBe(true);

    expect(fastTimeline.length).toBeGreaterThan(0);
    expect(fastTimeline.every((bonus) => getBankingOfferTimelineBucket(bonus) === 'fast')).toBe(true);

    expect(stateLimited.length).toBeGreaterThan(0);
    expect(stateLimited.every((bonus) => bonus.stateRestrictions && bonus.stateRestrictions.length > 0)).toBe(
      true
    );
  });

  it('keeps unrestricted offers while excluding state-restricted mismatches', async () => {
    const bonuses = await getBonuses();
    const result = filterBankingBonuses(bonuses, {
      state: 'NY',
      sort: 'net',
      limit: 20,
      offset: 0
    });

    expect(result.some((bonus) => bonus.slug === 'maple-street-checking-225')).toBe(false);
    expect(result.some((bonus) => !bonus.stateRestrictions || bonus.stateRestrictions.length === 0)).toBe(
      true
    );
  });
});

describe('paginateBankingBonuses', () => {
  it('returns a sliced segment by limit and offset', async () => {
    const bonuses = await getBonuses();
    const page = paginateBankingBonuses(bonuses, { limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
    expect(page[0].slug).toBe(bonuses[1].slug);
  });
});

describe('sortBankingBonuses', () => {
  it('orders offers by easiest execution when requested', async () => {
    const bonuses = await getBonuses();
    const sorted = sortBankingBonuses(bonuses, 'easy');

    expect(sorted.length).toBeGreaterThan(1);
    expect(getBankingOfferDifficulty(sorted[0]).level).toBe('low');
    expect(sorted[0].directDeposit.required).toBe(false);
  });

  it('orders offers by lowest cash requirement when requested', async () => {
    const bonuses = await getBonuses();
    const sorted = sortBankingBonuses(bonuses, 'low_cash');

    expect(sorted.length).toBeGreaterThan(1);
    expect((sorted[0].minimumOpeningDeposit ?? 0) <= (sorted[1].minimumOpeningDeposit ?? 0)).toBe(true);
  });
});

describe('getBankingOfferRequirements', () => {
  it('includes direct deposit and opening deposit requirements when present', async () => {
    const bonuses = await getBonuses();
    const bundle = bonuses.find((bonus) => bonus.slug === 'harbor-federal-checking-savings-500');
    expect(bundle).toBeDefined();

    if (!bundle) return;
    const requirements = getBankingOfferRequirements(bundle);

    expect(requirements.some((item) => item.includes('Qualifying direct deposit'))).toBe(true);
    expect(requirements.some((item) => item.includes('Open with at least'))).toBe(true);
  });
});

describe('compact banking card helpers', () => {
  it('reduces offers to the main unlock step', async () => {
    const bonuses = await getBonuses();
    const bundle = bonuses.find((bonus) => bonus.slug === 'harbor-federal-checking-savings-500');
    const lowFriction = bonuses.find((bonus) => bonus.slug === 'granite-state-checking-150');

    expect(bundle).toBeDefined();
    expect(lowFriction).toBeDefined();

    if (!bundle || !lowFriction) return;

    expect(getBankingOfferPrimaryRequirement(bundle)).toBe(
      'Open both accounts and route $1,500+ in payroll.'
    );
    expect(getBankingOfferPrimaryRequirement(lowFriction)).toBe(
      'Complete the required debit activity.'
    );
  });

  it('reduces offers to the main blocker', async () => {
    const bonuses = await getBonuses();
    const stateLimited = bonuses.find((bonus) => bonus.slug === 'maple-street-checking-225');
    const highDeposit = bonuses.find((bonus) => bonus.slug === 'atlas-online-savings-250');

    expect(stateLimited).toBeDefined();
    expect(highDeposit).toBeDefined();

    if (!stateLimited || !highDeposit) return;

    expect(getBankingOfferPrimaryConstraint(stateLimited)).toBe(
      'Only for CA, OR, and WA residents.'
    );
    expect(getBankingOfferPrimaryConstraint(highDeposit)).toBe('Locks up $15,000 in cash.');
  });
});

describe('derived banking presentation helpers', () => {
  it('classifies low, medium, and high friction offers from existing data', async () => {
    const bonuses = await getBonuses();
    const lowFrictionOffer = bonuses.find((bonus) => bonus.slug === 'granite-state-checking-150');
    const mediumFrictionOffer = bonuses.find((bonus) => bonus.slug === 'atlas-online-savings-250');
    const highFrictionOffer = bonuses.find((bonus) => bonus.slug === 'summit-national-checking-300');

    expect(lowFrictionOffer).toBeDefined();
    expect(mediumFrictionOffer).toBeDefined();
    expect(highFrictionOffer).toBeDefined();

    if (!lowFrictionOffer || !mediumFrictionOffer || !highFrictionOffer) return;

    expect(getBankingOfferDifficulty(lowFrictionOffer).level).toBe('low');
    expect(getBankingOfferDifficulty(mediumFrictionOffer).level).toBe('medium');
    expect(getBankingOfferDifficulty(highFrictionOffer).level).toBe('high');
  });

  it('formats short and unknown timelines cleanly', () => {
    expect(getBankingOfferTimeline({ holdingPeriodDays: 60 }).label).toBe('60 days');
    expect(getBankingOfferTimeline({ holdingPeriodDays: 120 }).label).toBe('~4 months');
    expect(getBankingOfferTimeline({ holdingPeriodDays: undefined }).label).toBe('Check live terms');
  });

  it('builds a structured checklist without duplicating direct deposit tasks', async () => {
    const bonuses = await getBonuses();
    const offer = bonuses.find((bonus) => bonus.slug === 'maple-street-checking-225');
    expect(offer).toBeDefined();

    if (!offer) return;

    const checklist = getBankingOfferChecklist(offer);

    expect(checklist).toHaveLength(4);
    expect(checklist.some((step) => step.title === 'Route qualifying direct deposit')).toBe(true);
    expect(
      checklist.filter(
        (step) =>
          step.title === 'Route qualifying direct deposit' ||
          step.detail.toLowerCase().includes('direct deposit')
      )
    ).toHaveLength(1);
  });
});

describe('banking brand asset fallbacks', () => {
  it('fills missing images for real bank names in the live dataset', () => {
    expect(resolveBankingBrandImageUrl('Chase')).toBe(
      'https://www.chase.com/etc/designs/chase-ux/favicon-152.png'
    );
    expect(resolveBankingBrandImageUrl('U.S. Bank')).toBe(
      'https://www.usbank.com/etc.clientlibs/ecm-global/clientlibs/clientlib-resources/resources/images/svg/logo-personal.svg'
    );
  });

  it('preserves explicit image URLs and leaves unknown banks unresolved', () => {
    expect(resolveBankingBrandImageUrl('Chase', 'https://assets.example.com/chase.png')).toBe(
      'https://assets.example.com/chase.png'
    );
    expect(resolveBankingBrandImageUrl('Summit National Bank')).toBeUndefined();
  });
});
