'use client';

import { useEffect, useState } from 'react';
import { usStateOptions } from '@/lib/us-state-options';
import {
  accountTypeOptions,
  bankingSortOptions,
  cashRequirementOptions,
  directDepositOptions,
  difficultyOptions,
  stateLimitedOptions,
  timelineOptions,
  type AccountTypeFilterValue,
  type BankingActiveFilterChip,
  type CashRequirementFilterValue,
  type DifficultyFilterValue,
  type DirectDepositFilterValue,
  type StateLimitedFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';
import type { BankingBonusesSort } from '@/lib/banking-bonuses';

type BankingDirectoryFilterPanelProps = {
  activeFilterCount: number;
  activeFilterChips: BankingActiveFilterChip[];
  query: string;
  accountType: AccountTypeFilterValue;
  directDeposit: DirectDepositFilterValue;
  difficulty: DifficultyFilterValue;
  cashRequirement: CashRequirementFilterValue;
  timeline: TimelineFilterValue;
  stateLimited: StateLimitedFilterValue;
  state: string;
  sortBy: BankingBonusesSort;
  onQueryChange: (value: string) => void;
  onAccountTypeChange: (value: AccountTypeFilterValue) => void;
  onDirectDepositChange: (value: DirectDepositFilterValue) => void;
  onDifficultyChange: (value: DifficultyFilterValue) => void;
  onCashRequirementChange: (value: CashRequirementFilterValue) => void;
  onTimelineChange: (value: TimelineFilterValue) => void;
  onStateLimitedChange: (value: StateLimitedFilterValue) => void;
  onStateChange: (value: string) => void;
  onSortByChange: (value: BankingBonusesSort) => void;
  onRemoveFilter: (key: BankingActiveFilterChip['key']) => void;
  onReset: () => void;
};

export function BankingDirectoryFilterPanel({
  activeFilterCount,
  activeFilterChips,
  query,
  accountType,
  directDeposit,
  difficulty,
  cashRequirement,
  timeline,
  stateLimited,
  state,
  sortBy,
  onQueryChange,
  onAccountTypeChange,
  onDirectDepositChange,
  onDifficultyChange,
  onCashRequirementChange,
  onTimelineChange,
  onStateLimitedChange,
  onStateChange,
  onSortByChange,
  onRemoveFilter,
  onReset
}: BankingDirectoryFilterPanelProps) {
  const advancedFilterCount = [
    difficulty !== 'any',
    cashRequirement !== 'any',
    timeline !== 'any',
    stateLimited !== 'any',
    state.length > 0
  ].filter(Boolean).length;
  const [showMore, setShowMore] = useState(advancedFilterCount > 0);

  useEffect(() => {
    if (advancedFilterCount > 0) setShowMore(true);
  }, [advancedFilterCount]);

  return (
    <section className="rounded-2xl border border-white/10 bg-bg-surface p-4 md:p-5">
      <div className="max-w-[44rem]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">Banking Bonuses</p>
        <h1 className="mt-2 font-heading text-[2.85rem] leading-[0.94] text-text-primary md:text-[3.35rem]">
          Bank bonus offers you can actually finish.
        </h1>
        <p className="mt-2.5 max-w-[38rem] text-[15px] leading-7 text-text-secondary">
          Browse top bank bonus offers, then let The Stack turn them into a workable plan.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search bank or offer..."
        className="mt-4 w-full rounded-xl border border-white/10 bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none"
      />

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Account Type</span>
          <select
            value={accountType}
            onChange={(event) => onAccountTypeChange(event.target.value as AccountTypeFilterValue)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {accountTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Direct Deposit</span>
          <select
            value={directDeposit}
            onChange={(event) => onDirectDepositChange(event.target.value as DirectDepositFilterValue)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {directDepositOptions.map((option) => (
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
            onChange={(event) => onSortByChange(event.target.value as BankingBonusesSort)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {bankingSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showMore && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Cash Needed</span>
            <select
              value={cashRequirement}
              onChange={(event) =>
                onCashRequirementChange(event.target.value as CashRequirementFilterValue)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {cashRequirementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Timeline</span>
            <select
              value={timeline}
              onChange={(event) => onTimelineChange(event.target.value as TimelineFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {timelineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => onDifficultyChange(event.target.value as DifficultyFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Availability</span>
            <select
              value={stateLimited}
              onChange={(event) => onStateLimitedChange(event.target.value as StateLimitedFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {stateLimitedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Your State</span>
            <select
              value={state}
              onChange={(event) => onStateChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              <option value="">All states</option>
              {usStateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {activeFilterChips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.label}`}
              type="button"
              onClick={() => onRemoveFilter(chip.key)}
              className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1.5 text-xs text-brand-teal transition hover:border-brand-teal/40 hover:bg-brand-teal/15"
              aria-label={`Remove ${chip.label} filter`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true" className="text-sm leading-none">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-teal/40 hover:text-brand-teal"
        >
          {showMore ? 'Fewer filters' : 'More filters'}
          {!showMore && advancedFilterCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-teal/20 text-[10px] font-bold text-brand-teal">
              {advancedFilterCount}
            </span>
          )}
        </button>

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
