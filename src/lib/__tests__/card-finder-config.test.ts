import { describe, expect, it } from 'vitest';
import { buildCardFinderSteps } from '@/components/tools/card-finder-config';

describe('buildCardFinderSteps', () => {
  it('includes the direct deposit capacity step in the full planner flow', () => {
    expect(buildCardFinderSteps().some((step) => step.id === 'directDepositCapacity')).toBe(true);
  });

  it('includes recent card openings in the consumer full planner flow', () => {
    expect(buildCardFinderSteps().some((step) => step.id === 'recentCardOpenings24Months')).toBe(true);
  });

  it('uses a direct deposit capacity question instead of a yes/no direct deposit field', () => {
    const steps = buildCardFinderSteps();

    expect(steps.some((step) => String(step.id) === 'directDeposit')).toBe(false);
    expect(steps.some((step) => step.id === 'directDepositCapacity')).toBe(true);
  });

  it('requires the direct deposit capacity step when it is included', () => {
    const directDepositStep = buildCardFinderSteps().find((step) => step.id === 'directDepositCapacity');

    expect(directDepositStep).toBeDefined();
    expect(directDepositStep && 'optional' in directDepositStep ? directDepositStep.optional : false).toBe(false);
  });

  it('uses four direct deposit capacity options', () => {
    const directDepositStep = buildCardFinderSteps().find((step) => step.id === 'directDepositCapacity');

    expect(directDepositStep && 'options' in directDepositStep ? directDepositStep.options : []).toEqual([
      { label: 'None', value: 'none' },
      { label: 'Up to $1,000/mo', value: 'up_to_1000' },
      { label: '$1,001-$2,500/mo', value: 'from_1001_to_2500' },
      { label: '$2,500+/mo', value: 'at_least_2500' }
    ]);
  });

  it('uses business-specific copy when the business audience is selected', () => {
    const steps = buildCardFinderSteps({ audience: 'business' });
    const monthlySpendStep = steps.find((step) => step.id === 'monthlySpend');
    const ownedCardsStep = steps.find((step) => step.id === 'ownedCardSlugs');

    expect(monthlySpendStep?.title).toContain('business spend');
    expect(ownedCardsStep?.title).toContain('business cards');
    expect(steps.some((step) => step.id === 'recentCardOpenings24Months')).toBe(false);
    expect(steps.some((step) => step.id === 'directDepositCapacity')).toBe(true);
  });
});
