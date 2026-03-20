import { describe, expect, it } from 'vitest';
import { buildCardFinderSteps } from '@/components/tools/card-finder-config';

describe('buildCardFinderSteps', () => {
  it('includes the cash step by default and when direct deposit is available', () => {
    expect(buildCardFinderSteps().some((step) => step.id === 'availableCash')).toBe(true);
    expect(buildCardFinderSteps('yes').some((step) => step.id === 'availableCash')).toBe(true);
  });

  it('omits the cash step when direct deposit is unavailable', () => {
    const steps = buildCardFinderSteps('no');

    expect(steps.some((step) => step.id === 'availableCash')).toBe(false);
  });

  it('marks the cash step as optional when it is included', () => {
    const cashStep = buildCardFinderSteps().find((step) => step.id === 'availableCash');

    expect(cashStep).toBeDefined();
    expect(cashStep && 'optional' in cashStep ? cashStep.optional : false).toBe(true);
  });
});
