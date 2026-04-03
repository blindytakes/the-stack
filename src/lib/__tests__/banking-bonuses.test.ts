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
import { createBankingListItem } from './banking-test-helpers';
import { resolveBankingBrandImageUrl } from '../banking-brand-assets';
import { resolveBankingOfferUrl } from '../banking/repository';

async function getBonuses() {
  return (await getBankingBonusesData()).bonuses;
}

describe('getBankingBonusesData', () => {
  it('returns active records from configured source', async () => {
    const { bonuses, source } = await getBankingBonusesData();
    expect(['seed', 'db']).toContain(source);
    expect(bonuses.length).toBeGreaterThan(0);
    expect(bonuses.every((bonus) => bonus.isActive)).toBe(true);
    expect(
      bonuses.every((bonus) => !bonus.expiresAt || new Date(bonus.expiresAt).getTime() >= Date.now())
    ).toBe(true);
    expect(bonuses.some((bonus) => bonus.slug === 'oak-legacy-checking-300-legacy')).toBe(false);
  });

  it('sorts by bonus amount descending', async () => {
    const { bonuses } = await getBankingBonusesData();
    for (let i = 1; i < bonuses.length; i += 1) {
      expect(bonuses[i - 1].bonusAmount).toBeGreaterThanOrEqual(bonuses[i].bonusAmount);
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
    const parsed = bankingBonusesQuerySchema.safeParse({ state: 'wa', apy: '3_plus' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.state).toBe('WA');
      expect(parsed.data.apy).toBe('3_plus');
      expect(parsed.data.sort).toBe('bonus');
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

  it('filters by customer type', () => {
    const bonuses = [
      createBankingListItem({ slug: 'personal-offer', customerType: 'personal' }),
      createBankingListItem({ slug: 'business-offer', customerType: 'business' })
    ];

    const result = filterBankingBonuses(bonuses, {
      customerType: 'business',
      sort: 'net',
      limit: 20,
      offset: 0
    });

    expect(result.map((bonus) => bonus.slug)).toEqual(['business-offer']);
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

  it('filters by APY threshold when APY data is present', () => {
    const bonuses = [
      createBankingListItem({ slug: 'high-apy', apyPercent: 3.65, apyDisplay: '3.65% APY' }),
      createBankingListItem({ slug: 'low-apy', apyPercent: 0.05, apyDisplay: '0.05% APY' }),
      createBankingListItem({ slug: 'no-apy' })
    ];

    const result = filterBankingBonuses(bonuses, {
      apy: '3_plus',
      sort: 'net',
      limit: 20,
      offset: 0
    });

    expect(result.map((bonus) => bonus.slug)).toEqual(['high-apy']);
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
  it('orders offers by raw bonus amount when using the visible bonus sort', () => {
    const sorted = sortBankingBonuses([
      createBankingListItem({
        slug: 'higher-bonus-higher-fee',
        bonusAmount: 300,
        estimatedFees: 35,
        estimatedNetValue: 265
      }),
      createBankingListItem({
        slug: 'lower-bonus-lower-fee',
        bonusAmount: 290,
        estimatedFees: 0,
        estimatedNetValue: 290
      })
    ]);

    expect(sorted.map((bonus) => bonus.slug)).toEqual([
      'higher-bonus-higher-fee',
      'lower-bonus-lower-fee'
    ]);
  });

  it('keeps the legacy net sort alias aligned to raw bonus amount ordering', () => {
    const sorted = sortBankingBonuses(
      [
        createBankingListItem({
          slug: 'higher-bonus-higher-fee',
          bonusAmount: 300,
          estimatedFees: 35,
          estimatedNetValue: 265
        }),
        createBankingListItem({
          slug: 'lower-bonus-lower-fee',
          bonusAmount: 290,
          estimatedFees: 0,
          estimatedNetValue: 290
        })
      ],
      'net'
    );

    expect(sorted.map((bonus) => bonus.slug)).toEqual([
      'higher-bonus-higher-fee',
      'lower-bonus-lower-fee'
    ]);
  });

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
      'Open both accounts and route $1,500+ in qualifying direct deposit.'
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
    expect(resolveBankingBrandImageUrl('BMO')).toBe(
      'https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg'
    );
    expect(resolveBankingBrandImageUrl('Capital One')).toBe('/bank-logos/capital-one.svg');
    expect(resolveBankingBrandImageUrl('Chase')).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
    expect(resolveBankingBrandImageUrl('Bank of America')).toBe(
      'https://www1.bac-assets.com/homepage/spa-assets/images/assets-images-global-logos-bac-logo-v2-CSX3648cbbb.svg'
    );
    expect(resolveBankingBrandImageUrl('E*TRADE from Morgan Stanley Private Bank')).toBe(
      'https://cdn2.etrade.net/1/26022716140.0/aempros/content/dam/etrade/retail/en_US/images/global/logos/etrade-from-morgan-stanley-logo-dark-theme.svg'
    );
    expect(resolveBankingBrandImageUrl('Huntington Bank')).toBe(
      'https://www.huntington.com/-/media/Project/huntington/hcom/logo.svg?h=34&hash=C30EA1B787772E50AB6A58FFB6AB51F3&iar=0&rev=4e84f6b1d5ba431f90d0f8adb3200280&w=231'
    );
    expect(resolveBankingBrandImageUrl('KeyBank')).toBe(
      'https://www.key.com/content/experience-fragments/kco/system/navigation/headers/key-at-work/master/_jcr_content/header/logo.coreimg.svg/1733170379196/kb-logo.svg'
    );
    expect(resolveBankingBrandImageUrl('Marcus by Goldman Sachs')).toBe(
      'https://www.goldmansachs.com/images/migrated/our-firm/history/moments/150th-multimedia/2016-marcus/marcus.png'
    );
    expect(resolveBankingBrandImageUrl('U.S. Bank')).toBe('/bank-logos/us-bank.svg');
  });

  it('preserves explicit image URLs and leaves unknown banks unresolved', () => {
    expect(resolveBankingBrandImageUrl('Chase', 'https://assets.example.com/chase.png')).toBe(
      'https://assets.example.com/chase.png'
    );
    expect(resolveBankingBrandImageUrl('Summit National Bank')).toBeUndefined();
  });

  it('replaces the known-bad KeyBank favicon with a curated brand asset', () => {
    expect(
      resolveBankingBrandImageUrl(
        'KeyBank',
        'https://www.key.com/etc.clientlibs/keybank-foundation/clientlibs/clientlib-base/resources/icons/favicon.ico'
      )
    ).toBe(
      'https://www.key.com/content/experience-fragments/kco/system/navigation/headers/key-at-work/master/_jcr_content/header/logo.coreimg.svg/1733170379196/kb-logo.svg'
    );
  });

  it('replaces low-fidelity banking icons with curated brand assets when available', () => {
    expect(
      resolveBankingBrandImageUrl('BMO', 'https://www.bmo.com/dist/favicon/apple-touch-icon.png')
    ).toBe('https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg');
    expect(
      resolveBankingBrandImageUrl(
        'Capital One',
        'https://www.capitalone.com/assets/shell/apple-touch-icon.png'
      )
    ).toBe('/bank-logos/capital-one.svg');
    expect(
      resolveBankingBrandImageUrl(
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
    expect(
      resolveBankingBrandImageUrl(
        'Citibank',
        'https://www.citi.com/cbol-hp-static-assets/assets/favicon.ico'
      )
    ).toBe('/bank-logos/citi.svg');
    expect(
      resolveBankingBrandImageUrl(
        'E*TRADE from Morgan Stanley Private Bank',
        'https://cdn2.etrade.net/1/21123117210.0/aempros/content/dam/etrade/global/pagemeta/images/apple-touch-icon.png'
      )
    ).toBe(
      'https://cdn2.etrade.net/1/26022716140.0/aempros/content/dam/etrade/retail/en_US/images/global/logos/etrade-from-morgan-stanley-logo-dark-theme.svg'
    );
    expect(
      resolveBankingBrandImageUrl(
        'Huntington Bank',
        'https://www.huntington.com/Presentation/images/apple-touch-icon-180.png'
      )
    ).toBe(
      'https://www.huntington.com/-/media/Project/huntington/hcom/logo.svg?h=34&hash=C30EA1B787772E50AB6A58FFB6AB51F3&iar=0&rev=4e84f6b1d5ba431f90d0f8adb3200280&w=231'
    );
    expect(
      resolveBankingBrandImageUrl(
        'Marcus by Goldman Sachs',
        'https://cdn.gs.com/images/goldman-sachs/v1/gs-favicon.ico'
      )
    ).toBe(
      'https://www.goldmansachs.com/images/migrated/our-firm/history/moments/150th-multimedia/2016-marcus/marcus.png'
    );
    expect(
      resolveBankingBrandImageUrl(
        'PNC',
        'https://www.pnc.com/etc.clientlibs/pnc-aem-base/clientlibs/clientlib-site/resources/apple-touch-icon.png'
      )
    ).toBe('https://www.pnc.com/content/dam/pnc-com/images/universal/pnc-logos/pnc_logo_rev.svg');
    expect(
      resolveBankingBrandImageUrl(
        'TD Bank',
        'https://www.td.com/etc.clientlibs/tdsite/clientlibs/clientlib-wealth/resources/images/favicon.ico'
      )
    ).toBe('https://www.td.com/content/dam/tdb/images/navigation-header-and-footer/td-logo-desktop.png');
    expect(
      resolveBankingBrandImageUrl(
        'Wells Fargo',
        'https://www17.wellsfargomedia.com/assets/images/icons/apple-touch-icon_120x120.png'
      )
    ).toBe('https://www17.wellsfargomedia.com/assets/images/icons/apple-touch-icon_120x120.png');
  });

  it('replaces broken Chime favicon data and upgrades Alliant to a real logo', () => {
    expect(
      resolveBankingBrandImageUrl('Chime', 'https://www.chime.com/img/favicon.png')
    ).toBe(
      'https://chime-mobile-assets.prod-ext.chmfin.com/prod/images/ck.logo.chime.chime_green.medium.registered.dark%403x.png'
    );
    expect(
      resolveBankingBrandImageUrl(
        'Alliant Credit Union',
        'https://www.alliantcreditunion.org/resources/favicon.ico'
      )
    ).toBe('https://www.alliantcreditunion.org/assets/dist/images/logo.png');
    expect(resolveBankingBrandImageUrl('Chime')).toBe(
      'https://chime-mobile-assets.prod-ext.chmfin.com/prod/images/ck.logo.chime.chime_green.medium.registered.dark%403x.png'
    );
    expect(resolveBankingBrandImageUrl('Alliant Credit Union')).toBe(
      'https://www.alliantcreditunion.org/assets/dist/images/logo.png'
    );
  });
});

describe('banking offer URL curation', () => {
  it('upgrades the known broken Alliant promo root URL to the live offer page', () => {
    expect(
      resolveBankingOfferUrl(
        'alliant-ultimate-opportunity-savings-100',
        'https://promo.alliantcreditunion.org'
      )
    ).toBe('https://promo.alliantcreditunion.org/ultimate-opportunity-savings');
  });
});
