import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { sendPlanEmailRequestSchema } from '@/lib/plan-email';
import { sendSavedPlanEmail } from '@/lib/services/email-plan-service';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const POST = createApiRoute({
  route: '/api/email-plan',
  method: 'POST',
  requireValidOrigin: true,
  rateLimit: apiRateLimits.emailPlan,
  handler: async (req: Request) => {
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

    return jsonFromServiceResult(
      await sendSavedPlanEmail({
        to: parsed.data.to,
        planId: parsed.data.planId,
        referenceDateKey: parsed.data.referenceDateKey
      })
    );
  }
});
