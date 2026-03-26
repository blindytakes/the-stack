import type { MetadataRoute } from 'next';
import { allBlogSlugs } from '@/lib/learn-articles';

const SITE_URL = 'https://thestackhq.com';

/**
 * Dynamic sitemap for all static pages, detail pages, and editorial content.
 *
 * Card slugs and banking offer slugs are sourced from the database when
 * available, with banking falling back to seed records if DB is unavailable.
 * If the DB is unavailable at build time (e.g. during CI or preview deploys),
 * the sitemap still emits all static, banking, and article routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static routes ──────────────────────────────────────────────────────
  const staticPaths = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/cards', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/banking', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/business', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/tools/card-finder', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/tools/hidden-benefits', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tools/card-vs-card', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 }
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    lastModified: now
  }));

  // ── Blog article routes ────────────────────────────────────────────────
  const blogRoutes: MetadataRoute.Sitemap = allBlogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: now
  }));

  // ── Card detail routes (from DB) ──────────────────────────────────────
  let cardRoutes: MetadataRoute.Sitemap = [];
  try {
    // Dynamic import to avoid pulling Prisma into the sitemap bundle
    // when the DB is not configured (e.g. preview deploys).
    const { getAllCardSlugs } = await import('@/lib/cards');
    const slugs = await getAllCardSlugs();
    cardRoutes = slugs.map((slug) => ({
      url: `${SITE_URL}/cards/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      lastModified: now
    }));
  } catch {
    // DB unavailable — skip card routes. Static + article routes still emitted.
    console.warn('[sitemap] Could not fetch card slugs — DB may be unavailable');
  }

  // ── Banking detail routes (DB with seed fallback) ─────────────────────
  let bankingRoutes: MetadataRoute.Sitemap = [];
  try {
    const { getAllBankingBonusSlugs } = await import('@/lib/banking-bonuses');
    const slugs = await getAllBankingBonusSlugs();
    bankingRoutes = slugs.map((slug) => ({
      url: `${SITE_URL}/banking/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      lastModified: now
    }));
  } catch {
    console.warn('[sitemap] Could not fetch banking slugs');
  }

  return [...staticRoutes, ...blogRoutes, ...cardRoutes, ...bankingRoutes];
}
