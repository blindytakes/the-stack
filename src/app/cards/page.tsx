import type { Metadata } from 'next';
import Link from 'next/link';
import { getCardsData } from '@/lib/cards';
import {
  allBlogArticles,
  type LearnArticleCard
} from '@/lib/learn-articles';
import { filterCardsForDirectory } from '@/lib/cards-directory';
import { CardsOnlyPlanPath } from '@/components/cards/cards-only-plan-path';
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

export default async function CardsPage() {
  const { cards } = await getCardsData();
  const directoryCards = filterCardsForDirectory(cards);
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
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">
          {directoryCards.length} Cards
        </p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary">
          Card Directory
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Answer five quick questions to build a focused 12-month card plan, or browse the full
          directory by sign-up bonus value, issuer, annual fee, and credit profile.
        </p>
      </div>

      <div className="mb-10">
        <CardsOnlyPlanPath />
      </div>

      <section className="mb-10 grid gap-3 md:grid-cols-3">
        <Link
          href="/methodology"
          className="rounded-2xl border border-white/10 bg-bg-surface p-4 transition hover:border-brand-teal/35 hover:bg-bg-elevated"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Methodology</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">How we evaluate cards</p>
          <p className="mt-1 text-xs text-text-secondary">Scoring logic, fit criteria, and value assumptions.</p>
        </Link>
        <Link
          href="/affiliate-disclosure"
          className="rounded-2xl border border-white/10 bg-bg-surface p-4 transition hover:border-brand-teal/35 hover:bg-bg-elevated"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Disclosure</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">How affiliate links work</p>
          <p className="mt-1 text-xs text-text-secondary">
            Transparency on partner relationships and editorial independence.
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

      <div id="cards-directory" className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
          Browse Every Card
        </p>
      </div>
      <CardsDirectoryExplorer cards={directoryCards} learnArticles={featuredLearn} />
    </div>
  );
}
