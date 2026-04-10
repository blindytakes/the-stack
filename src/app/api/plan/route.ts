import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { parseJsonBody } from '@/lib/api-helpers';
import { buildPlan } from '@/lib/services/plan-service';

export const POST = createApiRoute({
  route: '/api/plan',
  method: 'POST',
  rateLimit: apiRateLimits.plan,
  handler: async (req: Request) => {
    const body = await parseJsonBody(req);
    return jsonFromServiceResult(await buildPlan(body));
  }
});
