import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  allBlogArticles,
  allBlogSlugs,
  getArticleBySlug,
  learnCategoryColor,
  formatArticleDate
} from '@/lib/learn-articles';
import { ReadingProgressBar } from '@/components/blog/reading-progress-bar';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { BlogArticleCTA } from '@/components/blog/blog-article-cta';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allBlogSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };
  return { title: article.title, description: article.description };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const relatedByCategory = allBlogArticles
    .filter(
      (candidate) =>
        candidate.slug !== slug && candidate.category === article.category
    )
    .sort((a, b) => (b.featuredOrder ?? -1) - (a.featuredOrder ?? -1));
  const relatedFallback = allBlogArticles
    .filter(
      (candidate) =>
        candidate.slug !== slug && candidate.category !== article.category
    )
    .sort((a, b) => (b.featuredOrder ?? -1) - (a.featuredOrder ?? -1));
  const relatedArticles = [...relatedByCategory, ...relatedFallback].slice(
    0,
    3
  );

  const showCallout =
    article.keyTakeaway && article.sections.length >= 3;

  return (
    <div className="container-page pt-12 pb-16">
      <ReadingProgressBar />

      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/blog" className="transition hover:text-text-secondary">
          Blog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{article.title}</span>
      </nav>

      <header className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`text-xs uppercase tracking-[0.2em] ${
              learnCategoryColor[article.category] ?? 'text-text-muted'
            }`}
          >
            {article.category}
          </span>
          <span className="text-xs text-text-muted">{article.readTime} read</span>
          <span className="text-xs text-text-muted">
            {formatArticleDate(article.publishedAt)}
          </span>
        </div>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-text-primary md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-text-secondary md:text-xl">
          {article.description}
        </p>
        <p className="mt-3 text-xs text-text-muted">
          By {article.author ?? 'The Stack'}
        </p>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        {/* Article column */}
        <div>
          {/* Mobile TOC */}
          <div className="mb-8 lg:hidden">
            <TableOfContents sections={article.sections} />
          </div>

          <article className="max-w-none space-y-10">
            {article.sections.map((section, i) => (
              <div key={i}>
                <section>
                  <h2
                    id={slugify(section.heading)}
                    className="scroll-mt-24 font-heading text-2xl text-text-primary"
                  >
                    {section.heading}
                  </h2>
                  <p className="mt-4 text-base leading-[1.8] text-text-secondary md:text-lg md:leading-[1.85]">
                    {section.body}
                  </p>
                </section>

                {/* Key takeaway callout after 2nd section */}
                {i === 1 && showCallout && (
                  <div className="my-8 rounded-2xl border border-brand-teal/20 bg-brand-teal/5 p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-teal">
                      Key Takeaway
                    </p>
                    <p className="mt-2 font-heading text-lg italic text-text-primary">
                      {article.keyTakeaway}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </article>

          <BlogArticleCTA />
        </div>

        {/* Desktop TOC sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents sections={article.sections} />
          </div>
        </aside>
      </div>

      {relatedArticles.length > 0 && (
        <RevealOnScroll>
          <section className="mt-14 max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-coral">
              Keep Reading
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group rounded-2xl border border-white/10 bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-brand-coral/35 hover:shadow-[0_0_18px_rgba(232,99,74,0.08)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] ${
                        learnCategoryColor[related.category] ?? 'text-text-muted'
                      }`}
                    >
                      {related.category}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {related.readTime}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-text-primary transition group-hover:text-brand-coral">
                    {related.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                    {related.description}
                  </p>
                  <p className="mt-2 text-[10px] text-text-muted">
                    {formatArticleDate(related.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}
    </div>
  );
}
