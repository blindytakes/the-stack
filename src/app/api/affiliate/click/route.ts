import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest } from '@/lib/api-helpers';
import { recordAffiliateClick } from '@/lib/metrics';
import { getAffiliateEnv } from '@/lib/env';
import { trackedSourceSchema } from '@/lib/tracking';

const clickQuerySchema = z.object({
  card_slug: z.string().trim().min(1).max(120),
  source: trackedSourceSchema.default('card_detail'),
  target: z.string().trim().url()
});

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

export async function GET(req: Request) {
  return instrumentedApi('/api/affiliate/click', 'GET', async () => {
    const affiliateEnv = getAffiliateEnv();
    if (!affiliateEnv.ok) {
      console.error('[affiliate] allowlist config invalid', {
        errors: affiliateEnv.errors
      });
      return badRequest('Affiliate tracking is unavailable');
    }

    const url = new URL(req.url);
    const parsed = clickQuerySchema.safeParse({
      card_slug: url.searchParams.get('card_slug'),
      source: url.searchParams.get('source') ?? 'card_detail',
      target: url.searchParams.get('target')
    });

    if (!parsed.success) {
      return badRequest('Invalid affiliate link payload');
    }

    const normalizedTarget = normalizeTarget(
      parsed.data.target,
      affiliateEnv.config.AFFILIATE_ALLOWED_HOSTS
    );
    if (!normalizedTarget) {
      return badRequest('Invalid or unapproved target URL');
    }

    recordAffiliateClick(parsed.data.card_slug, parsed.data.source);
    console.info('[affiliate] click', {
      card_slug: parsed.data.card_slug,
      source: parsed.data.source,
      target_host: new URL(normalizedTarget).hostname
    });

    return NextResponse.redirect(normalizedTarget, { status: 307 });
  });
}
