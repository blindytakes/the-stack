'use client';

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
    sortBy,
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
    setSortBy,
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
        issuer={issuer}
        spendCategory={spendCategory}
        foreignFee={foreignFee}
        rewardType={rewardType}
        sortBy={sortBy}
        issuerOptions={issuerOptions}
        onIssuerChange={setIssuer}
        onSpendCategoryChange={setSpendCategory}
        onForeignFeeChange={setForeignFee}
        onRewardTypeChange={setRewardType}
        onSortByChange={setSortBy}
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
