import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildInitialPremiumCardScenario, premiumCardProfileById } from '@/lib/premium-card-calculator';

const sendResendEmailMock = vi.fn();

vi.mock('@/lib/email-delivery', () => ({
  sendResendEmail: (...args: unknown[]) => sendResendEmailMock(...args)
}));

import { sendPremiumCardCalculatorEmail } from '@/lib/services/email-calculator-service';

describe('sendPremiumCardCalculatorEmail', () => {
  const profile = premiumCardProfileById['amex-green'];
  const scenario = {
    ...buildInitialPremiumCardScenario(profile),
    spend: {
      ...buildInitialPremiumCardScenario(profile).spend,
      travel: 600
    },
    credits: {
      ...buildInitialPremiumCardScenario(profile).credits,
      'clear-credit': 150
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when email sending is not configured', async () => {
    sendResendEmailMock.mockResolvedValue({
      ok: false,
      status: 503,
      reason: 'config'
    });

    const result = await sendPremiumCardCalculatorEmail({
      to: 'user@example.com',
      profileId: 'amex-green',
      scenario
    });

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Email sending is not configured yet.'
    });
  });

  it('returns 502 when the provider send fails', async () => {
    sendResendEmailMock.mockResolvedValue({
      ok: false,
      status: 502,
      reason: 'provider'
    });

    const result = await sendPremiumCardCalculatorEmail({
      to: 'user@example.com',
      profileId: 'amex-green',
      scenario
    });

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: 'Could not send the calculator email right now. Please try again.'
    });
  });

  it('builds and sends the calculator email payload', async () => {
    sendResendEmailMock.mockResolvedValue({ ok: true });

    const result = await sendPremiumCardCalculatorEmail({
      to: 'user@example.com',
      profileId: 'amex-green',
      scenario
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      body: { message: 'Your calculator results have been emailed. Check your inbox.' }
    });
    expect(sendResendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        logPrefix: 'email-calculator',
        metadata: { profileId: 'amex-green' }
      })
    );
    expect(sendResendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Amex Green'),
        html: expect.stringContaining('Premium card calculator report'),
        text: expect.stringContaining('The Stack premium card calculator report')
      })
    );
  });
});
