import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { getCardsList } from '@/lib/services/cards-service';

/**
 * Card listing API endpoint.
 *
 * Responsibilities:
 * - Parse and validate query-string filters (issuer, category, fee, pagination).
 * - Load active card records from the canonical card data service.
 * - Apply filtering + pagination in-process and return metadata for clients.
 */
export const GET = createApiRoute({
  route: '/api/cards',
  method: 'GET',
  rateLimit: apiRateLimits.cardsList,
  handler: async (req: Request) => {
    const url = new URL(req.url);
    return jsonFromServiceResult(
      await getCardsList({
        issuer: url.searchParams.get('issuer') ?? undefined,
        category: url.searchParams.get('category') ?? undefined,
        maxFee: url.searchParams.get('maxFee') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
        offset: url.searchParams.get('offset') ?? undefined
      })
    );
  }
});
