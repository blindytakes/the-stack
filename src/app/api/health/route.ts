import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { db } from '@/lib/db';

export async function GET() {
  return instrumentedApi('/api/health', 'GET', async () => {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: 'ok',
        db: 'not_configured',
        timestamp: new Date().toISOString()
      });
    }

    try {
      await db.$queryRaw`SELECT 1`;
      return NextResponse.json({
        status: 'ok',
        db: 'ok',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[api:/api/health] db check failed', error);
      return NextResponse.json(
        {
          status: 'degraded',
          db: 'error',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  });
}
