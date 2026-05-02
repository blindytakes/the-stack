import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { getPersonalFinanceTrackerDownload } from '@/lib/services/personal-finance-tracker-service';

export const dynamic = 'force-dynamic';

export const GET = createApiRoute({
  route: '/api/tools/personal-finance-tracker/download',
  method: 'GET',
  rateLimit: apiRateLimits.personalFinanceTrackerDownload,
  handler: async () => {
    const result = await getPersonalFinanceTrackerDownload();

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return new NextResponse(result.body, {
      status: 200,
      headers: result.headers
    });
  }
});
