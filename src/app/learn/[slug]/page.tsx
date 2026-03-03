import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { learnArticles, learnCategoryColor } from '@/lib/learn-articles';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(learnArticles).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = learnArticles[slug];
  if (!article) return { title: 'Article Not Found' };
  return { title: article.title, description: article.description };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = learnArticles[slug];
  if (!article) notFound();

  return (
    <div className="container-page pt-12 pb-16">
      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/learn" className="transition hover:text-text-secondary">
          Learn
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{article.title}</span>
      </nav>

      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs uppercase tracking-[0.2em] ${
              learnCategoryColor[article.category] ?? 'text-text-muted'
            }`}
          >
            {article.category}
          </span>
          <span className="text-xs text-text-muted">{article.readTime} read</span>
        </div>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl leading-tight text-text-primary">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-text-secondary">{article.description}</p>
      </header>

      <article className="mt-12 max-w-2xl space-y-10">
        {article.sections.map((section, i) => (
          <section key={i}>
            <h2 className="font-[var(--font-heading)] text-2xl text-text-primary">
              {section.heading}
            </h2>
            <p className="mt-3 leading-relaxed text-text-secondary">{section.body}</p>
          </section>
        ))}
      </article>

      <div className="mt-16 max-w-2xl rounded-2xl border border-white/10 bg-bg-surface p-6">
        <p className="text-sm text-text-muted">
          Ready to make the banks work for you?{' '}
          <Link href="/tools/card-finder" className="text-brand-teal transition hover:underline">
            Build your payout plan
          </Link>{' '}
          or{' '}
          <Link href="/tools/card-vs-card" className="text-brand-teal transition hover:underline">
            compare offers head-to-head
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
