import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { sendPlanEmailRequestSchema } from '@/lib/plan-email';
import { sendSavedPlanEmail } from '@/lib/services/email-plan-service';
import { isValidOrigin, verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(req: Request) {
  return instrumentedApi('/api/email-plan', 'POST', async () => {
    if (!isValidOrigin(req)) {
      return badRequest('Invalid request origin');
    }

    const rateLimited = await applyIpRateLimit(req, apiRateLimits.emailPlan);
    if (rateLimited) return rateLimited;

    const raw = await parseJsonBody(req);
    if (raw === null) return badRequest('Invalid JSON body');

    const parsed = sendPlanEmailRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest('Invalid email plan request');
    }

    const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, req);
    if (!turnstileOk) {
      return badRequest('Challenge verification failed. Please try again.');
    }

    const result = await sendSavedPlanEmail({
      to: parsed.data.to,
      planId: parsed.data.planId
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.body, { status: result.status });
  });
}
