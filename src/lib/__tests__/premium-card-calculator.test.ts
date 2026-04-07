import { describe, expect, it } from 'vitest';
import {
  buildInitialPremiumCardScenario,
  calculatePremiumCardScenario,
  premiumCardProfileById
} from '@/lib/premium-card-calculator';

describe('premium card calculator', () => {
  it('calculates the default Amex Platinum scenario', () => {
    const profile = premiumCardProfileById['amex-platinum'];
    const result = calculatePremiumCardScenario(profile, buildInitialPremiumCardScenario(profile));

    expect(result.welcomeOfferPoints).toBe(175000);
    expect(result.spendPoints).toBe(48500);
    expect(result.pointsValueYear1).toBe(4470);
    expect(result.expectedValueYear1).toBe(8308);
    expect(result.expectedValueYear2).toBe(3259);
  });

  it('removes the welcome offer when the user is not eligible', () => {
    const profile = premiumCardProfileById['capital-one-venture-x'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.eligibleForBonus = false;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.welcomeOfferPoints).toBe(0);
    expect(result.totalPointsYear1).toBe(result.spendPoints);
    expect(result.pointsValueYear1).toBe(result.pointsValueYear2);
  });

  it('keeps year-one and renewal adjustments separate', () => {
    const profile = premiumCardProfileById['chase-sapphire-reserve'];
    const scenario = buildInitialPremiumCardScenario(profile);
    scenario.firstYearExtraValue = 450;
    scenario.renewalOnlyValue = 275;

    const result = calculatePremiumCardScenario(profile, scenario);

    expect(result.expectedValueYear1 - result.expectedValueYear2).toBe(
      result.pointsValueYear1 - result.pointsValueYear2 + 175
    );
  });
});
