import Link from 'next/link';
import type { LearnArticleCard } from '@/lib/learn-articles';

type CardsDirectoryLearnSectionProps = {
  learnArticles: LearnArticleCard[];
};

export function CardsDirectoryLearnSection({ learnArticles }: CardsDirectoryLearnSectionProps) {
  if (learnArticles.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Learn Before You Apply</p>
          <h3 className="mt-2 font-heading text-2xl text-text-primary">Core Card Playbooks</h3>
        </div>
        <Link href="/blog" className="text-sm text-text-secondary transition hover:text-text-primary">
          See all guides
        </Link>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-brand-gold/35 hover:shadow-[0_0_20px_rgba(212,168,83,0.1)]"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">
              <span>{article.category}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
            <h4 className="mt-3 text-base font-semibold text-text-primary transition group-hover:text-brand-gold">
              {article.title}
            </h4>
            <p className="mt-2 text-sm text-text-secondary">{article.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
