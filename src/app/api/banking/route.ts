import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { getBankingBonusesList } from '@/lib/services/banking-service';

/**
 * Banking offer listing API endpoint.
 *
 * Supports lightweight filtering + pagination for clients that need current
 * banking-bonus records (planner intake/results, dynamic UI filters, etc.).
 */
export async function GET(req: Request) {
  return instrumentedApi('/api/banking', 'GET', async () => {
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.bankingList);
    if (rateLimited) return rateLimited;

    const url = new URL(req.url);
    const result = await getBankingBonusesList({
      accountType: url.searchParams.get('accountType') ?? undefined,
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
    });

    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  });
}
