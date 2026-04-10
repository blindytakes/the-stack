import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { getCardDetail } from '@/lib/services/cards-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return createApiRoute({
    route: '/api/cards/[slug]',
    method: 'GET',
    rateLimit: apiRateLimits.cardDetail,
    handler: async () => jsonFromServiceResult(await getCardDetail(slug))
  })(req);
}
