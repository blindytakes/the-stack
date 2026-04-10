import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api-route';
import { authorizeHealthCheck } from '@/lib/health-auth';
import { runHealthCheck } from '@/lib/services/health-service';

/**
 * Health-check endpoint used by uptime checks and deploy diagnostics.
 *
 * Signals:
 * - `ok`: database reachable and newsletter provider config healthy
 * - `degraded`: missing DB config, failed DB ping, or newsletter provider misconfig
 */
export const GET = createApiRoute({
  route: '/api/health',
  method: 'GET',
  handler: async (req: Request) => {
    const auth = authorizeHealthCheck(req);
    if (!auth.ok) {
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          reason: auth.reason
        },
        { status: auth.status }
      );
    }

    const result = await runHealthCheck();
    return NextResponse.json(result.body, { status: result.status });
  }
});
