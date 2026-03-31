'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  rewardTypeOptions,
  spendCategoryOptions,
  sortOptions,
  type ForeignFeeFilterValue,
  type IssuerOption,
  type RewardTypeFilterValue,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';

type CardsDirectoryFilterPanelProps = {
  totalCards: number;
  filteredCardsCount: number;
  noAnnualFeeCount: number;
  activeBonusCount: number;
  activeFilterCount: number;
  issuer: string;
  spendCategory: SpendCategoryFilterValue;
  foreignFee: ForeignFeeFilterValue;
  rewardType: RewardTypeFilterValue;
  sortBy: SortValue;
  issuerOptions: IssuerOption[];
  eyebrowLabel?: string;
  title?: string;
  description?: string;
  onIssuerChange: (value: string) => void;
  onSpendCategoryChange: (value: SpendCategoryFilterValue) => void;
  onForeignFeeChange: (value: ForeignFeeFilterValue) => void;
  onRewardTypeChange: (value: RewardTypeFilterValue) => void;
  onSortByChange: (value: SortValue) => void;
  onClearFilters: () => void;
};

export function CardsDirectoryFilterPanel({
  totalCards,
  filteredCardsCount,
  noAnnualFeeCount,
  activeBonusCount,
  activeFilterCount,
  issuer,
  spendCategory,
  foreignFee,
  rewardType,
  sortBy,
  issuerOptions,
  eyebrowLabel = 'Card Directory',
  title = 'Find the Best Credit Card Bonus for your plan.',
  description = 'When you find a card you like, The Stack builds your bonus plan around it.',
  onIssuerChange,
  onSpendCategoryChange,
  onForeignFeeChange,
  onRewardTypeChange,
  onSortByChange,
  onClearFilters
}: CardsDirectoryFilterPanelProps) {
  type SortControlValue = SortValue | 'no_international_fee';
  const prefersReducedMotion = useReducedMotion();
  const sortControlValue: SortControlValue =
    foreignFee === '0' ? 'no_international_fee' : sortBy;
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
      value: filteredCardsCount.toLocaleString(),
      context: `of ${totalCards}`,
      description: 'Cards in the current view.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: totalCards > 0 ? (filteredCardsCount / totalCards) * 100 : 0
    },
    {
      label: 'No Annual Fee',
      value: noAnnualFeeCount.toLocaleString(),
      context: `of ${filteredCardsCount}`,
      description: 'Lower-commitment keepers in this view.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: filteredCardsCount > 0 ? (noAnnualFeeCount / filteredCardsCount) * 100 : 0
    },
    {
      label: 'Bonus-Ready',
      value: activeBonusCount.toLocaleString(),
      context: `of ${filteredCardsCount}`,
      description: 'Cards with active welcome value in this view.',
      valueClassName: 'text-white',
      barClassName: 'bg-emerald-400/80',
      percent: filteredCardsCount > 0 ? (activeBonusCount / filteredCardsCount) * 100 : 0
    }
  ] as const;

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

      <div className="mt-5 grid gap-3 md:grid-cols-2">
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
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Sort
          </span>
          <select
            value={sortControlValue}
            onChange={(event) => {
              const value = event.target.value as SortControlValue;

              if (value === 'no_international_fee') {
                onForeignFeeChange('0');
                onSortByChange('highest_bonus');
                return;
              }

              onForeignFeeChange('any');
              onSortByChange(value);
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="no_international_fee">No International Fee</option>
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-bg-elevated/65 p-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
            className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
              activeFilterCount > 0
                ? 'border border-brand-coral/25 bg-brand-coral/10 text-brand-coral hover:border-brand-coral/45 hover:bg-brand-coral/15'
                : 'cursor-not-allowed border border-white/5 bg-bg/40 text-text-muted'
            }`}
          >
            Clear Filters
          </button>
          {rewardTypeOptions.map((option) => {
            const isActive = rewardType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSpendCategoryChange('any');
                  onRewardTypeChange(option.value);
                }}
                className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? 'border border-brand-teal/30 bg-brand-teal text-black'
                    : 'border border-white/10 bg-bg text-text-secondary hover:border-brand-teal/35 hover:text-brand-teal'
                }`}
              >
                {option.label}
              </button>
            );
          })}
          {spendCategoryOptions.slice(1).map((option) => {
            const isActive = rewardType === 'any' && spendCategory === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onRewardTypeChange('any');
                  onSpendCategoryChange(option.value);
                }}
                className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
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

    </section>
  );
}
