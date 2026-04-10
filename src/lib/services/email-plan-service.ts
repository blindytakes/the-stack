import { isDatabaseConfigured } from '@/lib/db';
import {
  buildPlanEmailBody,
  buildPlanEmailHtml,
  buildSavedPlanUrl,
  buildPlanEmailSubject,
  toPlanEmailContent
} from '@/lib/plan-email';
import { sendResendEmail } from '@/lib/email-delivery';
import { loadStoredPlanSnapshot } from '@/lib/plan-snapshot-loader';

export type SendSavedPlanEmailInput = {
  to: string;
  planId: string;
  referenceDateKey?: string;
};

export type SendSavedPlanEmailResult =
  | { ok: true; status: 200; body: { message: string } }
  | { ok: false; status: 404 | 502 | 503; error: string };

export async function sendSavedPlanEmail(
  input: SendSavedPlanEmailInput
): Promise<SendSavedPlanEmailResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Plan email is temporarily unavailable.'
    };
  }

  const loadedSnapshot = await loadStoredPlanSnapshot(input.planId);
  if (!loadedSnapshot.ok) {
    if (loadedSnapshot.reason === 'not_found') {
      return {
        ok: false,
        status: 404,
        error: 'Plan not found'
      };
    }

    return {
      ok: false,
      status: 503,
      error: 'Plan email is temporarily unavailable.'
    };
  }

  const emailContent = toPlanEmailContent(loadedSnapshot.body.snapshot, new Date());
  const subject = buildPlanEmailSubject(
    emailContent.totalValue,
    emailContent.cardsOnlyMode
  );
  const savedPlanUrl = buildSavedPlanUrl(input.planId);
  const emailBody = buildPlanEmailBody(emailContent, {
    savedPlanUrl,
    referenceDateKey: input.referenceDateKey
  });
  const emailHtml = buildPlanEmailHtml(emailContent, {
    savedPlanUrl,
    referenceDateKey: input.referenceDateKey
  });

  const delivery = await sendResendEmail({
    to: input.to,
    subject,
    html: emailHtml,
    text: emailBody,
    logPrefix: 'email-plan',
    metadata: { planId: input.planId }
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
      error: 'Could not send the plan email right now. Please try again.'
    };
  }

  return {
    ok: true,
    status: 200,
    body: { message: 'Your plan has been emailed. Check your inbox.' }
  };
}
