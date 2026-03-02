import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { recordWebVital } from '@/lib/metrics';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { normalizeVitalPathToRoute } from '@/lib/vitals-path';
import { applyIpRateLimit } from '@/lib/rate-limit';

const webVitalSchema = z.object({
  name: z.enum(['LCP', 'CLS', 'INP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  path: z.string().min(1).max(2048),
  device: z.enum(['mobile', 'desktop'])
});

export async function POST(req: Request) {
  return instrumentedApi('/api/vitals', 'POST', async () => {
    const rateLimited = await applyIpRateLimit(req, {
      namespace: 'web_vitals',
      limit: 120,
      window: '1 m',
      algorithm: 'fixed',
      message: 'Rate limit exceeded for vitals ingestion'
    });
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    if (body === null) {
      return badRequest('Invalid JSON');
    }

    const parsed = webVitalSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid payload');
    }

    recordWebVital(parsed.data.name, parsed.data.value, {
      path: normalizeVitalPathToRoute(parsed.data.path),
      device: parsed.data.device
    });

    return new NextResponse(null, { status: 204 });
  });
}
