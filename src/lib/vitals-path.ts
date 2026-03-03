const allowedStaticPaths = new Set([
  '/',
  '/about',
  '/affiliate-disclosure',
  '/banking',
  '/cards',
  '/contact',
  '/learn',
  '/methodology',
  '/privacy',
  '/terms',
  '/tools/card-finder',
  '/tools/card-vs-card',
  '/tools/hidden-benefits'
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

  if (/^\/cards\/[^/]+$/.test(normalized)) return '/cards/[slug]';
  if (/^\/learn\/[^/]+$/.test(normalized)) return '/learn/[slug]';
  if (allowedStaticPaths.has(normalized)) return normalized;

  return '/other';
}
