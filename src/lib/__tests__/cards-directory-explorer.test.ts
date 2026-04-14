import { describe, expect, it } from 'vitest';
import type { CardRecord } from '@/lib/cards';
import { filterCardsForDirectory } from '@/lib/cards-directory';
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
    imageAssetType: overrides.imageAssetType ?? 'text_fallback',
    cardType: overrides.cardType ?? 'personal',
    rewardType: overrides.rewardType ?? 'points',
    topCategories: overrides.topCategories ?? ['travel'],
    annualFee: overrides.annualFee ?? 95,
    foreignTxFee: overrides.foreignTxFee ?? 0,
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
    offsettingCreditsValue: overrides.offsettingCreditsValue,
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

  it('parses card directory params using valid issuer options and default fallbacks', () => {
    const issuerOptions = buildIssuerOptions([
      createCard({ slug: 'amex-1', issuer: 'American Express' }),
      createCard({ slug: 'chase-1', issuer: 'Chase' })
    ]);

    const filters = parseCardsDirectoryFilters(
      new URLSearchParams({
        issuer: 'American Express',
        spend: 'travel',
        intl: '0',
        reward: 'cashback',
        bonus: '750',
        fee: '95',
        type: 'business',
        sort: 'highest_bonus_roi'
      }),
      issuerOptions
    );

    expect(filters).toEqual({
      issuer: 'american-express',
      spendCategory: 'travel',
      foreignFee: '0',
      rewardType: 'cashback',
      bonusFilter: '750',
      maxFee: '95',
      cardType: 'business',
      sortBy: 'highest_bonus_roi'
    });

    expect(
      parseCardsDirectoryFilters(
        new URLSearchParams({
          issuer: 'Unknown Bank',
          spend: 'bogus',
          reward: 'bogus',
          bonus: 'bogus',
          sort: 'bogus'
        }),
        issuerOptions
      )
    ).toEqual(defaultCardsDirectoryFilters);
  });

  it('accepts everyday spend as a valid spend filter', () => {
    const issuerOptions = buildIssuerOptions([
      createCard({ slug: 'capital-one', issuer: 'Capital One' })
    ]);

    const filters = parseCardsDirectoryFilters(
      new URLSearchParams({
        spend: 'all'
      }),
      issuerOptions
    );

    expect(filters.spendCategory).toBe('all');
  });

  it('hides business cards in the default consumer view', () => {
    const cards = [
      createCard({ slug: 'personal-card', name: 'Personal Card', cardType: 'personal', bestSignUpBonusValue: 900 }),
      createCard({ slug: 'student-card', name: 'Student Card', cardType: 'student', bestSignUpBonusValue: 800 }),
      createCard({ slug: 'secured-card', name: 'Secured Card', cardType: 'secured', bestSignUpBonusValue: 700 }),
      createCard({ slug: 'business-card', name: 'Business Card', cardType: 'business', bestSignUpBonusValue: 1000 })
    ];

    const filtered = filterAndSortCards(cards, {
      ...defaultCardsDirectoryFilters,
      sortBy: 'highest_bonus'
    });

    expect(filtered.map((card) => card.slug)).toEqual([
      'personal-card',
      'student-card',
      'secured-card'
    ]);
  });

  it('filters cards and sorts by lowest annual fee', () => {
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
      issuer: 'all',
      spendCategory: 'travel',
      foreignFee: 'any',
      rewardType: 'any',
      bonusFilter: '500',
      maxFee: '95',

      cardType: 'personal',
      sortBy: 'lowest_fee'
    });

    expect(filtered.map((card) => card.slug)).toEqual(['travel-lite', 'travel-max']);
  });

  it('filters for no international fees and sorts by bonus ROI', () => {
    const cards = [
      createCard({
        slug: 'roi-best',
        issuer: 'Chase',
        annualFee: 95,
        foreignTxFee: 0,
        bestSignUpBonusValue: 900,
        bestSignUpBonusSpendRequired: 3000,
        offsettingCreditsValue: 0
      }),
      createCard({
        slug: 'roi-mid',
        issuer: 'Amex',
        annualFee: 0,
        foreignTxFee: 0,
        bestSignUpBonusValue: 1000,
        bestSignUpBonusSpendRequired: 5000,
        offsettingCreditsValue: 0
      }),
      createCard({
        slug: 'has-foreign-fee',
        issuer: 'Citi',
        annualFee: 95,
        foreignTxFee: 3,
        bestSignUpBonusValue: 1200,
        bestSignUpBonusSpendRequired: 4000,
        offsettingCreditsValue: 0
      })
    ];

    const filtered = filterAndSortCards(cards, {
      issuer: 'all',
      spendCategory: 'any',
      foreignFee: '0',
      rewardType: 'any',
      bonusFilter: 'any',
      maxFee: 'any',
      cardType: 'all',
      sortBy: 'highest_bonus_roi'
    });

    expect(filtered.map((card) => card.slug)).toEqual(['roi-best', 'roi-mid']);
  });

  it('filters for cashback cards only', () => {
    const cards = [
      createCard({ slug: 'cashback-card', rewardType: 'cashback' }),
      createCard({ slug: 'miles-card', rewardType: 'miles' }),
      createCard({ slug: 'points-card', rewardType: 'points' })
    ];

    const filtered = filterAndSortCards(cards, {
      issuer: 'all',
      spendCategory: 'any',
      foreignFee: 'any',
      rewardType: 'cashback',
      bonusFilter: 'any',
      maxFee: 'any',
      cardType: 'all',
      sortBy: 'highest_bonus'
    });

    expect(filtered.map((card) => card.slug)).toEqual(['cashback-card']);
  });

  it('filters for everyday spend cards only', () => {
    const cards = [
      createCard({ slug: 'everyday-flat-rate', topCategories: ['all'] }),
      createCard({ slug: 'travel-card', topCategories: ['travel'] }),
      createCard({ slug: 'dining-card', topCategories: ['dining'] })
    ];

    const filtered = filterAndSortCards(cards, {
      issuer: 'all',
      spendCategory: 'all',
      foreignFee: 'any',
      rewardType: 'any',
      bonusFilter: 'any',
      maxFee: 'any',
      cardType: 'all',
      sortBy: 'highest_bonus'
    });

    expect(filtered.map((card) => card.slug)).toEqual(['everyday-flat-rate']);
  });

  it('keeps business cards in the main directory dataset when the issuer is supported', () => {
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
        slug: 'student-start',
        name: 'Student Start',
        issuer: 'Discover',
        headline: 'Starter card',
        annualFee: 0,
        bestSignUpBonusValue: 200,
        creditTierMin: 'fair',
        cardType: 'student'
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
      }),
      createCard({
        slug: 'unsupported-business',
        name: 'Unsupported Business',
        issuer: 'Unknown Bank',
        headline: 'Should stay excluded by issuer gate',
        annualFee: 0,
        bestSignUpBonusValue: 400,
        creditTierMin: 'good',
        cardType: 'business'
      })
    ];

    const filtered = filterCardsForDirectory(cards);

    expect(filtered.map((card) => card.slug)).toEqual([
      'travel-max',
      'student-start',
      'business-cash'
    ]);
  });

  it('builds query params from non-default filters and counts active filters', () => {
    const filters = {
      issuer: 'chase',
      spendCategory: 'travel' as const,
      foreignFee: '0' as const,
      rewardType: 'cashback' as const,
      bonusFilter: '750' as const,
      maxFee: '95' as const,
      cardType: 'business' as const,
      sortBy: 'highest_bonus_roi' as const
    };

    expect(buildCardsDirectorySearchParams(new URLSearchParams(), filters).toString()).toBe(
      'issuer=chase&spend=travel&intl=0&reward=cashback&bonus=750&fee=95&type=business&sort=highest_bonus_roi'
    );
    expect(countActiveCardsDirectoryFilters(filters)).toBe(7);
  });

  it('builds compare links only when exactly two cards are selected', () => {
    expect(buildCardsDirectoryCompareHref(['a'])).toBeNull();
    expect(buildCardsDirectoryCompareHref(['a', 'b'])).toBe(
      '/cards/compare?a=a&b=b&src=cards_directory'
    );
  });
});
