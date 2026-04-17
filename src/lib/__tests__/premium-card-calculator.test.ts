import { describe, expect, it } from 'vitest';
import {
  buildInitialPremiumCardScenario,
  calculatePremiumCardScenario,
  premiumCardProfileById
} from '@/lib/premium-card-calculator';

describe('premium card calculator', () => {
  it('exposes modeled offer presets for both flagship and lower-fee travel cards', () => {
    expect(premiumCardProfileById['capital-one-venture'].welcomeOffer.offerPresets).toStrictEqual([75000]);
    expect(premiumCardProfileById['amex-gold'].welcomeOffer.offerPresets).toStrictEqual([60000, 75000]);
    expect(premiumCardProfileById['amex-green'].welcomeOffer.offerPresets).toStrictEqual([40000]);
    expect(premiumCardProfileById['chase-sapphire-preferred'].welcomeOffer.offerPresets).toStrictEqual([75000]);
    expect(premiumCardProfileById['citi-strata-elite'].welcomeOffer.offerPresets).toStrictEqual([80000]);
    expect(premiumCardProfileById['chase-sapphire-reserve'].welcomeOffer.offerPresets).toStrictEqual([
      75000,
      100000,
      125000
    ]);
    expect(premiumCardProfileById['capital-one-venture-x'].welcomeOffer.offerPresets).toStrictEqual([
      75000,
      100000,
      125000,
      150000
    ]);
  });

  it('starts from live annual fees while keeping user-entered values zeroed', () => {
    for (const profile of Object.values(premiumCardProfileById)) {
      const scenario = buildInitialPremiumCardScenario(profile);

      expect(scenario.offerPoints).toBe(0);
      expect(scenario.annualFee).toBe(profile.annualFee);
      expect(Object.values(scenario.spend).every((value) => value === 0)).toBe(true);
      expect(Object.values(scenario.credits).every((value) => value === 0)).toBe(true);
      expect(Object.values(scenario.benefits).every((value) => value === 0)).toBe(true);
      expect(scenario.firstYearExtraValue).toBe(0);
      expect(scenario.renewalOnlyValue).toBe(0);
    }
  });

  it('uses the updated Amex Platinum credit and perk set from feedback', () => {
    const profile = premiumCardProfileById['amex-platinum'];

    expect(profile.credits.some((credit) => credit.id === 'saks-credit')).toBe(false);
    expect(profile.credits.find((credit) => credit.id === 'hotel-credit')?.note).toBe(
      '$600 annual value, issued as up to $300 semi-annually on prepaid FHR / Hotel Collection stays'
    );
    expect(
      profile.credits.find((credit) => credit.id === 'digital-entertainment-credit')?.note
    ).toBe('$300 annual value, issued as up to $25 per month');
    expect(profile.benefits.find((benefit) => benefit.id === 'priority-pass')?.description).toBe(
      'Membership for participating non-Amex lounges worldwide.'
    );
    expect(profile.benefits.find((benefit) => benefit.id === 'fine-hotels-resorts')?.note).toBe(
      'Separate from the prepaid hotel credit in hard-value credits.'
    );
    expect(
      profile.benefits.some((benefit) => benefit.id === 'purchase-and-return-protections')
    ).toBe(true);
    expect(profile.benefits.some((benefit) => benefit.id === 'no-foreign-transaction-fees')).toBe(
      true
    );
    expect(profile.benefits.some((benefit) => benefit.id === 'global-entry-tsa-precheck')).toBe(
      true
    );
  });

  it('updates Venture X with clarified credits, additional soft perks, and built-in anniversary miles', () => {
    const profile = premiumCardProfileById['capital-one-venture-x'];

    expect(profile.spendCategories.some((category) => category.id === 'travel-outside-portal')).toBe(
      false
    );
    expect(profile.annualPointsBonus).toStrictEqual({
      label: '10,000 anniversary miles',
      note: 'Built into renewal math starting after the first account anniversary.',
      fixedPoints: 10000
    });
    expect(profile.credits.find((credit) => credit.id === 'lifestyle-collection-credit')?.description).toContain(
      'Capital One Travel'
    );
    expect(profile.credits.find((credit) => credit.id === 'premier-collection-credit')?.description).toContain(
      'minimum stay'
    );
    expect(profile.benefits.some((benefit) => benefit.id === 'anniversary-miles')).toBe(false);
    expect(profile.benefits.find((benefit) => benefit.id === 'cell-phone-protection')?.description).toContain(
      'monthly wireless bill'
    );
    expect(
      profile.benefits.find((benefit) => benefit.id === 'no-foreign-transaction-fees')?.description
    ).toContain('No issuer foreign transaction fee');
    expect(profile.benefits.find((benefit) => benefit.id === 'prior-subscription')?.label).toBe(
      'Complimentary PRIOR subscription'
    );
    expect(profile.benefits.find((benefit) => benefit.id === 'cultivist-membership')?.label).toBe(
      'Discounted The Cultivist membership'
    );
  });

  it('removes the welcome offer when the user is not eligible', () => {
    const profile = premiumCardProfileById['capital-one-venture-x'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 75000;
    scenario.annualFee = profile.annualFee;
    scenario.eligibleForBonus = false;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.welcomeOfferPoints).toBe(0);
    expect(result.totalPointsYear1).toBe(result.spendPoints);
    expect(result.totalPointsYear2).toBe(result.spendPoints + 10000);
    expect(result.pointsValueYear2 - result.pointsValueYear1).toBe(180);
  });

  it('adds Venture X anniversary miles in renewal math instead of keeping them as a manual soft perk', () => {
    const profile = premiumCardProfileById['capital-one-venture-x'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 75000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['capital-one-hotels-rental-cars'] = 1000;
    scenario.spend['capital-one-flights-vacation-rentals'] = 500;
    scenario.spend['all-other-purchases'] = 2000;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(16500);
    expect(result.annualBonusPointsYear1).toBe(0);
    expect(result.annualBonusPointsYear2).toBe(10000);
    expect(result.totalPointsYear1).toBe(91500);
    expect(result.totalPointsYear2).toBe(26500);
  });

  it('keeps year-one and renewal adjustments separate', () => {
    const profile = premiumCardProfileById['chase-sapphire-reserve'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 125000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['chase-travel'] = 1000;
    scenario.spend['direct-flights'] = 2000;
    scenario.spend.dining = 3000;
    scenario.credits['annual-travel-credit'] = 300;
    scenario.firstYearExtraValue = 450;
    scenario.renewalOnlyValue = 275;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.expectedValueYear1 - result.expectedValueYear2).toBe(
      result.pointsValueYear1 - result.pointsValueYear2 + 175
    );
  });

  it('calculates Amex Gold using dining, supermarket, and credit inputs without adding renewal bonus points', () => {
    const profile = premiumCardProfileById['amex-gold'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 60000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['restaurants-worldwide'] = 4000;
    scenario.spend['us-supermarkets'] = 3000;
    scenario.spend['flights-direct-or-amex-travel'] = 1000;
    scenario.spend['amex-travel-prepaid-hotels-and-travel'] = 500;
    scenario.credits['resy-credit'] = 80;
    scenario.credits['dunkin-credit'] = 60;
    scenario.credits['dining-credit'] = 90;
    scenario.credits['uber-cash'] = 100;
    scenario.benefits['transfer-flexibility'] = 120;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(32000);
    expect(result.annualBonusPointsYear1).toBe(0);
    expect(result.annualBonusPointsYear2).toBe(0);
    expect(result.recurringCreditsValue).toBe(330);
    expect(result.benefitsValue).toBe(120);
    expect(result.totalPointsYear1).toBe(92000);
  });

  it('calculates Amex Green using travel, transit, and CLEAR inputs', () => {
    const profile = premiumCardProfileById['amex-green'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 40000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['restaurants-worldwide'] = 3000;
    scenario.spend.travel = 1500;
    scenario.spend['transit-worldwide'] = 2000;
    scenario.spend['all-other-purchases'] = 800;
    scenario.credits['clear-credit'] = 150;
    scenario.benefits['transfer-flexibility'] = 120;
    scenario.benefits['trip-delay-insurance'] = 40;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(20300);
    expect(result.annualBonusPointsYear1).toBe(0);
    expect(result.annualBonusPointsYear2).toBe(0);
    expect(result.recurringCreditsValue).toBe(150);
    expect(result.benefitsValue).toBe(160);
    expect(result.totalPointsYear1).toBe(60300);
  });

  it('adds Sapphire Preferred anniversary bonus points only in renewal math', () => {
    const profile = premiumCardProfileById['chase-sapphire-preferred'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 75000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['chase-travel'] = 1000;
    scenario.spend['other-travel'] = 2000;
    scenario.spend.dining = 3000;
    scenario.spend['online-grocery'] = 1000;
    scenario.spend.streaming = 500;
    scenario.spend['all-other'] = 2500;
    scenario.credits['annual-hotel-credit'] = 50;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(25000);
    expect(result.annualBonusPointsYear1).toBe(0);
    expect(result.annualBonusPointsYear2).toBe(1000);
    expect(result.totalPointsYear1).toBe(100000);
    expect(result.totalPointsYear2).toBe(26000);
  });

  it('calculates Capital One Venture with simple 2x spend and portal hotel earnings', () => {
    const profile = premiumCardProfileById['capital-one-venture'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 75000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['capital-one-travel-hotels-vacation-rentals-rental-cars'] = 1200;
    scenario.spend['all-other-purchases'] = 5000;
    scenario.credits['lifestyle-collection-credit'] = 50;
    scenario.credits['global-entry-credit'] = 30;
    scenario.benefits['hertz-five-star'] = 50;
    scenario.benefits['travel-assistance'] = 20;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(16000);
    expect(result.annualBonusPointsYear1).toBe(0);
    expect(result.annualBonusPointsYear2).toBe(0);
    expect(result.recurringCreditsValue).toBe(80);
    expect(result.benefitsValue).toBe(70);
    expect(result.totalPointsYear1).toBe(91000);
  });

  it('calculates Citi Strata Elite with its premium credits and blended dining structure', () => {
    const profile = premiumCardProfileById['citi-strata-elite'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 80000;
    scenario.annualFee = profile.annualFee;
    scenario.spend['citi-travel-hotels-cars-attractions'] = 500;
    scenario.spend['citi-travel-air-travel'] = 1500;
    scenario.spend['citi-nights-dining'] = 1200;
    scenario.spend['other-dining'] = 1800;
    scenario.spend['all-other'] = 4000;
    scenario.credits['annual-hotel-benefit'] = 300;
    scenario.credits['annual-splurge-credit'] = 100;
    scenario.credits['annual-blacklane-credit'] = 60;
    scenario.benefits['priority-pass'] = 120;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.spendPoints).toBe(33600);
    expect(result.annualBonusPointsYear2).toBe(0);
    expect(result.recurringCreditsValue).toBe(460);
    expect(result.benefitsValue).toBe(120);
    expect(result.totalPointsYear1).toBe(113600);
  });
});
