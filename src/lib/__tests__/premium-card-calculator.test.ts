import { describe, expect, it } from 'vitest';
import {
  buildInitialPremiumCardScenario,
  calculatePremiumCardScenario,
  premiumCardProfileById
} from '@/lib/premium-card-calculator';

describe('premium card calculator', () => {
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
});
