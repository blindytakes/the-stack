import { isDatabaseConfigured } from '@/lib/db';
import {
  buildPlanEmailBody,
  buildPlanEmailHtml,
  buildSavedPlanUrl,
  buildPlanEmailSubject,
  toPlanEmailContent
} from '@/lib/plan-email';
import { getEmailEnv } from '@/lib/env';
import { loadStoredPlanSnapshot } from '@/lib/plan-snapshot-loader';

export type SendSavedPlanEmailInput = {
  to: string;
  planId: string;
  referenceDateKey?: string;
};

export type SendSavedPlanEmailResult =
  | { ok: true; status: 200; body: { message: string } }
  | { ok: false; status: 404 | 502 | 503; error: string };

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const prefix = local.length > 1 ? `${local[0]}***` : '*';
  return `${prefix}@${domain}`;
}

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

  const env = getEmailEnv();
  if (!env.ok) {
    return {
      ok: false,
      status: 503,
      error: 'Email sending is not configured yet.'
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

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.config.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `The Stack <${env.config.EMAIL_FROM_ADDRESS}>`,
        to: [input.to],
        subject,
        html: emailHtml,
        text: emailBody
      })
    });

    if (!response.ok) {
      const providerBody = await response.text().catch(() => '');
      console.error('[email-plan] provider send failed', {
        email: maskEmail(input.to),
        planId: input.planId,
        status: response.status,
        body: providerBody.slice(0, 400)
      });
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
  } catch (error) {
    console.error('[email-plan] provider request failed', {
      email: maskEmail(input.to),
      planId: input.planId,
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 502,
      error: 'Could not send the plan email right now. Please try again.'
    };
  }
}
