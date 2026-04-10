import type { PremiumCardId, PremiumCardScenario } from '@/lib/premium-card-calculator';
import { premiumCardProfileById } from '@/lib/premium-card-calculator';
import { sendResendEmail } from '@/lib/email-delivery';
import {
  buildPremiumCardCalculatorEmailBody,
  buildPremiumCardCalculatorEmailHtml,
  buildPremiumCardCalculatorEmailSubject,
  buildPremiumCardEmailContent
} from '@/lib/premium-card-email';

export type SendPremiumCardCalculatorEmailInput = {
  to: string;
  profileId: PremiumCardId;
  scenario: PremiumCardScenario;
};

export type SendPremiumCardCalculatorEmailResult =
  | { ok: true; status: 200; body: { message: string } }
  | { ok: false; status: 502 | 503; error: string };

export async function sendPremiumCardCalculatorEmail(
  input: SendPremiumCardCalculatorEmailInput
): Promise<SendPremiumCardCalculatorEmailResult> {
  const profile = premiumCardProfileById[input.profileId];
  if (!profile) {
    return {
      ok: false,
      status: 503,
      error: 'Calculator email is temporarily unavailable.'
    };
  }

  const content = buildPremiumCardEmailContent(profile, input.scenario);
  const delivery = await sendResendEmail({
    to: input.to,
    subject: buildPremiumCardCalculatorEmailSubject(content),
    html: buildPremiumCardCalculatorEmailHtml(content),
    text: buildPremiumCardCalculatorEmailBody(content),
    logPrefix: 'email-calculator',
    metadata: { profileId: input.profileId }
  });

  if (!delivery.ok) {
    if (delivery.reason === 'config') {
      return {
        ok: false,
        status: 503,
        error: 'Email sending is not configured yet.'
      };
    }

    return {
      ok: false,
      status: 502,
      error: 'Could not send the calculator email right now. Please try again.'
    };
  }

  return {
    ok: true,
    status: 200,
    body: { message: 'Your calculator results have been emailed. Check your inbox.' }
  };
}
