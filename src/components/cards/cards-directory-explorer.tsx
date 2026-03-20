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
};

export function CardsDirectoryExplorer({ cards, learnArticles }: CardsDirectoryExplorerProps) {
  const {
    query,
    issuer,
    spendCategory,
    bonusFilter,
    maxFee,
    cardType,
    sortBy,
    selectedCompare,
    compareError,
    issuerOptions,
    filteredSortedCards,
    selectedCompareCards,
    compareHref,
    activeFilterCount,
    setQuery,
    setIssuer,
    setSpendCategory,
    setBonusFilter,
    setMaxFee,
    setCardType,
    setSortBy,
    clearFilters,
    clearCompare
  } = useCardsDirectoryState(cards);
  const noAnnualFeeCount = cards.filter((card) => card.annualFee === 0).length;
  const activeBonusCount = cards.filter((card) => (card.bestSignUpBonusValue ?? 0) > 0).length;

  return (
    <div>
      <CardsDirectoryFilterPanel
        activeFilterCount={activeFilterCount}
        totalCards={cards.length}
        filteredCardsCount={filteredSortedCards.length}
        noAnnualFeeCount={noAnnualFeeCount}
        activeBonusCount={activeBonusCount}
        query={query}
        issuer={issuer}
        spendCategory={spendCategory}
        bonusFilter={bonusFilter}
        maxFee={maxFee}
        cardType={cardType}
        sortBy={sortBy}
        issuerOptions={issuerOptions}
        onQueryChange={setQuery}
        onIssuerChange={setIssuer}
        onSpendCategoryChange={setSpendCategory}
        onBonusFilterChange={setBonusFilter}
        onMaxFeeChange={setMaxFee}
        onCardTypeChange={setCardType}
        onSortByChange={setSortBy}
        onReset={clearFilters}
      />

      {compareError && <p className="mt-3 text-sm text-brand-coral">{compareError}</p>}

      <CardsDirectoryResults
        cards={filteredSortedCards}
        totalCards={cards.length}
        activeFilterCount={activeFilterCount}
        selectedCompare={selectedCompare}
        onClearFilters={clearFilters}
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
