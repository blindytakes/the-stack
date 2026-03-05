'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatCategory } from '@/lib/format';
import type { CardRecord } from '@/lib/cards';
import type { LearnArticleCard } from '@/lib/learn-articles';

type CardsDirectoryExplorerProps = {
  cards: CardRecord[];
  learnArticles: LearnArticleCard[];
};

type SortValue = 'best_fit' | 'highest_bonus' | 'lowest_fee' | 'highest_rating' | 'a_to_z';
type FeeFilterValue = 'any' | '0' | '95' | '250' | '10000';
type CreditFilterValue = 'all' | CardRecord['creditTierMin'];
type CategoryFilterValue = 'all' | CardRecord['topCategories'][number];
type ConcreteCategoryValue = Exclude<CategoryFilterValue, 'all'>;

const creditRank: Record<CardRecord['creditTierMin'], number> = {
  building: 1,
  fair: 2,
  good: 3,
  excellent: 4
};

const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'best_fit', label: 'Best Fit' },
  { value: 'highest_bonus', label: 'Highest Welcome Value' },
  { value: 'lowest_fee', label: 'Lowest Annual Fee' },
  { value: 'highest_rating', label: 'Highest Editor Rating' },
  { value: 'a_to_z', label: 'A to Z' }
];

const feeOptions: Array<{ value: FeeFilterValue; label: string }> = [
  { value: 'any', label: 'Any fee' },
  { value: '0', label: 'No annual fee' },
  { value: '95', label: '$95 or less' },
  { value: '250', label: '$250 or less' },
  { value: '10000', label: '$250+' }
];

function toBestFitScore(card: CardRecord) {
  const bonusValue = card.bestSignUpBonusValue ?? 0;
  const rating = card.editorRating ?? 0;
  return bonusValue - card.annualFee + rating * 50;
}

function formatCreditTier(value: CardRecord['creditTierMin']) {
  if (value === 'excellent') return 'Excellent';
  if (value === 'good') return 'Good+';
  if (value === 'fair') return 'Fair+';
  return 'Building';
}

function formatBonusValue(value?: number) {
  if (!value || value <= 0) return 'No active bonus listed';
  return `Welcome est. $${Math.round(value).toLocaleString()}`;
}

function lower(value: string) {
  return value.trim().toLowerCase();
}

function isSortValue(value: string | null): value is SortValue {
  return value === 'best_fit' || value === 'highest_bonus' || value === 'lowest_fee' || value === 'highest_rating' || value === 'a_to_z';
}

function isRewardTypeValue(value: string | null): value is CardRecord['rewardType'] {
  return value === 'cashback' || value === 'points' || value === 'miles';
}

function isFeeFilterValue(value: string | null): value is FeeFilterValue {
  return value === 'any' || value === '0' || value === '95' || value === '250' || value === '10000';
}

function isCreditFilterValue(value: string | null): value is CreditFilterValue {
  return value === 'all' || value === 'excellent' || value === 'good' || value === 'fair' || value === 'building';
}

