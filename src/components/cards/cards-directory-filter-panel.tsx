'use client';

import { useEffect, useState } from 'react';
import {
  bonusOptions,
  cardTypeOptions,
  feeOptions,
  spendCategoryOptions,
  sortOptions,
  type BonusFilterValue,
  type CardTypeFilterValue,
  type FeeFilterValue,
  type IssuerOption,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';

type CardsDirectoryFilterPanelProps = {
  activeFilterCount: number;
  totalCards: number;
  filteredCardsCount: number;
  noAnnualFeeCount: number;
  activeBonusCount: number;
  query: string;
  issuer: string;
  spendCategory: SpendCategoryFilterValue;
  bonusFilter: BonusFilterValue;
  maxFee: FeeFilterValue;
  cardType: CardTypeFilterValue;
  sortBy: SortValue;
  issuerOptions: IssuerOption[];
  onQueryChange: (value: string) => void;
  onIssuerChange: (value: string) => void;
  onSpendCategoryChange: (value: SpendCategoryFilterValue) => void;
  onBonusFilterChange: (value: BonusFilterValue) => void;
  onMaxFeeChange: (value: FeeFilterValue) => void;
  onCardTypeChange: (value: CardTypeFilterValue) => void;
  onSortByChange: (value: SortValue) => void;
  onReset: () => void;
};

export function CardsDirectoryFilterPanel({
  activeFilterCount,
  totalCards,
  filteredCardsCount,
  noAnnualFeeCount,
  activeBonusCount,
  query,
  issuer,
  spendCategory,
  bonusFilter,
  maxFee,
  cardType,
  sortBy,
  issuerOptions,
  onQueryChange,
  onIssuerChange,
  onSpendCategoryChange,
  onBonusFilterChange,
  onMaxFeeChange,
  onCardTypeChange,
  onSortByChange,
  onReset
}: CardsDirectoryFilterPanelProps) {
  const moreFilterCount = [bonusFilter !== 'any', maxFee !== 'any', cardType !== 'all'].filter(
    Boolean
  ).length;
  const [showMore, setShowMore] = useState(moreFilterCount > 0);

  useEffect(() => {
    if (moreFilterCount > 0) setShowMore(true);
  }, [moreFilterCount]);

  return (
    <section className="rounded-2xl border border-white/10 bg-bg-surface p-4 md:p-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
          <div className="max-w-[46rem]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">Card Directory</p>
            <h1 className="mt-2 font-heading text-[2.6rem] leading-[0.94] text-text-primary md:text-[3.2rem]">
              Find the card that matches how you actually spend.
            </h1>
            <p className="mt-3 max-w-[39rem] text-[15px] leading-7 text-text-secondary">
              Compare welcome value, annual fee, issuer, and best spend fit without opening a dozen
              tabs. Filter for grocery, travel, gas, dining, or general-spend cards first, then
              drill down.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Welcome bonus value',
                'Annual fee exposure',
                'Best spend categories',
                'Issuer and card type'
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-bg/50 px-3 py-1 text-xs text-text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-bg/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Showing</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {filteredCardsCount}
                <span className="ml-1 text-base font-medium text-text-muted">of {totalCards}</span>
              </p>
              <p className="mt-1 text-xs text-text-muted">Cards in the current view.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">No Annual Fee</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{noAnnualFeeCount}</p>
              <p className="mt-1 text-xs text-text-muted">Cards you can keep with less friction.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Bonus-Ready</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{activeBonusCount}</p>
              <p className="mt-1 text-xs text-text-muted">Cards with active welcome value in data.</p>
            </div>
          </div>
        </div>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search card, issuer, perk, or reward style..."
        className="mt-4 w-full rounded-xl border border-white/10 bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none"
      />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Issuer</span>
          <select
            value={issuer}
            onChange={(event) => onIssuerChange(event.target.value)}
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
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortValue)}
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

      <div className="mt-4 rounded-2xl border border-white/10 bg-bg-elevated/65 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Spend Fit</p>
            <p className="mt-1 text-sm text-text-secondary">
              Start with where most of your monthly spend goes.
            </p>
          </div>
          {spendCategory !== 'any' && (
            <button
              type="button"
              onClick={() => onSpendCategoryChange('any')}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
            >
              Clear spend filter
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {spendCategoryOptions.map((option) => {
            const isActive = spendCategory === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSpendCategoryChange(option.value)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border border-brand-teal/30 bg-brand-teal text-black'
                    : 'border border-white/10 bg-bg text-text-secondary hover:border-brand-teal/35 hover:text-brand-teal'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {showMore && (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Sign-Up Bonus
            </span>
            <select
              value={bonusFilter}
              onChange={(event) => onBonusFilterChange(event.target.value as BonusFilterValue)}
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Annual Fee
            </span>
            <select
              value={maxFee}
              onChange={(event) => onMaxFeeChange(event.target.value as FeeFilterValue)}
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Card Type
            </span>
            <select
              value={cardType}
              onChange={(event) => onCardTypeChange(event.target.value as CardTypeFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {cardTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Footer: count · more filters · reset */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
          >
            {showMore ? 'Fewer filters' : 'More filters'}
            {!showMore && moreFilterCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-teal/20 text-[10px] font-bold text-brand-teal">
                {moreFilterCount}
              </span>
            )}
          </button>
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Reset filters
          </button>
        )}
      </div>
    </section>
  );
}
