import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, parseJsonBody, serverError } from '@/lib/api-helpers';
import { getEmailEnv } from '@/lib/env';

const emailPlanRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000)
});

export async function POST(req: Request) {
  return instrumentedApi('/api/email-plan', 'POST', async () => {
    const env = getEmailEnv();
    if (!env.ok) {
      return NextResponse.json(
        { error: 'Email sending is not configured yet.' },
        { status: 503 }
      );
    }

    const raw = await parseJsonBody(req);
    if (!raw) return badRequest('Invalid JSON body');

    const parsed = emailPlanRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((i) => i.message).join('; '));
    }

    const { to, subject, body } = parsed.data;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.config.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `The Stack <${env.config.EMAIL_FROM_ADDRESS}>`,
          to: [to],
          subject,
          text: body
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          errorBody && typeof errorBody === 'object' && 'message' in errorBody
            ? String(errorBody.message)
            : `Resend API ${response.status}`;
        return serverError(message);
      }

      return NextResponse.json({ message: 'Email sent' }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return serverError(`Failed to send email: ${message}`);
    }
  });
}