export function CardsDirectoryExplorer({ cards, learnArticles }: CardsDirectoryExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedFromUrl = useRef(false);

  const [query, setQuery] = useState('');
  const [issuer, setIssuer] = useState('all');
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  const [rewardType, setRewardType] = useState<'all' | CardRecord['rewardType']>('all');
  const [maxFee, setMaxFee] = useState<FeeFilterValue>('any');
  const [creditProfile, setCreditProfile] = useState<CreditFilterValue>('all');
  const [sortBy, setSortBy] = useState<SortValue>('best_fit');
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const issuerOptions = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.issuer))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [cards]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .flatMap((card) => card.topCategories)
          .filter((value): value is ConcreteCategoryValue => value !== 'all')
      )
    ).sort((a, b) => formatCategory(a).localeCompare(formatCategory(b)));
  }, [cards]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const queryFromUrl = params.get('q') ?? '';
    const issuerFromUrl = params.get('issuer');
    const categoryFromUrl = params.get('category');
    const rewardFromUrl = params.get('reward');
    const feeFromUrl = params.get('fee');
    const creditFromUrl = params.get('credit');
    const sortFromUrl = params.get('sort');

    setQuery(queryFromUrl);
    setIssuer(issuerFromUrl && issuerOptions.includes(issuerFromUrl) ? issuerFromUrl : 'all');
    setCategory(
      categoryFromUrl &&
        categoryFromUrl !== 'all' &&
        categoryOptions.includes(categoryFromUrl as ConcreteCategoryValue)
        ? (categoryFromUrl as CategoryFilterValue)
        : 'all'
    );
    setRewardType(isRewardTypeValue(rewardFromUrl) ? rewardFromUrl : 'all');
    setMaxFee(isFeeFilterValue(feeFromUrl) ? feeFromUrl : 'any');
    setCreditProfile(isCreditFilterValue(creditFromUrl) ? creditFromUrl : 'all');
    setSortBy(isSortValue(sortFromUrl) ? sortFromUrl : 'best_fit');

    hasHydratedFromUrl.current = true;
  }, [categoryOptions, issuerOptions, searchParams]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());

    const normalizedQuery = query.trim();
    if (normalizedQuery) params.set('q', normalizedQuery);
    else params.delete('q');

    if (issuer !== 'all') params.set('issuer', issuer);
    else params.delete('issuer');

    if (category !== 'all') params.set('category', category);
    else params.delete('category');

    if (rewardType !== 'all') params.set('reward', rewardType);
    else params.delete('reward');

    if (maxFee !== 'any') params.set('fee', maxFee);
    else params.delete('fee');

    if (creditProfile !== 'all') params.set('credit', creditProfile);
    else params.delete('credit');

    if (sortBy !== 'best_fit') params.set('sort', sortBy);
    else params.delete('sort');

    const currentQueryString = searchParams.toString();
    const nextQueryString = params.toString();
    if (nextQueryString === currentQueryString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [category, creditProfile, issuer, maxFee, pathname, query, rewardType, router, searchParams, sortBy]);

  const filteredSortedCards = useMemo(() => {
    const queryLower = lower(query);
    const hasQuery = queryLower.length > 0;

    const filtered = cards.filter((card) => {
      if (hasQuery) {
        const searchable = lower(
          `${card.name} ${card.issuer} ${card.headline} ${card.rewardType} ${card.creditTierMin}`
        );
        if (!searchable.includes(queryLower)) return false;
      }

      if (issuer !== 'all' && card.issuer !== issuer) return false;
      if (category !== 'all' && !card.topCategories.includes(category)) return false;
      if (rewardType !== 'all' && card.rewardType !== rewardType) return false;

      if (maxFee === '0' && card.annualFee !== 0) return false;
      if (maxFee === '95' && card.annualFee > 95) return false;
      if (maxFee === '250' && card.annualFee > 250) return false;
      if (maxFee === '10000' && card.annualFee <= 250) return false;

      if (creditProfile !== 'all' && creditRank[card.creditTierMin] > creditRank[creditProfile]) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'highest_bonus') {
        const bonusDiff = (b.bestSignUpBonusValue ?? 0) - (a.bestSignUpBonusValue ?? 0);
        if (bonusDiff !== 0) return bonusDiff;
      }

      if (sortBy === 'lowest_fee') {
        const feeDiff = a.annualFee - b.annualFee;
        if (feeDiff !== 0) return feeDiff;
      }

      if (sortBy === 'highest_rating') {
        const ratingDiff = (b.editorRating ?? 0) - (a.editorRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
      }

      if (sortBy === 'best_fit') {
        const fitDiff = toBestFitScore(b) - toBestFitScore(a);
        if (fitDiff !== 0) return fitDiff;
      }

      if (sortBy === 'a_to_z') {
        if (a.issuer !== b.issuer) return a.issuer.localeCompare(b.issuer);
      }

      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [cards, category, creditProfile, issuer, maxFee, query, rewardType, sortBy]);

  const selectedCompareCards = useMemo(() => {
    return selectedCompare
      .map((slug) => cards.find((card) => card.slug === slug))
      .filter((card): card is CardRecord => Boolean(card));
  }, [cards, selectedCompare]);

  const compareHref = useMemo(() => {
    if (selectedCompare.length !== 2) return null;
    const params = new URLSearchParams({
      a: selectedCompare[0],
      b: selectedCompare[1],
      src: 'cards_directory'
    });
    return `/tools/card-vs-card?${params.toString()}`;
  }, [selectedCompare]);

  const activeFilterCount = [
    query.trim().length > 0,
    issuer !== 'all',
    category !== 'all',
    rewardType !== 'all',
    maxFee !== 'any',
    creditProfile !== 'all'
  ].filter(Boolean).length;

  function clearFilters() {
    setQuery('');
    setIssuer('all');
    setCategory('all');
    setRewardType('all');
    setMaxFee('any');
    setCreditProfile('all');
    setSortBy('best_fit');
  }

  function toggleCompare(slug: string) {
    setSelectedCompare((prev) => {
      if (prev.includes(slug)) {
        setCompareError('');
        return prev.filter((value) => value !== slug);
      }
      if (prev.length >= 2) {
        setCompareError('Select up to 2 cards for comparison.');
        return prev;
      }
      setCompareError('');
      return [...prev, slug];
    });
  }

  return (
    <div>
      <section className="rounded-2xl border border-white/10 bg-bg-surface p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Search</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Card name or issuer"
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Issuer</span>
            <select
              value={issuer}
              onChange={(event) => setIssuer(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="all">All issuers</option>
              {issuerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {formatCategory(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Reward Type</span>
            <select
              value={rewardType}
              onChange={(event) => setRewardType(event.target.value as 'all' | CardRecord['rewardType'])}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="all">All reward types</option>
              <option value="cashback">Cash back</option>
              <option value="points">Points</option>
              <option value="miles">Miles</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Annual Fee</span>
            <select
              value={maxFee}
              onChange={(event) => setMaxFee(event.target.value as FeeFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {feeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">My Credit Profile</span>
            <select
              value={creditProfile}
              onChange={(event) => setCreditProfile(event.target.value as CreditFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="all">Any credit tier</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="building">Building</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            Showing {filteredSortedCards.length} of {cards.length} cards
            {activeFilterCount > 0 ? ` with ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : ''}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Reset filters
          </button>
        </div>
      </section>

      {compareError && <p className="mt-3 text-sm text-brand-coral">{compareError}</p>}

      {filteredSortedCards.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h3 className="text-lg font-semibold text-text-primary">No cards match these filters</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Try broadening issuer, annual fee, or credit profile filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Clear filters
          </button>
        </section>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSortedCards.map((card) => {
            const selectedForCompare = selectedCompare.includes(card.slug);

            return (
              <article
                key={card.slug}
                className={`rounded-2xl border bg-bg-surface p-5 transition ${
                  selectedForCompare
                    ? 'border-brand-teal/45 shadow-[0_0_20px_rgba(45,212,191,0.1)]'
                    : 'border-white/10 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]'
                }`}
              >
                <p className="text-xs text-text-muted">{card.issuer}</p>
                <Link
                  href={`/cards/${card.slug}?src=cards_directory`}
                  className="mt-1 block text-base font-semibold text-text-primary transition hover:text-brand-teal"
                >
                  {card.name}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{card.headline}</p>
                <p className="mt-3 text-xs text-brand-gold">{formatBonusValue(card.bestSignUpBonusValue)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="capitalize">{card.rewardType}</span>
                  <span className="text-white/20">|</span>
                  <span>{card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}</span>
                  <span className="text-white/20">|</span>
                  <span>{formatCreditTier(card.creditTierMin)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {card.topCategories
                    .filter((value) => value !== 'all')
                    .slice(0, 3)
                    .map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2 py-0.5 text-[10px] text-brand-teal"
                      >
                        {formatCategory(value)}
                      </span>
                    ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/cards/${card.slug}?src=cards_directory`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    View details
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleCompare(card.slug)}
                    className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedForCompare
                        ? 'border-brand-teal/50 bg-brand-teal/15 text-brand-teal'
                        : 'border-white/10 text-text-secondary hover:border-brand-teal/40 hover:text-brand-teal'
                    }`}
                  >
                    {selectedForCompare ? 'Selected to compare' : 'Select to compare'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {learnArticles.length > 0 && (
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
      )}

      {selectedCompareCards.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-5">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-teal/40 bg-bg-elevated/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.45)] pointer-events-auto">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-text-muted">Compare</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedCompareCards.map((card) => (
                  <span
                    key={card.slug}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-text-secondary"
                  >
                    {card.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCompare([]);
                  setCompareError('');
                }}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Clear
              </button>
              {compareHref ? (
                <Link
                  href={compareHref}
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90"
                >
                  Compare selected cards
                </Link>
              ) : (
                <span className="text-xs text-text-muted">Select one more card to compare</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
