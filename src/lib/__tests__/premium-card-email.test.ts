import { describe, expect, it } from 'vitest';
import {
  buildInitialPremiumCardScenario,
  premiumCardProfileById
} from '@/lib/premium-card-calculator';
import {
  buildPremiumCardCalculatorEmailBody,
  buildPremiumCardCalculatorEmailHtml,
  buildPremiumCardCalculatorEmailSubject,
  buildPremiumCardEmailContent
} from '@/lib/premium-card-email';

describe('premium card calculator email renderers', () => {
  it('renders the selected card, summary values, and non-zero assumptions', () => {
    const profile = premiumCardProfileById['amex-green'];
    const baseScenario = buildInitialPremiumCardScenario(profile);
    const content = buildPremiumCardEmailContent(profile, {
      ...baseScenario,
      spend: {
        ...baseScenario.spend,
        travel: 800,
        'transit-worldwide': 250
      },
      credits: {
        ...baseScenario.credits,
        'clear-credit': 150
      },
      benefits: {
        ...baseScenario.benefits,
        'global-assist-hotline': 35
      }
    });

    const subject = buildPremiumCardCalculatorEmailSubject(content);
    const body = buildPremiumCardCalculatorEmailBody(content);
    const html = buildPremiumCardCalculatorEmailHtml(content);

    expect(subject).toContain('Amex Green');
    expect(body).toContain('Year 1 expected value');
    expect(body).toContain('Travel purchases');
    expect(body).toContain('CLEAR Plus credit');
    expect(body).toContain('Global Assist Hotline');
    expect(html).toContain('Amex Green calculator snapshot');
    expect(html).toContain('Hard-value credits kept');
    expect(html).toContain('Soft-value perks kept');
    expect(html).toContain('Open the calculator');
  });
});
