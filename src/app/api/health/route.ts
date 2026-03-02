import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { db } from '@/lib/db';
import { getNewsletterProviderStatus } from '@/lib/newsletter/provider';

/**
 * Health-check endpoint used by uptime checks and deploy diagnostics.
 *
 * Signals:
 * - `ok`: database reachable and newsletter provider config healthy
 * - `degraded`: missing DB config, failed DB ping, or newsletter provider misconfig
 */
export async function GET() {
  return instrumentedApi('/api/health', 'GET', async () => {
    const newsletter = getNewsletterProviderStatus();
    const timestamp = new Date().toISOString();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: 'degraded',
        timestamp,
        reason: 'DATABASE_URL is not configured'
      }, { status: 503 });
    }

    try {
      await db.$queryRaw`SELECT 1`;
      return NextResponse.json({
        status: newsletter.ok ? 'ok' : 'degraded',
        timestamp
      });
    } catch (err) {
      console.error('[/api/health] DB health check failed:', err);
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp
        },
        { status: 503 }
      );
    }
  });
}
