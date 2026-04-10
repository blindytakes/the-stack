import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { sendPremiumCardCalculatorEmailRequestSchema } from '@/lib/premium-card-email';
import { sendPremiumCardCalculatorEmail } from '@/lib/services/email-calculator-service';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const POST = createApiRoute({
  route: '/api/email-calculator',
  method: 'POST',
  requireValidOrigin: true,
  rateLimit: apiRateLimits.calculatorEmail,
  handler: async (req: Request) => {
    const raw = await parseJsonBody(req);
    if (raw === null) return badRequest('Invalid JSON body');

    const parsed = sendPremiumCardCalculatorEmailRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest('Invalid calculator email request');
    }

    const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, req);
    if (!turnstileOk) {
      return badRequest('Challenge verification failed. Please try again.');
    }

    return jsonFromServiceResult(
      await sendPremiumCardCalculatorEmail({
        to: parsed.data.to,
        profileId: parsed.data.profileId,
        scenario: parsed.data.scenario
      })
    );
  }
});
