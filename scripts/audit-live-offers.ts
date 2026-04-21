import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { isDatabaseConfigured } from '@/lib/db';
import { getAffiliateEnv } from '@/lib/env';

type OfferRecord = {
  kind: 'card' | 'banking';
  slug: string;
  label: string;
  org: string;
  url: string | null;
  lastVerified: string;
  expiresAt?: string;
};

type UrlInspection = {
  url: string;
  ok: boolean;
  status?: number;
  finalUrl?: string;
  title?: string | null;
  sample?: string;
  error?: string;
};

type UrlAuditEntry = UrlInspection & {
  offerCount: number;
  offers: OfferRecord[];
};

const STALE_THRESHOLD_DAYS = 21;
const EXPIRING_SOON_DAYS = 14;
const FETCH_TIMEOUT_MS = 20_000;
const FETCH_BATCH_SIZE = 6;
const MAX_REDIRECTS = 12;

loadEnvConfig(process.cwd());

function formatDate(date: Date) {
  return date.toLocaleDateString('en-CA', {
    timeZone: process.env.TZ ?? 'America/New_York'
  });
}

function daysOld(isoDate: string, now: Date) {
  const diffMs = now.getTime() - new Date(isoDate).getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function isExpiringSoon(expiresAt: string | undefined, now: Date) {
  if (!expiresAt) return false;

  const expiryMs = new Date(expiresAt).getTime();
  const diffMs = expiryMs - now.getTime();
  return diffMs >= 0 && diffMs <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
}

function renderList(items: string[], maxItems = 12) {
  if (items.length === 0) return 'none';
  if (items.length <= maxItems) return items.join(', ');

  const visible = items.slice(0, maxItems).join(', ');
  return `${visible}, +${items.length - maxItems} more`;
}

function renderOfferList(
  items: Array<{
    slug: string;
    expiresAt?: string;
    ageDays?: number;
  }>,
  maxItems = 12
) {
  if (items.length === 0) return 'none';

  const formatted = items.map((item) => {
    if (item.expiresAt) {
      return `${item.slug} (${item.expiresAt.slice(0, 10)})`;
    }

    if (item.ageDays != null) {
      return `${item.slug} (${item.ageDays}d)`;
    }

    return item.slug;
  });

  return renderList(formatted, maxItems);
}

function isSuspiciousDestination(entry: UrlAuditEntry) {
  const haystacks = [entry.finalUrl ?? '', entry.title ?? '', entry.sample ?? ''].map((value) =>
    value.toLowerCase()
  );

  return haystacks.some(
    (value) =>
      value.includes('error/500') ||
      value.includes('page not found') ||
      value.includes('not found') ||
      value.includes('/error/') ||
      value.includes('/404')
  );
}

function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function isAllowedTargetHost(target: string, allowedHosts: string[]) {
  const hostname = new URL(target).hostname.toLowerCase();
  return allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

async function readResponsePreview(res: Response): Promise<Pick<UrlInspection, 'title' | 'sample'>> {
  const decoder = new TextDecoder();
  const contentType = res.headers.get('content-type') ?? '';
  let sample = '';
  let title: string | null = null;

  if (res.body && /(text\/html|application\/xhtml\+xml)/i.test(contentType)) {
    const reader = res.body.getReader();
    let total = 0;

    while (total < 32_768) {
      const { done, value } = await reader.read();
      if (done) break;

      sample += decoder.decode(value, { stream: true });
      total += value.length;

      if (/<\/title>/i.test(sample) || sample.length >= 16_384) {
        break;
      }
    }

    try {
      await reader.cancel();
    } catch {
      // Ignore cleanup errors from short-circuiting the response body.
    }

    const titleMatch = sample.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;
  }

  return {
    title,
    sample: sample.slice(0, 1000)
  };
}

async function inspectUrl(target: string): Promise<UrlInspection> {
  try {
    let currentUrl = target;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const res = await fetch(currentUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; TheStackCatalogAudit/1.0)'
        }
      });

      if (isRedirectStatus(res.status)) {
        const location = res.headers.get('location');
        if (!location) {
          return {
            url: target,
            ok: false,
            status: res.status,
            finalUrl: currentUrl,
            error: 'Redirect response missing Location header'
          };
        }

        const nextUrl = new URL(location, currentUrl).toString();
        if (redirectCount === MAX_REDIRECTS) {
          return {
            url: target,
            ok: false,
            status: res.status,
            finalUrl: currentUrl,
            error: `Too many redirects (>${MAX_REDIRECTS})`,
            sample: `Last redirect target: ${nextUrl}`
          };
        }

        currentUrl = nextUrl;
        continue;
      }

      const preview = await readResponsePreview(res);
      return {
        url: target,
        ok: res.ok,
        status: res.status,
        finalUrl: currentUrl,
        ...preview
      };
    }

    return {
      url: target,
      ok: false,
      finalUrl: currentUrl,
      error: `Too many redirects (>${MAX_REDIRECTS})`
    };
  } catch (error) {
    return {
      url: target,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required for catalog:audit:live');
  }

  const now = new Date();
  const prisma = new PrismaClient();

  try {
    const [cards, banking] = await Promise.all([
      prisma.card.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          name: true,
          issuer: true,
          applyUrl: true,
          affiliateUrl: true,
          lastVerified: true
        },
        orderBy: [{ issuer: 'asc' }, { name: 'asc' }]
      }),
      prisma.bankingBonus.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
        },
        select: {
          slug: true,
          bankName: true,
          offerName: true,
          offerUrl: true,
          affiliateUrl: true,
          lastVerified: true,
          expiresAt: true
        },
        orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
      })
    ]);

    const offers: OfferRecord[] = [
      ...cards.map((card) => ({
        kind: 'card' as const,
        slug: card.slug,
        label: card.name,
        org: card.issuer,
        url: card.affiliateUrl ?? card.applyUrl ?? null,
        lastVerified: card.lastVerified.toISOString()
      })),
      ...banking.map((offer) => ({
        kind: 'banking' as const,
        slug: offer.slug,
        label: offer.offerName,
        org: offer.bankName,
        url: offer.affiliateUrl ?? offer.offerUrl ?? null,
        lastVerified: offer.lastVerified.toISOString(),
        expiresAt: offer.expiresAt?.toISOString()
      }))
    ];

    const staleCards = offers
      .filter((offer) => offer.kind === 'card')
      .map((offer) => ({ slug: offer.slug, ageDays: daysOld(offer.lastVerified, now) }))
      .filter((offer) => offer.ageDays > STALE_THRESHOLD_DAYS);

    const staleBanking = offers
      .filter((offer) => offer.kind === 'banking')
      .map((offer) => ({ slug: offer.slug, ageDays: daysOld(offer.lastVerified, now) }))
      .filter((offer) => offer.ageDays > STALE_THRESHOLD_DAYS);

    const expiringSoonBanking = offers
      .filter((offer): offer is OfferRecord & { kind: 'banking'; expiresAt: string } =>
        offer.kind === 'banking' && Boolean(offer.expiresAt)
      )
      .filter((offer) => isExpiringSoon(offer.expiresAt, now))
      .map((offer) => ({ slug: offer.slug, expiresAt: offer.expiresAt }));

    const missingUrls = offers.filter((offer) => !offer.url);

    const groupedByUrl = new Map<string, OfferRecord[]>();
    for (const offer of offers) {
      if (!offer.url) continue;

      const existing = groupedByUrl.get(offer.url) ?? [];
      existing.push(offer);
      groupedByUrl.set(offer.url, existing);
    }

    const uniqueUrls = [...groupedByUrl.entries()].map(([url, groupedOffers]) => ({
      url,
      offers: groupedOffers
    }));

    const inspections: UrlInspection[] = [];
    for (let index = 0; index < uniqueUrls.length; index += FETCH_BATCH_SIZE) {
      const batch = uniqueUrls.slice(index, index + FETCH_BATCH_SIZE);
      inspections.push(...(await Promise.all(batch.map(({ url }) => inspectUrl(url)))));
    }

    const inspectionsByUrl = new Map(inspections.map((entry) => [entry.url, entry]));
    const auditedUrls: UrlAuditEntry[] = uniqueUrls.map(({ url, offers: groupedOffers }) => ({
      ...(inspectionsByUrl.get(url) ?? { url, ok: false, error: 'missing inspection result' }),
      offerCount: groupedOffers.length,
      offers: groupedOffers
    }));

    const fetchFailures = auditedUrls.filter((entry) => Boolean(entry.error));
    const deadUrls = auditedUrls.filter(
      (entry) => !entry.error && (!entry.ok || (entry.status != null && entry.status >= 400))
    );
    const suspiciousUrls = auditedUrls.filter((entry) => !entry.error && isSuspiciousDestination(entry));
    const duplicateUrls = auditedUrls.filter((entry) => entry.offerCount > 1);
    const affiliateEnv = getAffiliateEnv();
    const cardTargetsOutsideAllowlist = affiliateEnv.ok
      ? cards
          .map((card) => {
            const url = card.affiliateUrl ?? card.applyUrl;
            if (!url) return null;

            const host = new URL(url).hostname.toLowerCase();
            return isAllowedTargetHost(url, affiliateEnv.config.AFFILIATE_ALLOWED_HOSTS)
              ? null
              : `${card.slug} (${host})`;
          })
          .filter((value): value is string => Boolean(value))
      : [];
    const fetchFailureDetails = fetchFailures.flatMap((entry) =>
      entry.offers.map((offer) => `${offer.slug} (${entry.error ?? 'fetch failed'})`)
    );
    const deadDestinationDetails = deadUrls.flatMap((entry) =>
      entry.offers.map((offer) => `${offer.slug} (${entry.status ?? 'unknown status'})`)
    );
    const suspiciousDestinationDetails = suspiciousUrls.flatMap((entry) =>
      entry.offers.map((offer) => `${offer.slug} (${entry.finalUrl ?? entry.url})`)
    );

    const lines = [
      '# Live Offer Audit',
      '',
      `Generated: ${formatDate(now)}`,
      '',
      '## Summary',
      `- Active offers: ${offers.length}`,
      `- Active cards: ${cards.length}`,
      `- Active banking offers: ${banking.length}`,
      '',
      '## Freshness',
      `- Stale cards (> ${STALE_THRESHOLD_DAYS} days since lastVerified): ${staleCards.length}`,
      `- Stale banking offers (> ${STALE_THRESHOLD_DAYS} days since lastVerified): ${staleBanking.length}`,
      `- Banking offers expiring within ${EXPIRING_SOON_DAYS} days: ${expiringSoonBanking.length}`,
      `- Stale card slugs: ${renderOfferList(staleCards)}`,
      `- Stale banking slugs: ${renderOfferList(staleBanking)}`,
      `- Expiring-soon banking slugs: ${renderOfferList(expiringSoonBanking)}`,
      '',
      '## Links',
      `- Missing outbound URLs: ${missingUrls.length}`,
      `- Fetch failures: ${fetchFailures.length}`,
      `- Dead HTTP destinations: ${deadUrls.length}`,
      `- Suspicious destinations: ${suspiciousUrls.length}`,
      `- Shared duplicate URLs: ${duplicateUrls.length}`,
      `- Missing URL slugs: ${renderList(missingUrls.map((offer) => offer.slug))}`,
      `- Fetch-failure slugs: ${renderList(fetchFailures.flatMap((entry) => entry.offers.map((offer) => offer.slug)))}`,
      `- Fetch-failure details: ${renderList(fetchFailureDetails, 8)}`,
      `- Dead-destination slugs: ${renderList(deadUrls.flatMap((entry) => entry.offers.map((offer) => offer.slug)))}`,
      `- Dead-destination details: ${renderList(deadDestinationDetails, 8)}`,
      `- Suspicious-destination slugs: ${renderList(
        suspiciousUrls.flatMap((entry) => entry.offers.map((offer) => offer.slug))
      )}`,
      `- Suspicious-destination details: ${renderList(suspiciousDestinationDetails, 8)}`,
      `- Duplicate URL groups: ${renderList(
        duplicateUrls.map(
          (entry) => `${entry.url} -> ${entry.offers.map((offer) => offer.slug).join(', ')}`
        ),
        8
      )}`,
      '',
      '## Card Redirect Path',
      `- Affiliate allowlist configured: ${affiliateEnv.ok ? 'yes' : `no (${affiliateEnv.errors.join('; ')})`}`,
      `- Card targets outside allowlist: ${
        affiliateEnv.ok ? String(cardTargetsOutsideAllowlist.length) : 'skipped'
      }`,
      `- Outside-allowlist card slugs: ${
        affiliateEnv.ok ? renderList(cardTargetsOutsideAllowlist) : 'skipped'
      }`
    ];

    console.log(lines.join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[catalog:audit:live] failed', error);
  process.exit(1);
});
