import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { recordWebVital } from '@/lib/metrics';

const webVitalSchema = z.object({
  name: z.enum(['LCP', 'FID', 'CLS', 'INP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  path: z.string().min(1).max(2048),
  device: z.enum(['mobile', 'desktop'])
});

export async function POST(req: Request) {
  return instrumentedApi('/api/vitals', 'POST', async () => {
    try {
      const raw = await req.text();
      const parsedJson = JSON.parse(raw);
      const parsed = webVitalSchema.safeParse(parsedJson);

      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      recordWebVital(parsed.data.name, parsed.data.value, {
        path: parsed.data.path,
        device: parsed.data.device
      });

      return new NextResponse(null, { status: 204 });
    } catch {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  });
}
