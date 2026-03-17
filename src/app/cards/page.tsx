import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
      {/* Compact hero */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">
            {directoryCards.length} Cards
          </p>
          <h1 className="mt-2 font-heading text-4xl text-text-primary">
            Card Directory
          </h1>
        </div>
        <Link href="/cards/plan">
          <Button size="sm">Build My Card Plan →</Button>
        </Link>
      </div>

      {/* Cards immediately */}
      <CardsDirectoryExplorer cards={directoryCards} learnArticles={featuredLearn} />

      {/* Card-Only Planner CTA — below the directory */}
      <section className="mt-14 rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Card-Only Planner</p>
            <h2 className="mt-2 font-heading text-3xl text-text-primary">Want a ranked card plan instead?</h2>
            <p className="mt-3 text-sm text-text-secondary">
              Use the dedicated planner page to enter the cards you already have, your Chase
              status, and a few spend and credit inputs. Then we will build a focused bonus-first
              card plan without crowding the directory.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/cards/plan">
              <Button>Build My Card Plan</Button>
            </Link>
            <Link href="/tools/card-finder?mode=full">
              <Button variant="ghost">Full Cards + Banking Planner</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Methodology, Disclosure, Data Snapshot */}
      <section className="mt-8 grid gap-3 md:grid-cols-3">
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
    </div>
  );
}
