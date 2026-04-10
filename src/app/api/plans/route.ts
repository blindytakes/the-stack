import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { parseJsonBody } from '@/lib/api-helpers';
import { savePlanSnapshot } from '@/lib/services/plan-snapshot-service';

export const POST = createApiRoute({
  route: '/api/plans',
  method: 'POST',
  requireValidOrigin: true,
  rateLimit: apiRateLimits.planSnapshot,
  handler: async (req: Request) => {
    const body = await parseJsonBody(req);
    return jsonFromServiceResult(await savePlanSnapshot(body));
  }
});
