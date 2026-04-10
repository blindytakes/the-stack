import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { getBankingBonusesList } from '@/lib/services/banking-service';

/**
 * Banking offer listing API endpoint.
 *
 * Supports lightweight filtering + pagination for clients that need current
 * banking-bonus records (planner intake/results, dynamic UI filters, etc.).
 */
export const GET = createApiRoute({
  route: '/api/banking',
  method: 'GET',
  rateLimit: apiRateLimits.bankingList,
  handler: async (req: Request) => {
    const url = new URL(req.url);
    return jsonFromServiceResult(
      await getBankingBonusesList({
        accountType: url.searchParams.get('accountType') ?? undefined,
        customerType: url.searchParams.get('customerType') ?? undefined,
        requiresDirectDeposit:
          url.searchParams.get('requiresDirectDeposit') ??
          url.searchParams.get('directDeposit') ??
          undefined,
        apy: url.searchParams.get('apy') ?? undefined,
        difficulty: url.searchParams.get('difficulty') ?? undefined,
        cashRequirement: url.searchParams.get('cashRequirement') ?? undefined,
        timeline: url.searchParams.get('timeline') ?? undefined,
        stateLimited: url.searchParams.get('stateLimited') ?? undefined,
        state: url.searchParams.get('state') ?? undefined,
        sort: url.searchParams.get('sort') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
        offset: url.searchParams.get('offset') ?? undefined
      })
    );
  }
});
