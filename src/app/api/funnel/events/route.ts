import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { ingestFunnelEvent } from '@/lib/services/funnel-event-service';

export const POST = createApiRoute({
  route: '/api/funnel/events',
  method: 'POST',
  requireValidOrigin: true,
  rateLimit: apiRateLimits.funnelEvents,
  handler: async (req: Request) => {
    const body = await parseJsonBody(req);
    const result = ingestFunnelEvent(body);
    if (!result.ok) {
      return badRequest(result.error);
    }

    return new NextResponse(null, { status: 204 });
  }
});
