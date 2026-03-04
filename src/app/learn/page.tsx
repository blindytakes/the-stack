import type { Metadata } from 'next';
import Link from 'next/link';
import {
  corePlaybookArticles,
  learnCategoryColor,
  type LearnArticleCard
} from '@/lib/learn-articles';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Playbooks on bank and credit strategy for earning more, keeping more, and avoiding traps.'
};

function ArticleGrid({ articles }: { articles: LearnArticleCard[] }) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Link
          key={article.slug}
          href={`/learn/${article.slug}`}
          className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
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
          <h2 className="mt-3 text-lg font-semibold text-text-primary transition group-hover:text-brand-teal">
            {article.title}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{article.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default function LearnPage() {
  return (
    <div className="container-page pt-12 pb-16">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Learn</p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary">
          Playbooks & Guides
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Clear-headed bank and credit strategy. No affiliate bait, no filler, just practical
          frameworks that help you make and keep more money.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          For high-conviction issuer and card takes, visit the{' '}
          <Link href="/blog" className="text-brand-teal transition hover:underline">
            Blog
          </Link>
          .
        </p>
      </div>

      <section className="mt-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Core Playbooks</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">Foundational Guides</h2>
          <p className="mt-2 text-sm text-text-muted">
            Frameworks and how-to guides for building a durable card and banking strategy.
          </p>
        </div>
        <ArticleGrid articles={corePlaybookArticles} />
      </section>
    </div>
  );
}
