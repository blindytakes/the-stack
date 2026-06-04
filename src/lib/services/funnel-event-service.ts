import { z } from 'zod';
import { recordFunnelEvent } from '@/lib/metrics';
import { normalizeVitalPathToRoute } from '@/lib/vitals-path';

const funnelEventNameSchema = z.enum([
  'landing_view',
  'tool_started',
  'quiz_completed',
  'plan_results_view',
  'card_detail_view',
  'banking_detail_view',
  'points_advisor_recommendation_view',
  'newsletter_subscribed',
  'affiliate_click'
]);

const funnelEventPropertiesSchema = z
  .object({
    source: z.string().trim().min(1).max(80).optional(),
    path: z.string().trim().min(1).max(2048).optional(),
    card_slug: z.string().trim().min(1).max(160).optional(),
    bank_slug: z.string().trim().min(1).max(160).optional(),
    tool: z.string().trim().min(1).max(80).optional(),
    program: z.string().trim().min(1).max(80).optional(),
    goal: z.string().trim().min(1).max(80).optional(),
    recommendation: z.string().trim().min(1).max(120).optional()
  })
  .default({});

const funnelEventSchema = z.object({
  event: funnelEventNameSchema,
  properties: funnelEventPropertiesSchema.optional().default({})
});

export type FunnelEventName = z.infer<typeof funnelEventNameSchema>;

export type IngestFunnelEventResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeMetricLabel(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return normalized || fallback;
}

function inferEntityType(event: FunnelEventName, properties: z.infer<typeof funnelEventPropertiesSchema>) {
  if (properties.card_slug) return 'card';
  if (properties.bank_slug) return 'banking';
  if (properties.tool) return 'tool';
  if (event === 'newsletter_subscribed') return 'newsletter';
  if (event === 'banking_detail_view') return 'banking';
  if (event === 'card_detail_view') return 'card';
  if (event === 'points_advisor_recommendation_view') return 'tool';
  if (event === 'affiliate_click') return 'outbound';

  return 'site';
}

export function ingestFunnelEvent(rawBody: unknown | null): IngestFunnelEventResult {
  if (rawBody === null) {
    return { ok: false, error: 'Invalid JSON' };
  }

  const parsed = funnelEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid payload' };
  }

  const properties = parsed.data.properties;

  recordFunnelEvent(parsed.data.event, {
    path: normalizeVitalPathToRoute(properties.path ?? '/other'),
    source: normalizeMetricLabel(properties.source, 'unknown'),
    tool: normalizeMetricLabel(properties.tool, 'none'),
    entity_type: inferEntityType(parsed.data.event, properties)
  });

  return { ok: true };
}
