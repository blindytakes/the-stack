import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { db } from '@/lib/db';
import { getNewsletterProviderStatus } from '@/lib/newsletter/provider';

export async function GET() {
  return instrumentedApi('/api/health', 'GET', async () => {
    const newsletter = getNewsletterProviderStatus();
    const timestamp = new Date().toISOString();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: newsletter.ok ? 'ok' : 'degraded',
        timestamp
      });
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
