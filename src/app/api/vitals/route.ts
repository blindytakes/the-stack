import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { ingestWebVital } from '@/lib/services/vitals-service';

/**
 * Web Vitals ingestion endpoint.
 *
 * Responsibilities:
 * - Apply per-IP throttling to protect ingestion volume.
 * - Validate payload shape and acceptable vital names.
 * - Normalize path values before recording metrics.
 * - Return 204 on success for lightweight client beacons.
 */

export async function POST(req: Request) {
  return instrumentedApi('/api/vitals', 'POST', async () => {
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.vitalsIngestion);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    const result = ingestWebVital(body);
    if (!result.ok) {
      return badRequest(result.error);
    }

    return new NextResponse(null, { status: 204 });
  });
}
