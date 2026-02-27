import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/api-helpers';

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
    } catch {
      return jsonError('Database health check failed', 503);
    }
  });
}
