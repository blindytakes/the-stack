import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { recordWebVital } from '@/lib/metrics';
import { badRequest, parseJsonBody, serverError } from '@/lib/api-helpers';

const webVitalSchema = z.object({
  name: z.enum(['LCP', 'FID', 'CLS', 'INP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  path: z.string().min(1).max(2048),
  device: z.enum(['mobile', 'desktop'])
});

export async function POST(req: Request) {
  return instrumentedApi('/api/vitals', 'POST', async () => {
    try {
      const body = await parseJsonBody(req);
      if (body === null) {
        return badRequest('Invalid JSON');
      }

      const parsed = webVitalSchema.safeParse(body);
      if (!parsed.success) {
        return badRequest('Invalid payload');
      }

      recordWebVital(parsed.data.name, parsed.data.value, {
        path: parsed.data.path,
        device: parsed.data.device
      });

      return new NextResponse(null, { status: 204 });
    } catch {
      return serverError();
    }
  });
}
