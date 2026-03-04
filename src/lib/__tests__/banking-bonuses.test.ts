import { describe, expect, it } from 'vitest';
import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,
  getAllBankingBonusSlugs,
  getBankingBonusBySlug,
  getBankingBonusesData,
  getBankingOfferRequirements,
  paginateBankingBonuses
} from '../banking-bonuses';

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
      limit: 20,
      offset: 0
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((bonus) => bonus.directDeposit.required)).toBe(true);
  });

  it('keeps unrestricted offers while excluding state-restricted mismatches', async () => {
    const bonuses = await getBonuses();
    const result = filterBankingBonuses(bonuses, {
      state: 'NY',
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
