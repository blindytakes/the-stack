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

  it('removes the welcome offer when the user is not eligible', () => {
    const profile = premiumCardProfileById['capital-one-venture-x'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.offerPoints = 75000;
    scenario.annualFee = profile.annualFee;
    scenario.eligibleForBonus = false;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.welcomeOfferPoints).toBe(0);
    expect(result.totalPointsYear1).toBe(result.spendPoints);
    expect(result.pointsValueYear1).toBe(result.pointsValueYear2);
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
