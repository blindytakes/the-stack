import type { Metadata } from 'next';
import Link from 'next/link';
import {
  allBlogArticles,
  learnCategoryColor,
  type LearnArticleCard
} from '@/lib/learn-articles';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides, strategy breakdowns, and high-conviction takes on cards, banking, and benefits.'
};

type Props = {
  searchParams: Promise<{ category?: string | string[]; sort?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

type BlogSort = 'newest' | 'most-opinionated' | 'shortest-read';

const sortOptions: { label: string; value: BlogSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Opinionated', value: 'most-opinionated' },
  { label: 'Shortest Read', value: 'shortest-read' }
];

const opinionCategoryWeight: Record<string, number> = {
  'Card Reviews': 3,
  Strategy: 2,
  Benefits: 1
};

function getReadMinutes(readTime: string): number {
  const parsed = Number.parseInt(readTime, 10);
  return Number.isFinite(parsed) ? parsed : 999;
}

function getSortLabel(sort: BlogSort): string {
  return sortOptions.find((option) => option.value === sort)?.label ?? 'Newest';
}

function buildBlogHref(
  category: string | null,
  sort: BlogSort
): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (sort !== 'newest') params.set('sort', sort);
  const query = params.toString();
  return query ? `/blog?${query}` : '/blog';
}

function BlogGrid({ articles }: { articles: LearnArticleCard[] }) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Link
          key={article.slug}
          href={`/blog/${article.slug}`}
          className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-coral/35 hover:shadow-[0_0_20px_rgba(251,146,60,0.08)]"
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] uppercase tracking-[0.2em] ${
                learnCategoryColor[article.category] ?? 'text-text-muted'
              }`}
            >
              {article.category}
            </span>
            <span className="text-[10px] text-text-muted">{article.readTime}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-text-primary transition group-hover:text-brand-coral">
            {article.title}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{article.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function BlogPage({ searchParams }: Props) {
  const search = await searchParams;
  const categories = [...new Set(allBlogArticles.map((article) => article.category))];
  const categoryCounts = new Map(
    categories.map((category) => [
      category,
      allBlogArticles.filter((article) => article.category === category).length
    ])
  );
  const requestedCategory = firstParam(search.category);
  const selectedCategory =
    requestedCategory && categories.includes(requestedCategory) ? requestedCategory : null;
  const requestedSort = firstParam(search.sort);
  const selectedSort: BlogSort =
    requestedSort &&
    sortOptions.some((option) => option.value === requestedSort)
      ? (requestedSort as BlogSort)
      : 'newest';

  const filteredArticles = selectedCategory
    ? allBlogArticles.filter((article) => article.category === selectedCategory)
    : allBlogArticles;
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (selectedSort) {
      case 'most-opinionated': {
        const weightDiff =
          (opinionCategoryWeight[b.category] ?? 0) - (opinionCategoryWeight[a.category] ?? 0);
        if (weightDiff !== 0) return weightDiff;
        return (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER);
      }
      case 'shortest-read': {
        const readTimeDiff = getReadMinutes(a.readTime) - getReadMinutes(b.readTime);
        if (readTimeDiff !== 0) return readTimeDiff;
        return (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER);
      }
      case 'newest':
      default: {
        return (b.featuredOrder ?? -1) - (a.featuredOrder ?? -1);
      }
    }
  });
  const [featuredArticle, ...remainingArticles] = sortedArticles;

  return (
    <div className="container-page pt-12 pb-16">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-coral">Blog</p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary">Guides, Strategy & Takes</h1>
        <p className="mt-4 text-lg text-text-secondary">
          Everything in one feed: foundational playbooks, strategic frameworks, and opinionated
          takes on issuers and benefits.
        </p>
      </div>

      {featuredArticle ? (
        <section className="mt-8 max-w-4xl">
          <Link
            href={`/blog/${featuredArticle.slug}`}
            className="group block rounded-3xl border border-white/10 bg-gradient-to-br from-brand-coral/12 via-bg-elevated to-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-coral/40 hover:shadow-[0_0_28px_rgba(251,146,60,0.12)]"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-coral">Featured</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  learnCategoryColor[featuredArticle.category] ?? 'text-text-muted'
                }`}
              >
                {featuredArticle.category}
              </span>
              <span className="text-[10px] text-text-muted">{featuredArticle.readTime}</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-text-primary transition group-hover:text-brand-coral">
              {featuredArticle.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-text-secondary">{featuredArticle.description}</p>
          </Link>
        </section>
      ) : null}

      <section className="mt-6 max-w-4xl rounded-2xl border border-white/10 bg-bg-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildBlogHref(null, selectedSort)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  selectedCategory === null
                    ? 'border-brand-coral/50 bg-brand-coral/15 text-brand-coral'
                    : 'border-white/10 text-text-secondary hover:border-brand-coral/30 hover:text-text-primary'
                }`}
              >
                All ({allBlogArticles.length})
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={buildBlogHref(category, selectedSort)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selectedCategory === category
                      ? 'border-brand-coral/50 bg-brand-coral/15 text-brand-coral'
                      : 'border-white/10 text-text-secondary hover:border-brand-coral/30 hover:text-text-primary'
                  }`}
                >
                  {category} ({categoryCounts.get(category) ?? 0})
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Sort</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildBlogHref(selectedCategory, option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selectedSort === option.value
                      ? 'border-brand-coral/50 bg-brand-coral/15 text-brand-coral'
                      : 'border-white/10 text-text-secondary hover:border-brand-coral/30 hover:text-text-primary'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Showing {sortedArticles.length} post{sortedArticles.length === 1 ? '' : 's'}
          {selectedCategory ? ` in ${selectedCategory}` : ''}, sorted by {getSortLabel(selectedSort)}.
        </p>
      </section>

      <BlogGrid articles={remainingArticles} />
    </div>
  );
}
