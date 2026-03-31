'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usStateOptions } from '@/lib/us-state-options';
import {
  accountTypeOptions,
  apyOptions,
  bankingSortOptions,
  cashRequirementOptions,
  customerTypeOptions,
  directDepositOptions,
  difficultyOptions,
  stateLimitedOptions,
  timelineOptions,
  type AccountTypeFilterValue,
  type ApyFilterValue,
  type BankingActiveFilterChip,
  type CashRequirementFilterValue,
  type CustomerTypeFilterValue,
  type DifficultyFilterValue,
  type DirectDepositFilterValue,
  type StateLimitedFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';
import type { BankingBonusesSort } from '@/lib/banking-bonuses';

type BankingDirectoryFilterPanelProps = {
  activeFilterCount: number;
  activeFilterChips: BankingActiveFilterChip[];
  totalOffers: number;
  filteredOffersCount: number;
  noDirectDepositCount: number;
  numericApyCount: number;
  accountType: AccountTypeFilterValue;
  customerType: CustomerTypeFilterValue;
  directDeposit: DirectDepositFilterValue;
  apy: ApyFilterValue;
  difficulty: DifficultyFilterValue;
  cashRequirement: CashRequirementFilterValue;
  timeline: TimelineFilterValue;
  stateLimited: StateLimitedFilterValue;
  state: string;
  sortBy: BankingBonusesSort;
  eyebrowLabel?: string;
  title?: string;
  description?: string;
  showCustomerTypeFilter?: boolean;
  onAccountTypeChange: (value: AccountTypeFilterValue) => void;
  onCustomerTypeChange: (value: CustomerTypeFilterValue) => void;
  onDirectDepositChange: (value: DirectDepositFilterValue) => void;
  onApyChange: (value: ApyFilterValue) => void;
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
  totalOffers,
  filteredOffersCount,
  noDirectDepositCount,
  numericApyCount,
  accountType,
  customerType,
  directDeposit,
  apy,
  difficulty,
  cashRequirement,
  timeline,
  stateLimited,
  state,
  sortBy,
  eyebrowLabel = 'Banking Bonuses',
  title = 'Find the right bank bonus for you.',
  description = 'Compare personal and business bank bonuses in one place, then let The Stack build your bonus plan around the offer that fits.',
  showCustomerTypeFilter = true,
  onAccountTypeChange,
  onCustomerTypeChange,
  onDirectDepositChange,
  onApyChange,
  onDifficultyChange,
  onCashRequirementChange,
  onTimelineChange,
  onStateLimitedChange,
  onStateChange,
  onSortByChange,
  onRemoveFilter,
  onReset
}: BankingDirectoryFilterPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const advancedFilterCount = [
    accountType !== 'all',
    showCustomerTypeFilter && customerType !== 'all',
    difficulty !== 'any',
    cashRequirement !== 'any',
    timeline !== 'any',
    stateLimited !== 'any',
    state.length > 0
  ].filter(Boolean).length;
  const [showMore, setShowMore] = useState(advancedFilterCount > 0);
  const introShellTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const };
  const statGridVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.07
      }
    }
  };
  const statCardVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.985 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }
    }
  };
  const summaryCards = [
    {
      label: 'Showing',
      value: filteredOffersCount.toLocaleString(),
      context: `of ${totalOffers}`,
      description: 'Offers in the current view.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: totalOffers > 0 ? (filteredOffersCount / totalOffers) * 100 : 0
    },
    {
      label: 'No Direct Deposit',
      value: noDirectDepositCount.toLocaleString(),
      context: totalOffers > 0 ? `${Math.round((noDirectDepositCount / totalOffers) * 100)}%` : '0%',
      description: 'Lower-friction keepers.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: totalOffers > 0 ? (noDirectDepositCount / totalOffers) * 100 : 0
    },
    {
      label: 'Filterable APY',
      value: numericApyCount.toLocaleString(),
      context: totalOffers > 0 ? `${Math.round((numericApyCount / totalOffers) * 100)}%` : '0%',
      description: 'Offers with APY data attached.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: totalOffers > 0 ? (numericApyCount / totalOffers) * 100 : 0
    }
  ] as const;

  useEffect(() => {
    if (advancedFilterCount > 0) setShowMore(true);
  }, [advancedFilterCount]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,32,0.96),rgba(12,13,22,0.98))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)] md:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_26%),radial-gradient(circle_at_85%_18%,rgba(212,168,83,0.12),transparent_18%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]"
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introShellTransition}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(125deg,rgba(36,76,81,0.46),rgba(31,33,49,0.94)_38%,rgba(19,20,32,0.98)_100%)] p-5 md:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(45,212,191,0.08),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.04),transparent_28%)]"
        />
        <div className="relative">
          <div className="max-w-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-[0.32em] text-brand-gold">
                {eyebrowLabel}
              </span>
            </div>
            <h1 className="mt-4 w-full font-heading text-[clamp(2.15rem,2.9vw,3.35rem)] leading-[1] tracking-[-0.035em] text-white md:whitespace-nowrap">
              {title}
            </h1>
            <p className="mt-4 w-full text-xl leading-8 text-text-secondary md:text-2xl md:leading-9">
              {description}
            </p>
          </div>

          <motion.div
            className="mt-6 grid gap-3 md:grid-cols-3"
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            variants={statGridVariants}
          >
            {summaryCards.map((card) => (
              <motion.div
                key={card.label}
                variants={statCardVariants}
                className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.78),rgba(12,13,22,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-text-muted">
                      {card.label}
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className={`text-3xl font-semibold leading-none ${card.valueClassName}`}>
                        {card.value}
                      </p>
                      <p className="pb-0.5 text-base text-text-muted">{card.context}</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    {Math.round(card.percent)}%
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                  <div
                    className={`h-full rounded-full ${card.barClassName}`}
                    style={{ width: `${card.percent > 0 ? Math.max(card.percent, 8) : 0}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-bg-elevated/65 p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Direct Deposit
            </span>
            <select
              value={directDeposit}
              onChange={(event) =>
                onDirectDepositChange(event.target.value as DirectDepositFilterValue)
              }
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">APY</span>
            <select
              value={apy}
              onChange={(event) => onApyChange(event.target.value as ApyFilterValue)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
            >
              {apyOptions.map((option) => (
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
      </div>

      {showMore && (
        <div
          className={`mt-3 grid gap-3 md:grid-cols-2 ${
            showCustomerTypeFilter ? 'xl:grid-cols-7' : 'xl:grid-cols-6'
          }`}
        >
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Account Type
            </span>
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

          {showCustomerTypeFilter && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Customer Type
              </span>
              <select
                value={customerType}
                onChange={(event) =>
                  onCustomerTypeChange(event.target.value as CustomerTypeFilterValue)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
              >
                {customerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Cash Needed
            </span>
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Difficulty
            </span>
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Availability
            </span>
            <select
              value={stateLimited}
              onChange={(event) =>
                onStateLimitedChange(event.target.value as StateLimitedFilterValue)
              }
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Your State
            </span>
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
