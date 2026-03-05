'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CardRecord } from '@/lib/cards';
import type { LearnArticleCard } from '@/lib/learn-articles';
import { issuerKey, normalizeIssuerLabel } from '@/lib/cards-directory';

type CardsDirectoryExplorerProps = {
  cards: CardRecord[];
  learnArticles: LearnArticleCard[];
};

type SortValue = 'highest_bonus' | 'bonus_minus_fee' | 'lowest_fee' | 'highest_rating';
type BonusFilterValue = 'any' | 'has_bonus' | '500' | '750' | '1000';
type FeeFilterValue = 'any' | '0' | '95' | '250' | '10000';
type CreditFilterValue = 'all' | CardRecord['creditTierMin'];
type CardTypeFilterValue = 'all' | CardRecord['cardType'];
type IssuerOption = { value: string; label: string; count: number };

const creditRank: Record<CardRecord['creditTierMin'], number> = {
  building: 1,
  fair: 2,
  good: 3,
  excellent: 4
};

const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'highest_bonus', label: 'Highest Welcome Value' },
  { value: 'bonus_minus_fee', label: 'Best Bonus Net of Fee' },
  { value: 'lowest_fee', label: 'Lowest Annual Fee' },
  { value: 'highest_rating', label: 'Highest Editor Rating' }
];

const bonusOptions: Array<{ value: BonusFilterValue; label: string }> = [
  { value: 'any', label: 'Any bonus status' },
  { value: 'has_bonus', label: 'Has active bonus' },
  { value: '500', label: '$500+ bonus value' },
  { value: '750', label: '$750+ bonus value' },
  { value: '1000', label: '$1,000+ bonus value' }
];

const feeOptions: Array<{ value: FeeFilterValue; label: string }> = [
  { value: 'any', label: 'Any fee' },
  { value: '0', label: 'No annual fee' },
  { value: '95', label: '$95 or less' },
  { value: '250', label: '$250 or less' },
  { value: '10000', label: '$250+' }
];

function formatCreditTier(value: CardRecord['creditTierMin']) {
  if (value === 'excellent') return 'Excellent';
  if (value === 'good') return 'Good+';
  if (value === 'fair') return 'Fair+';
  return 'Building';
}

function formatCardType(value: CardRecord['cardType']) {
  if (value === 'personal') return 'Personal';
  if (value === 'business') return 'Business';
  if (value === 'student') return 'Student';
  return 'Secured';
}

function formatBonusValue(value?: number) {
  if (!value || value <= 0) return 'No active bonus listed';
  return `Welcome est. $${Math.round(value).toLocaleString()}`;
}

function formatSpendRequirement(card: CardRecord) {
  const spend = card.bestSignUpBonusSpendRequired ?? null;
  const days = card.bestSignUpBonusSpendPeriodDays ?? null;
  if (!spend || !days) return null;
  const months = Math.max(1, Math.round(days / 30));
  return `Spend $${Math.round(spend).toLocaleString()} in ${months} mo`;
}

function lower(value: string) {
  return value.trim().toLowerCase();
}

function isSortValue(value: string | null): value is SortValue {
  return (
    value === 'highest_bonus' ||
    value === 'bonus_minus_fee' ||
    value === 'lowest_fee' ||
    value === 'highest_rating'
  );
}

function isBonusFilterValue(value: string | null): value is BonusFilterValue {
  return (
    value === 'any' || value === 'has_bonus' || value === '500' || value === '750' || value === '1000'
  );
}

function isFeeFilterValue(value: string | null): value is FeeFilterValue {
  return (
    value === 'any' || value === '0' || value === '95' || value === '250' || value === '10000'
  );
}

function isCreditFilterValue(value: string | null): value is CreditFilterValue {
  return (
    value === 'all' ||
    value === 'excellent' ||
    value === 'good' ||
    value === 'fair' ||
    value === 'building'
  );
}

function isCardTypeFilterValue(value: string | null): value is CardTypeFilterValue {
  return (
    value === 'all' ||
    value === 'personal' ||
    value === 'business' ||
    value === 'student' ||
    value === 'secured'
  );
}

