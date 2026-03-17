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
    setBonusFilter,
    setMaxFee,
    setCardType,
    setSortBy,
    clearFilters,
    toggleCompare,
    clearCompare
  } = useCardsDirectoryState(cards);

  return (
    <div>
      <CardsDirectoryFilterPanel
        cardsCount={cards.length}
        filteredCount={filteredSortedCards.length}
        activeFilterCount={activeFilterCount}
        query={query}
        issuer={issuer}
        bonusFilter={bonusFilter}
        maxFee={maxFee}
        cardType={cardType}
        sortBy={sortBy}
        issuerOptions={issuerOptions}
        onQueryChange={setQuery}
        onIssuerChange={setIssuer}
        onBonusFilterChange={setBonusFilter}
        onMaxFeeChange={setMaxFee}
        onCardTypeChange={setCardType}
        onSortByChange={setSortBy}
        onReset={clearFilters}
      />

      {compareError && <p className="mt-3 text-sm text-brand-coral">{compareError}</p>}

      <CardsDirectoryResults
        cards={filteredSortedCards}
        selectedCompare={selectedCompare}
        onToggleCompare={toggleCompare}
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
