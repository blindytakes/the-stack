import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { getCardDetail } from '@/lib/services/cards-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return instrumentedApi('/api/cards/[slug]', 'GET', async () => {
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.cardDetail);
    if (rateLimited) return rateLimited;

    const result = await getCardDetail(slug);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  });
}
