const allowedStaticPaths = new Set([
  '/',
  '/about',
  '/banking',
  '/blog',
  '/cards',
  '/contact',
  '/plan/results',
  '/learn',
  '/privacy',
  '/terms',
  '/tools',
  '/cards/compare',
  '/tools/card-finder',
  '/tools/personal-finance-tracker',
  '/tools/premium-card-calculator',
  '/tools/card-benefit-calendar',
  '/tools/points-advisor'
]);

function normalizeRawPathname(rawPath: string): string | null {
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith('/')
      ? new URL(trimmed, 'http://localhost')
      : new URL(trimmed);
    return url.pathname;
  } catch {
    return null;
  }
}

export function normalizeVitalPathToRoute(rawPath: string): string {
  const pathname = normalizeRawPathname(rawPath);
  if (!pathname) return '/other';

  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (allowedStaticPaths.has(normalized)) return normalized;
  if (/^\/cards\/[^/]+$/.test(normalized)) return '/cards/[slug]';
  if (/^\/banking\/[^/]+$/.test(normalized)) return '/banking/[slug]';
  if (/^\/blog\/[^/]+$/.test(normalized)) return '/blog/[slug]';
  if (/^\/learn\/[^/]+$/.test(normalized)) return '/learn/[slug]';

  return '/other';
}
