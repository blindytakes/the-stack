import { z } from 'zod';
import { recordWebVital } from '@/lib/metrics';
import { normalizeVitalPathToRoute } from '@/lib/vitals-path';

const webVitalSchema = z.object({
  name: z.enum(['LCP', 'CLS', 'INP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  path: z.string().min(1).max(2048),
  device: z.enum(['mobile', 'desktop'])
});

export type IngestWebVitalResult =
  | { ok: true }
  | { ok: false; error: string };

export function ingestWebVital(rawBody: unknown | null): IngestWebVitalResult {
  if (rawBody === null) {
    return { ok: false, error: 'Invalid JSON' };
  }

  const parsed = webVitalSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid payload' };
  }

  recordWebVital(parsed.data.name, parsed.data.value, {
    path: normalizeVitalPathToRoute(parsed.data.path),
    device: parsed.data.device
  });

  return { ok: true };
}
