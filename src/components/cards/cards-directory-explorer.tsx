'use client';

import Link from 'next/link';
import type { CardRecord } from '@/lib/cards';
import type { LearnArticleCard } from '@/lib/learn-articles';
import { CardsDirectoryCompareBar } from '@/components/cards/cards-directory-compare-bar';
import { CardsDirectoryFilterPanel } from '@/components/cards/cards-directory-filter-panel';
import { CardsDirectoryLearnSection } from '@/components/cards/cards-directory-learn-section';
import { CardsDirectoryResults } from '@/components/cards/cards-directory-results';
import { useCardsDirectoryState } from '@/components/cards/use-cards-directory-state';

type CardsDirectoryExplorerProps = {
  cards: CardRecord[];
  learnArticles: LearnArticleCard[];
  initialSearchParams: string;
};

export function CardsDirectoryExplorer({
  cards,
  learnArticles,
  initialSearchParams
}: CardsDirectoryExplorerProps) {
  const {
    issuer,
    spendCategory,
    foreignFee,
    rewardType,
    cardType,
    sortBy,
    activeFilterCount,
    selectedCompare,
    compareError,
    issuerOptions,
    filteredSortedCards,
    selectedCompareCards,
    compareHref,
    setIssuer,
    setSpendCategory,
    setForeignFee,
    setRewardType,
    setCardType,
    setSortBy,
    clearFilters,
    clearCompare
  } = useCardsDirectoryState(cards, initialSearchParams);
  const noAnnualFeeCount = filteredSortedCards.filter((card) => card.annualFee === 0).length;
  const activeBonusCount = filteredSortedCards.filter(
    (card) => (card.bestSignUpBonusValue ?? 0) > 0
  ).length;

  return (
    <div>
      <CardsDirectoryFilterPanel
        totalCards={cards.length}
        filteredCardsCount={filteredSortedCards.length}
        noAnnualFeeCount={noAnnualFeeCount}
        activeBonusCount={activeBonusCount}
        activeFilterCount={activeFilterCount}
        issuer={issuer}
        spendCategory={spendCategory}
        foreignFee={foreignFee}
        rewardType={rewardType}
        cardType={cardType}
        sortBy={sortBy}
        issuerOptions={issuerOptions}
        onIssuerChange={setIssuer}
        onSpendCategoryChange={setSpendCategory}
        onForeignFeeChange={setForeignFee}
        onRewardTypeChange={setRewardType}
        onCardTypeChange={setCardType}
        onSortByChange={setSortBy}
        onClearFilters={clearFilters}
        preFilterContent={
          <div className="rounded-[1.45rem] border border-brand-teal/20 bg-[linear-gradient(135deg,rgba(12,27,32,0.9),rgba(11,16,24,0.95))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Compare Cards</p>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">
                  Pressure-test two cards before you build the plan
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Compare year-one value, ongoing value, credits, and welcome-offer difficulty side by side.
                  You can open the tool directly or select any two cards below and we will prefill the comparison.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={compareHref ?? '/cards/compare'}
                  className="inline-flex items-center rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {compareHref ? 'Compare selected cards' : 'Open compare tool'}
                </Link>
                <button
                  type="button"
                  onClick={clearCompare}
                  disabled={selectedCompare.length === 0}
                  className="inline-flex items-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear compare picks
                </button>
              </div>
            </div>
          </div>
        }
      />

      {compareError && <p className="mt-3 text-sm text-brand-coral">{compareError}</p>}

      <CardsDirectoryResults
        cards={filteredSortedCards}
        selectedCompare={selectedCompare}
      />

      <CardsDirectoryLearnSection learnArticles={learnArticles} />

      <CardsDirectoryCompareBar
        selectedCompareCards={selectedCompareCards}
        compareHref={compareHref}
        onClear={clearCompare}
      />
    </div>
  );
}
