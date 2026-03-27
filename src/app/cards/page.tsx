import type { Metadata } from 'next';
import Link from 'next/link';
import { getCardsData } from '@/lib/cards';
import {
  allBlogArticles,
  type LearnArticleCard
} from '@/lib/learn-articles';
import { filterCardsForDirectory } from '@/lib/cards-directory';
import { CardsDirectoryExplorer } from '@/components/cards/cards-directory-explorer';

/**
 * Card directory page.
 *
 * `force-dynamic` ensures this page is rendered at request time so deploy/build
 * does not depend on live DB availability.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Card Directory',
  description: 'Browse and compare cards by fit, welcome offers, rewards, fees, and real-world value.'
};

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  searchParams: Promise<SearchParams>;
};

function buildInitialSearchParams(searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
      continue;
    }

    if (value) params.set(key, value);
  }

  return params.toString();
}

export default async function CardsPage({ searchParams }: Props) {
  const { cards } = await getCardsData();
  const directoryCards = filterCardsForDirectory(cards);
  const initialSearchParams = buildInitialSearchParams(await searchParams);
  const snapshotDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());
  const featuredLearnSlugs = [
    'signup-bonus-strategy',
    'annual-fee-math',
    'first-card-playbook'
  ] as const;
  const featuredLearnMap = new Map(allBlogArticles.map((article) => [article.slug, article]));
  const featuredLearn = featuredLearnSlugs
    .map((slug) => featuredLearnMap.get(slug))
    .filter((article): article is LearnArticleCard => Boolean(article));

  return (
    <div className="container-page pt-12 pb-16">
      {/* Cards immediately */}
      <CardsDirectoryExplorer
        cards={directoryCards}
        learnArticles={featuredLearn}
        initialSearchParams={initialSearchParams}
      />

      {/* Terms and Data Snapshot */}
      <section className="mt-8 grid gap-3 md:grid-cols-2">
        <Link
          href="/terms"
          className="rounded-2xl border border-white/10 bg-bg-surface p-4 transition hover:border-brand-teal/35 hover:bg-bg-elevated"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Terms</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">How to use this directory</p>
          <p className="mt-1 text-xs text-text-secondary">
            Offer accuracy, usage expectations, and important limitations.
          </p>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Data Snapshot</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">{snapshotDate}</p>
          <p className="mt-1 text-xs text-text-secondary">
            Directory reflects currently active cards available in this database.
          </p>
        </div>
      </section>
    </div>
  );
}
