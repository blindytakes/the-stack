import Link from 'next/link';
import {
  learnCategoryColor,
  formatArticleDate,
  type LearnArticleCard
} from '@/lib/learn-articles';
import { BlogCoverImage } from '@/components/blog/blog-cover-image';

type BlogHeroProps = {
  featured: LearnArticleCard[];
};

export function BlogHero({ featured }: BlogHeroProps) {
  if (featured.length < 3) return null;
  const [main, ...side] = featured;

  return (
    <section className="mt-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.52fr)_minmax(320px,0.86fr)] lg:items-start">
        <Link
          href={`/blog/${main.slug}`}
          className="group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-coral/15 via-bg-elevated to-bg-surface transition hover:-translate-y-1 hover:border-brand-coral/40 hover:shadow-[0_0_32px_rgba(232,99,74,0.12)]"
        >
          <div className="relative">
            <BlogCoverImage
              image={main.coverImage}
              className="aspect-[16/10] lg:aspect-[16/8.2]"
              imgClassName="transition duration-500 group-hover:scale-105"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          </div>

          <div className="p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
            <h2 className="mt-3 max-w-[15ch] font-heading text-[2.2rem] leading-[1.02] text-text-primary transition group-hover:text-brand-coral lg:text-[3rem]">
              {main.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-text-secondary">
              {main.description}
            </p>
            {main.keyTakeaway && (
              <blockquote className="mt-4 border-l-2 border-brand-coral/50 pl-4 text-[13px] italic leading-6 text-text-secondary/90">
                {main.keyTakeaway}
              </blockquote>
            )}
          </div>
        </Link>

        <div className="grid gap-4">
          {side.slice(0, 2).map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 hover:border-brand-coral/35 hover:shadow-[0_0_20px_rgba(232,99,74,0.08)]"
            >
              <div className="relative">
                <BlogCoverImage
                  image={article.coverImage}
                  className="aspect-[16/8.8]"
                  imgClassName="transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                <h3 className="mt-3 text-[1.05rem] font-semibold leading-8 text-text-primary transition group-hover:text-brand-coral">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">{article.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
