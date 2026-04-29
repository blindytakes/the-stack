import type { Metadata } from 'next';
import Link from 'next/link';
import {
  allBlogArticles,
  allBlogArticlesByDate,
  learnCategoryColor,
  formatArticleDate,
  type LearnArticleCard
} from '@/lib/learn-articles';
import { BlogHero } from '@/components/blog/blog-hero';
import { BlogCoverImage } from '@/components/blog/blog-cover-image';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Practical strategy for stacking cards, banking, bonuses, and benefits without the marketing noise.'
};

type Props = {
  searchParams: Promise<{ category?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const visibleBlogCategories = ['Strategy', 'Card Reviews', 'Banking', 'Benefits'];

function BlogCard({
  article,
  accentColor = 'coral'
}: {
  article: LearnArticleCard;
  accentColor?: 'coral' | 'gold' | 'teal';
}) {
  const hoverBorder = {
    coral: 'hover:border-brand-coral/35 hover:shadow-[0_0_20px_rgba(232,99,74,0.08)]',
    gold: 'hover:border-brand-gold/35 hover:shadow-[0_0_20px_rgba(212,168,83,0.08)]',
    teal: 'hover:border-brand-teal/35 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]'
  }[accentColor];

  const titleHover = {
    coral: 'group-hover:text-brand-coral',
    gold: 'group-hover:text-brand-gold',
    teal: 'group-hover:text-brand-teal'
  }[accentColor];

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 ${hoverBorder}`}
    >
      <div className="relative">
        <BlogCoverImage
          image={article.coverImage}
          className="aspect-[16/10]"
          imgClassName="transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      <div className="p-6">
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
        <h3
          className={`mt-3 text-lg font-semibold text-text-primary transition ${titleHover}`}
        >
          {article.cardTitle}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
          {article.description}
        </p>
        <p className="mt-3 text-[10px] text-text-muted">
          {formatArticleDate(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

function CategoryFilter({
  categories,
  selectedCategory,
  className = ''
}: {
  categories: string[];
  selectedCategory: string | null;
  className?: string;
}) {
  return (
    <div
      className={`sticky top-16 z-20 -mx-5 border-y border-white/5 bg-bg/80 px-5 py-3 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Link
          href="/blog"
          className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition ${
            selectedCategory === null
              ? 'border-brand-coral/50 bg-brand-coral/15 text-brand-coral'
              : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
          }`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/blog?category=${encodeURIComponent(category)}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition ${
              selectedCategory === category
                ? 'border-brand-coral/50 bg-brand-coral/15 text-brand-coral'
                : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
            }`}
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function BlogPage({ searchParams }: Props) {
  const search = await searchParams;
  const categories = visibleBlogCategories.filter((category) =>
    allBlogArticles.some((article) => article.category === category)
  );
  const requestedCategory = firstParam(search.category);
  const selectedCategory =
    requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : null;

  // Featured articles for the hero (top 3 by featuredOrder)
  const featured = allBlogArticlesByDate
    .filter((a) => a.featuredOrder !== null)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
    .slice(0, 3);

  // Category filter view
  if (selectedCategory) {
    const filteredArticles = allBlogArticlesByDate.filter(
      (a) => a.category === selectedCategory
    );

    return (
      <div className="container-page pt-16 pb-20 md:pt-20">
        <div className="max-w-2xl">
          <Link
            href="/blog"
            className="text-xs text-text-muted transition hover:text-text-secondary"
          >
            &larr; All posts
          </Link>
          <h1 className="mt-3 font-heading text-4xl text-text-primary">
            {selectedCategory}
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            {filteredArticles.length} article
            {filteredArticles.length === 1 ? '' : 's'}
          </p>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          className="mt-8"
        />

        <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    );
  }

  // Default: magazine layout
  return (
    <div className="container-page pt-12 pb-20 md:pt-18">
      <div className="max-w-4xl">
        <h1 className="max-w-3xl font-heading text-5xl leading-[0.98] text-text-primary md:text-6xl">
          Stack your finances with sharper strategy
        </h1>
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={null}
        className="mt-5 md:mt-6"
      />

      <BlogHero featured={featured} />

      {/* All Articles */}
      <RevealOnScroll>
        <section className="mt-18 md:mt-20">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-coral">
            Browse
          </p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary md:text-3xl">
            All articles
          </h2>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            The latest strategy notes, card reviews, banking moves, and benefit
            breakdowns from The Stack.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {allBlogArticlesByDate.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
