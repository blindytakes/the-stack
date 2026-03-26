import { describe, expect, it } from 'vitest';
import { buildCardFinderSteps } from '@/components/tools/card-finder-config';

describe('buildCardFinderSteps', () => {
  it('includes the cash step by default and when direct deposit is available', () => {
    expect(buildCardFinderSteps().some((step) => step.id === 'availableCash')).toBe(true);
    expect(buildCardFinderSteps({ directDeposit: 'yes' }).some((step) => step.id === 'availableCash')).toBe(
      true
    );
  });

  it('omits the cash step when direct deposit is unavailable', () => {
    const steps = buildCardFinderSteps({ directDeposit: 'no' });

    expect(steps.some((step) => step.id === 'availableCash')).toBe(false);
  });

  it('marks the cash step as optional when it is included', () => {
    const cashStep = buildCardFinderSteps().find((step) => step.id === 'availableCash');

    expect(cashStep).toBeDefined();
    expect(cashStep && 'optional' in cashStep ? cashStep.optional : false).toBe(true);
  });

  it('uses business-specific copy when the business audience is selected', () => {
    const steps = buildCardFinderSteps({ audience: 'business' });
    const monthlySpendStep = steps.find((step) => step.id === 'monthlySpend');
    const ownedCardsStep = steps.find((step) => step.id === 'ownedCardSlugs');

    expect(monthlySpendStep?.title).toContain('business spend');
    expect(ownedCardsStep?.title).toContain('business cards');
    expect(steps.some((step) => step.id === 'chase524Status')).toBe(false);
  });
});
