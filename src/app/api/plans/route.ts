import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { savePlanSnapshot } from '@/lib/services/plan-snapshot-service';
import { isValidOrigin } from '@/lib/turnstile';

export async function POST(req: Request) {
  return instrumentedApi('/api/plans', 'POST', async () => {
    if (!isValidOrigin(req)) {
      return badRequest('Invalid request origin');
    }

    const rateLimited = await applyIpRateLimit(req, apiRateLimits.planSnapshot);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    const result = await savePlanSnapshot(body);
    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }

      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.body, { status: result.status });
  });
}
