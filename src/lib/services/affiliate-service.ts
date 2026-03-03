import { z } from 'zod';
import { recordAffiliateClick } from '@/lib/metrics';
import { getAffiliateEnv } from '@/lib/env';
import { trackedSourceSchema } from '@/lib/tracking';

const clickQuerySchema = z.object({
  card_slug: z.string().trim().min(1).max(120),
  source: trackedSourceSchema.default('card_detail'),
  target: z.string().trim().url()
});

export type AffiliateClickResolution =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

function normalizeTarget(rawTarget: string, allowedHosts: string[]) {
  const parsed = new URL(rawTarget);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const targetHost = parsed.hostname.toLowerCase();
  const allowed = allowedHosts.some(
    (host) => targetHost === host || targetHost.endsWith(`.${host}`)
  );
  if (!allowed) {
    return null;
  }

  return parsed.toString();
}

export function resolveAffiliateClickRedirect(reqUrl: string): AffiliateClickResolution {
  const affiliateEnv = getAffiliateEnv();
  if (!affiliateEnv.ok) {
    console.error('[affiliate] allowlist config invalid', {
      errors: affiliateEnv.errors
    });
    return { ok: false, error: 'Affiliate tracking is unavailable' };
  }

  const url = new URL(reqUrl);
  const parsed = clickQuerySchema.safeParse({
    card_slug: url.searchParams.get('card_slug'),
    source: url.searchParams.get('source') ?? 'card_detail',
    target: url.searchParams.get('target')
  });
  if (!parsed.success) {
    return { ok: false, error: 'Invalid affiliate link payload' };
  }

  const normalizedTarget = normalizeTarget(
    parsed.data.target,
    affiliateEnv.config.AFFILIATE_ALLOWED_HOSTS
  );
  if (!normalizedTarget) {
    return { ok: false, error: 'Invalid or unapproved target URL' };
  }

  recordAffiliateClick(parsed.data.card_slug, parsed.data.source);
  console.info('[affiliate] click', {
    card_slug: parsed.data.card_slug,
    source: parsed.data.source,
    target_host: new URL(normalizedTarget).hostname
  });

  return { ok: true, redirectUrl: normalizedTarget };
}