export function CardsDirectoryExplorer({ cards, learnArticles }: CardsDirectoryExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedFromUrl = useRef(false);

  const [query, setQuery] = useState('');
  const [issuer, setIssuer] = useState('all');
  const [bonusFilter, setBonusFilter] = useState<BonusFilterValue>('any');
  const [maxFee, setMaxFee] = useState<FeeFilterValue>('any');
  const [creditProfile, setCreditProfile] = useState<CreditFilterValue>('all');
  const [cardType, setCardType] = useState<CardTypeFilterValue>('all');
  const [sortBy, setSortBy] = useState<SortValue>('highest_bonus');
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');

  const issuerOptions = useMemo<IssuerOption[]>(() => {
    const byIssuer = new Map<string, IssuerOption>();
    for (const card of cards) {
      const value = issuerKey(card.issuer);
      const label = normalizeIssuerLabel(card.issuer);
      const existing = byIssuer.get(value);
      if (existing) {
        existing.count += 1;
      } else {
        byIssuer.set(value, { value, label, count: 1 });
      }
    }
    return Array.from(byIssuer.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [cards]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const queryFromUrl = params.get('q') ?? '';
    const issuerFromUrl = params.get('issuer');
    const bonusFromUrl = params.get('bonus');
    const feeFromUrl = params.get('fee');
    const creditFromUrl = params.get('credit');
    const typeFromUrl = params.get('type');
    const sortFromUrl = params.get('sort');

    const issuerValueFromUrl = issuerFromUrl ? issuerKey(issuerFromUrl) : null;
    const validIssuerValues = new Set(issuerOptions.map((option) => option.value));

    setQuery(queryFromUrl);
    setIssuer(
      issuerValueFromUrl && validIssuerValues.has(issuerValueFromUrl) ? issuerValueFromUrl : 'all'
    );
    setBonusFilter(isBonusFilterValue(bonusFromUrl) ? bonusFromUrl : 'any');
    setMaxFee(isFeeFilterValue(feeFromUrl) ? feeFromUrl : 'any');
    setCreditProfile(isCreditFilterValue(creditFromUrl) ? creditFromUrl : 'all');
    setCardType(isCardTypeFilterValue(typeFromUrl) ? typeFromUrl : 'all');
    setSortBy(isSortValue(sortFromUrl) ? sortFromUrl : 'highest_bonus');

    hasHydratedFromUrl.current = true;
  }, [issuerOptions, searchParams]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());

    const normalizedQuery = query.trim();
    if (normalizedQuery) params.set('q', normalizedQuery);
    else params.delete('q');

    if (issuer !== 'all') params.set('issuer', issuer);
    else params.delete('issuer');

    if (bonusFilter !== 'any') params.set('bonus', bonusFilter);
    else params.delete('bonus');

    if (maxFee !== 'any') params.set('fee', maxFee);
    else params.delete('fee');

    if (creditProfile !== 'all') params.set('credit', creditProfile);
    else params.delete('credit');

    if (cardType !== 'all') params.set('type', cardType);
    else params.delete('type');

    if (sortBy !== 'highest_bonus') params.set('sort', sortBy);
    else params.delete('sort');

    const currentQueryString = searchParams.toString();
    const nextQueryString = params.toString();
    if (nextQueryString === currentQueryString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [
    bonusFilter,
    cardType,
    creditProfile,
    issuer,
    maxFee,
    pathname,
    query,
    router,
    searchParams,
    sortBy
  ]);

  const filteredSortedCards = useMemo(() => {
    const queryLower = lower(query);
    const hasQuery = queryLower.length > 0;

    const filtered = cards.filter((card) => {
      if (hasQuery) {
        const searchable = lower(
          `${card.name} ${card.issuer} ${card.headline} ${card.cardType} ${card.creditTierMin}`
        );
        if (!searchable.includes(queryLower)) return false;
      }

      if (issuer !== 'all' && issuerKey(card.issuer) !== issuer) return false;
      if (cardType !== 'all' && card.cardType !== cardType) return false;

      const bonusValue = card.bestSignUpBonusValue ?? 0;
      if (bonusFilter === 'has_bonus' && bonusValue <= 0) return false;
      if (bonusFilter === '500' && bonusValue < 500) return false;
      if (bonusFilter === '750' && bonusValue < 750) return false;
      if (bonusFilter === '1000' && bonusValue < 1000) return false;

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
      const bonusDiff = (b.bestSignUpBonusValue ?? 0) - (a.bestSignUpBonusValue ?? 0);
      if (sortBy === 'highest_bonus' && bonusDiff !== 0) return bonusDiff;

      if (sortBy === 'bonus_minus_fee') {
        const netDiff =
          (b.bestSignUpBonusValue ?? 0) -
          b.annualFee -
          ((a.bestSignUpBonusValue ?? 0) - a.annualFee);
        if (netDiff !== 0) return netDiff;
      }

      if (sortBy === 'lowest_fee') {
        const feeDiff = a.annualFee - b.annualFee;
        if (feeDiff !== 0) return feeDiff;
      }

      if (sortBy === 'highest_rating') {
        const ratingDiff = (b.editorRating ?? 0) - (a.editorRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
      }

      if (bonusDiff !== 0) return bonusDiff;
      const issuerDiff = normalizeIssuerLabel(a.issuer).localeCompare(normalizeIssuerLabel(b.issuer));
      if (issuerDiff !== 0) return issuerDiff;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [bonusFilter, cardType, cards, creditProfile, issuer, maxFee, query, sortBy]);

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
    bonusFilter !== 'any',
    maxFee !== 'any',
    creditProfile !== 'all',
    cardType !== 'all'
  ].filter(Boolean).length;

  function clearFilters() {
    setQuery('');
    setIssuer('all');
    setBonusFilter('any');
    setMaxFee('any');
    setCreditProfile('all');
    setCardType('all');
    setSortBy('highest_bonus');
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
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sign-Up Bonus</span>
            <select
              value={bonusFilter}
              onChange={(event) => setBonusFilter(event.target.value as BonusFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {bonusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Card Type</span>
            <select
              value={cardType}
              onChange={(event) => setCardType(event.target.value as CardTypeFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="all">All card types</option>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="student">Student</option>
              <option value="secured">Secured</option>
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
            {activeFilterCount > 0
              ? ` with ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`
              : ''}
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
            Try broadening issuer, bonus threshold, annual fee, or credit profile filters.
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
                <p className="text-xs text-text-muted">{normalizeIssuerLabel(card.issuer)}</p>
                <Link
                  href={`/cards/${card.slug}?src=cards_directory`}
                  className="mt-1 block text-base font-semibold text-text-primary transition hover:text-brand-teal"
                >
                  {card.name}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{card.headline}</p>
                <p className="mt-3 text-xs font-semibold text-brand-gold">
                  {formatBonusValue(card.bestSignUpBonusValue)}
                </p>
                {formatSpendRequirement(card) && (
                  <p className="mt-1 text-xs text-text-muted">{formatSpendRequirement(card)}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span>{formatCardType(card.cardType)}</span>
                  <span className="text-white/20">|</span>
                  <span>{card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}</span>
                  <span className="text-white/20">|</span>
                  <span>{formatCreditTier(card.creditTierMin)}</span>
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
          <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-teal/40 bg-bg-elevated/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
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
