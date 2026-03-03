import { db } from '@/lib/db';
import { getNewsletterProviderStatus } from '@/lib/newsletter/provider';
import { isDatabaseUrlConfigured } from '@/lib/config/server';

export type HealthCheckResult = {
  status: 200 | 503;
  body: {
    status: 'ok' | 'degraded';
    timestamp: string;
    reason?: string;
  };
};

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const newsletter = getNewsletterProviderStatus();
  const timestamp = new Date().toISOString();

  if (!isDatabaseUrlConfigured()) {
    return {
      status: 503,
      body: {
        status: 'degraded',
        timestamp,
        reason: 'DATABASE_URL is not configured'
      }
    };
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: newsletter.ok ? 200 : 503,
      body: {
        status: newsletter.ok ? 'ok' : 'degraded',
        timestamp
      }
    };
  } catch (error) {
    console.error('[/api/health] DB health check failed:', error);
    return {
      status: 503,
      body: {
        status: 'degraded',
        timestamp
      }
    };
  }
}
