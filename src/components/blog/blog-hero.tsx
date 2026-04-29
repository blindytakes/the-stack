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
    <section className="mt-7 md:mt-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-coral">
            Start Here
          </p>
        </div>
      </div>
      <div className="grid gap-5 md:gap-6">
        <Link
          href={`/blog/${main.slug}`}
          className="group grid overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-coral/15 via-bg-elevated to-bg-surface transition hover:-translate-y-1 hover:border-brand-coral/40 hover:shadow-[0_0_32px_rgba(232,99,74,0.12)] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]"
        >
          <div className="relative min-h-[260px] lg:min-h-[420px]">
            <BlogCoverImage
              image={main.coverImage}
              className="h-full min-h-[260px] lg:min-h-[420px]"
              imgClassName="transition duration-500 group-hover:scale-105"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/10 lg:to-black/45" />
          </div>

          <div className="flex flex-col justify-center p-5 md:p-7 lg:p-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
            <h2 className="mt-4 max-w-2xl font-heading text-4xl leading-[1.02] text-text-primary transition group-hover:text-brand-coral md:text-5xl lg:text-[3.3rem]">
              {main.cardTitle}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary md:text-base md:leading-7">
              {main.description}
            </p>
            {main.keyTakeaway && (
              <blockquote className="mt-5 max-w-xl border-l-2 border-brand-coral/50 pl-4 text-xs italic leading-5 text-text-secondary/90 md:text-[13px] md:leading-6">
                {main.keyTakeaway}
              </blockquote>
            )}
          </div>
        </Link>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {side.slice(0, 2).map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 hover:border-brand-coral/35 hover:shadow-[0_0_20px_rgba(232,99,74,0.08)]"
            >
              <div className="relative">
                <BlogCoverImage
                  image={article.coverImage}
                  className="aspect-[16/8.5]"
                  imgClassName="transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
                <h3 className="mt-4 text-[1.08rem] font-semibold leading-7 text-text-primary transition group-hover:text-brand-coral lg:text-lg">
                  {article.cardTitle}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
