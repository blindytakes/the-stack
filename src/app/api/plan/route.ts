import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { buildPlan } from '@/lib/services/plan-service';

export async function POST(req: Request) {
  return instrumentedApi('/api/plan', 'POST', async () => {
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.plan);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    const result = await buildPlan(body);
    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  });
}
