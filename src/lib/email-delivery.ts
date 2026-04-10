import { getEmailEnv } from '@/lib/env';

type SendResendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  logPrefix: string;
  metadata?: Record<string, unknown>;
};

export type SendResendEmailResult =
  | { ok: true }
  | { ok: false; status: 502 | 503; reason: 'config' | 'provider' };

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const prefix = local.length > 1 ? `${local[0]}***` : '*';
  return `${prefix}@${domain}`;
}

export async function sendResendEmail(
  input: SendResendEmailInput
): Promise<SendResendEmailResult> {
  const env = getEmailEnv();
  if (!env.ok) {
    return {
      ok: false,
      status: 503,
      reason: 'config'
    };
  }

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
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (!response.ok) {
      const providerBody = await response.text().catch(() => '');
      console.error(`[${input.logPrefix}] provider send failed`, {
        email: maskEmail(input.to),
        status: response.status,
        body: providerBody.slice(0, 400),
        ...input.metadata
      });
      return {
        ok: false,
        status: 502,
        reason: 'provider'
      };
    }

    return { ok: true };
  } catch (error) {
    console.error(`[${input.logPrefix}] provider request failed`, {
      email: maskEmail(input.to),
      error: error instanceof Error ? error.message : String(error),
      ...input.metadata
    });
    return {
      ok: false,
      status: 502,
      reason: 'provider'
    };
  }
}
