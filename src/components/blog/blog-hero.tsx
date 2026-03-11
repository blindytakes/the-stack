import Link from 'next/link';
import {
  learnCategoryColor,
  formatArticleDate,
  type LearnArticleCard
} from '@/lib/learn-articles';

type BlogHeroProps = {
  featured: LearnArticleCard[];
};

export function BlogHero({ featured }: BlogHeroProps) {
  if (featured.length < 3) return null;
  const [main, ...side] = featured;

  return (
    <section className="mt-8">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:grid-rows-2">
        <Link
          href={`/blog/${main.slug}`}
          className="group relative flex flex-col justify-end overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-coral/15 via-bg-elevated to-bg-surface p-8 transition hover:-translate-y-1 hover:border-brand-coral/40 hover:shadow-[0_0_32px_rgba(232,99,74,0.12)] lg:row-span-2 lg:min-h-[420px]"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  learnCategoryColor[main.category] ?? 'text-text-muted'
                }`}
              >
                {main.category}
              </span>
              <span className="text-[10px] text-text-muted">{main.readTime}</span>
              <span className="text-[10px] text-text-muted">
                {formatArticleDate(main.publishedAt)}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-3xl leading-tight text-text-primary transition group-hover:text-brand-coral lg:text-4xl">
              {main.title}
            </h2>
            <p className="mt-3 max-w-lg text-base text-text-secondary">
              {main.description}
            </p>
            {main.keyTakeaway && (
              <blockquote className="mt-4 border-l-2 border-brand-coral/50 pl-4 text-sm italic text-text-secondary">
                {main.keyTakeaway}
              </blockquote>
            )}
          </div>
        </Link>

        {side.slice(0, 2).map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col justify-end rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-coral/35 hover:shadow-[0_0_20px_rgba(232,99,74,0.08)]"
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
              <span className="text-[10px] text-text-muted">
                {formatArticleDate(article.publishedAt)}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-text-primary transition group-hover:text-brand-coral">
              {article.title}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">{article.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
