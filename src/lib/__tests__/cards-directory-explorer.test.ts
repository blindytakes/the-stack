import { describe, expect, it } from 'vitest';
import type { CardRecord } from '@/lib/cards';
import {
  buildCardsDirectoryCompareHref,
  buildCardsDirectorySearchParams,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  filterAndSortCards,
  parseCardsDirectoryFilters
} from '@/lib/cards-directory-explorer';

function createCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    slug: overrides.slug ?? 'sample-card',
    name: overrides.name ?? 'Sample Card',
    issuer: overrides.issuer ?? 'Chase',
    cardType: overrides.cardType ?? 'personal',
    rewardType: overrides.rewardType ?? 'points',
    topCategories: overrides.topCategories ?? ['travel'],
    annualFee: overrides.annualFee ?? 95,
    creditTierMin: overrides.creditTierMin ?? 'good',
    headline: overrides.headline ?? 'Strong travel value',
    description: overrides.description,
    longDescription: overrides.longDescription,
    editorRating: overrides.editorRating ?? 4.4,
    pros: overrides.pros,
    cons: overrides.cons,
    bestSignUpBonusValue: overrides.bestSignUpBonusValue ?? 750,
    bestSignUpBonusSpendRequired: overrides.bestSignUpBonusSpendRequired,
    bestSignUpBonusSpendPeriodDays: overrides.bestSignUpBonusSpendPeriodDays,
    totalBenefitsValue: overrides.totalBenefitsValue ?? 0,
    plannerBenefitsValue: overrides.plannerBenefitsValue ?? 0
  };
}

describe('cards-directory-explorer', () => {
  it('builds issuer options with counts and normalized sorting', () => {
    const cards = [
      createCard({ slug: 'amex-1', issuer: 'American   Express' }),
      createCard({ slug: 'chase-1', issuer: 'Chase' }),
      createCard({ slug: 'amex-2', issuer: 'American Express' })
    ];

    expect(buildIssuerOptions(cards)).toEqual([
      { value: 'american-express', label: 'American Express', count: 2 },
      { value: 'chase', label: 'Chase', count: 1 }
    ]);
  });

  it('parses query params using valid issuer options and default fallbacks', () => {
    const issuerOptions = buildIssuerOptions([
      createCard({ slug: 'amex-1', issuer: 'American Express' }),
      createCard({ slug: 'chase-1', issuer: 'Chase' })
    ]);

    const filters = parseCardsDirectoryFilters(
      new URLSearchParams({
        q: ' travel ',
        issuer: 'American Express',
        bonus: '750',
        fee: '95',
        credit: 'good',
        type: 'personal',
        sort: 'bonus_minus_fee'
      }),
      issuerOptions
    );

    expect(filters).toEqual({
      query: ' travel ',
      issuer: 'american-express',
      bonusFilter: '750',
      maxFee: '95',
      creditProfile: 'good',
      cardType: 'personal',
      sortBy: 'bonus_minus_fee'
    });

    expect(
      parseCardsDirectoryFilters(
        new URLSearchParams({ issuer: 'Unknown Bank', bonus: 'bogus', sort: 'bogus' }),
        issuerOptions
      )
    ).toEqual(defaultCardsDirectoryFilters);
  });

  it('filters cards and sorts by bonus net of fee', () => {
    const cards = [
      createCard({
        slug: 'travel-max',
        name: 'Travel Max',
        issuer: 'Chase',
        headline: 'Travel points powerhouse',
        annualFee: 95,
        bestSignUpBonusValue: 900,
        creditTierMin: 'good',
        cardType: 'personal'
      }),
      createCard({
        slug: 'travel-lite',
        name: 'Travel Lite',
        issuer: 'Chase',
        headline: 'Travel starter card',
        annualFee: 0,
        bestSignUpBonusValue: 600,
        creditTierMin: 'good',
        cardType: 'personal'
      }),
      createCard({
        slug: 'elite-travel',
        name: 'Elite Travel',
        issuer: 'American Express',
        headline: 'Luxury travel perks',
        annualFee: 250,
        bestSignUpBonusValue: 1200,
        creditTierMin: 'excellent',
        cardType: 'personal'
      }),
      createCard({
        slug: 'business-cash',
        name: 'Business Cash',
        issuer: 'Chase',
        headline: 'Business spend card',
        annualFee: 0,
        bestSignUpBonusValue: 800,
        creditTierMin: 'good',
        cardType: 'business'
      })
    ];

    const filtered = filterAndSortCards(cards, {
      query: 'travel',
      issuer: 'all',
      bonusFilter: '500',
      maxFee: '95',
      creditProfile: 'good',
      cardType: 'personal',
      sortBy: 'bonus_minus_fee'
    });

    expect(filtered.map((card) => card.slug)).toEqual(['travel-max', 'travel-lite']);
  });

  it('builds query params from non-default filters and counts active filters', () => {
    const filters = {
      query: '  chase sapphire  ',
      issuer: 'chase',
      bonusFilter: '750' as const,
      maxFee: '95' as const,
      creditProfile: 'good' as const,
      cardType: 'personal' as const,
      sortBy: 'bonus_minus_fee' as const
    };

    expect(buildCardsDirectorySearchParams(new URLSearchParams(), filters).toString()).toBe(
      'q=chase+sapphire&issuer=chase&bonus=750&fee=95&credit=good&type=personal&sort=bonus_minus_fee'
    );
    expect(countActiveCardsDirectoryFilters(filters)).toBe(6);
  });

  it('builds compare links only when exactly two cards are selected', () => {
    expect(buildCardsDirectoryCompareHref(['a'])).toBeNull();
    expect(buildCardsDirectoryCompareHref(['a', 'b'])).toBe(
      '/tools/card-vs-card?a=a&b=b&src=cards_directory'
    );
  });
});
