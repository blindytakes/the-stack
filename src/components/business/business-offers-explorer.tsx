'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BankingDirectoryFilterPanel } from '@/components/banking/banking-directory-filter-panel';
import { BankingDirectoryResults } from '@/components/banking/banking-directory-results';
import { useBankingDirectoryState } from '@/components/banking/use-banking-directory-state';
import { CardsDirectoryFilterPanel } from '@/components/cards/cards-directory-filter-panel';
import { CardsDirectoryResults } from '@/components/cards/cards-directory-results';
import { useCardsDirectoryState } from '@/components/cards/use-cards-directory-state';
import type { BankingBonusListItem } from '@/lib/banking-bonuses';
import {
  buildActiveBankingFilterChips,
  buildBankingDirectorySearchParams,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  parseBankingDirectoryFilters,
  type BankingDirectoryFilters,
  type CustomerTypeFilterValue,
} from '@/lib/banking-directory-explorer';
import type { CardRecord } from '@/lib/cards';
import {
  buildCardsDirectorySearchParams,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  parseCardsDirectoryFilters,
  type CardsDirectoryFilters,
  type CardTypeFilterValue,
} from '@/lib/cards-directory-explorer';

type BusinessOffersExplorerProps = {
  businessCards: CardRecord[];
  businessOffers: BankingBonusListItem[];
  initialSearchParams: string;
};

type BusinessBrowseView = 'cards' | 'banking';

function isBusinessBrowseView(value: string | null): value is BusinessBrowseView {
  return value === 'cards' || value === 'banking';
}

function getBusinessBrowseView(value: string | null): BusinessBrowseView {
  return isBusinessBrowseView(value) ? value : 'cards';
}

const businessCardsPageCardType: CardTypeFilterValue = 'business';
const businessBankingPageCustomerType: CustomerTypeFilterValue = 'business';
const defaultBusinessCardsDirectoryFilters: CardsDirectoryFilters = {
  ...defaultCardsDirectoryFilters,
  cardType: businessCardsPageCardType
};
const defaultBusinessBankingDirectoryFilters: BankingDirectoryFilters = {
  ...defaultBankingDirectoryFilters,
  customerType: businessBankingPageCustomerType
};
const cardsDirectoryQueryParamKeys = ['issuer', 'spend', 'intl', 'reward', 'bonus', 'fee', 'type', 'sort'];
const bankingDirectoryQueryParamKeys = [
  'accountType',
  'customerType',
  'directDeposit',
  'apy',
  'difficulty',
  'cash',
  'timeline',
  'stateLimited',
  'state',
  'sort'
] as const;

function deleteQueryParams(params: URLSearchParams, keys: readonly string[]) {
  for (const key of keys) {
    params.delete(key);
  }
}

function buildBusinessCardsSearchParams(
  currentSearchParams: URLSearchParams,
  filters: CardsDirectoryFilters
) {
  const params = new URLSearchParams(currentSearchParams);

  deleteQueryParams(params, bankingDirectoryQueryParamKeys);
  params.delete('view');
  params.delete('bank');

  const nextParams = buildCardsDirectorySearchParams(params, filters);
  nextParams.delete('type');

  return nextParams;
}

function buildBusinessBankingSearchParams(
  currentSearchParams: URLSearchParams,
  filters: BankingDirectoryFilters
) {
  const params = new URLSearchParams(currentSearchParams);

  deleteQueryParams(params, cardsDirectoryQueryParamKeys);
  params.set('view', 'banking');
  params.delete('card');

  const nextParams = buildBankingDirectorySearchParams(params, filters);
  nextParams.delete('customerType');

  return nextParams;
}

function parseBusinessCardsDirectoryFilters(
  searchParams: URLSearchParams,
  issuerOptions: ReturnType<typeof buildIssuerOptions>
) {
  return {
    ...parseCardsDirectoryFilters(searchParams, issuerOptions),
    cardType: businessCardsPageCardType
  };
}

function countBusinessCardFilters(filters: CardsDirectoryFilters) {
  return countActiveCardsDirectoryFilters({
    ...filters,
    cardType: defaultCardsDirectoryFilters.cardType
  });
}

function parseBusinessBankingDirectoryFilters(searchParams: URLSearchParams) {
  return {
    ...parseBankingDirectoryFilters(searchParams),
    customerType: businessBankingPageCustomerType
  };
}

function countBusinessBankingFilters(filters: BankingDirectoryFilters) {
  return countActiveBankingDirectoryFilters({
    ...filters,
    customerType: defaultBankingDirectoryFilters.customerType
  });
}

function buildBusinessBankingFilterChips(filters: BankingDirectoryFilters) {
  return buildActiveBankingFilterChips({
    ...filters,
    customerType: defaultBankingDirectoryFilters.customerType
  });
}

export function BusinessOffersExplorer({
  businessCards,
  businessOffers,
  initialSearchParams
}: BusinessOffersExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const view = getBusinessBrowseView(searchParams.get('view'));
  const cardsState = useCardsDirectoryState(businessCards, initialSearchParams, {
    defaultFilters: defaultBusinessCardsDirectoryFilters,
    parseFilters: parseBusinessCardsDirectoryFilters,
    buildSearchParams: buildBusinessCardsSearchParams,
    countActiveFilters: countBusinessCardFilters,
    isActive: view === 'cards'
  });
  const bankingState = useBankingDirectoryState(businessOffers, initialSearchParams, {
    defaultFilters: defaultBusinessBankingDirectoryFilters,
    parseFilters: parseBusinessBankingDirectoryFilters,
    buildSearchParams: buildBusinessBankingSearchParams,
    countActiveFilters: countBusinessBankingFilters,
    buildActiveFilterChips: buildBusinessBankingFilterChips,
    isActive: view === 'banking'
  });

  function setBrowseView(nextView: BusinessBrowseView) {
    if (nextView === view) return;

    const params =
      nextView === 'cards'
        ? buildBusinessCardsSearchParams(new URLSearchParams(searchParamsString), cardsState.filters)
        : buildBusinessBankingSearchParams(
            new URLSearchParams(searchParamsString),
            bankingState.filters
          );
    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
  }
  const noAnnualFeeBusinessCards = cardsState.filteredSortedCards.filter(
    (card) => card.annualFee === 0
  ).length;
  const activeBonusBusinessCards = cardsState.filteredSortedCards.filter(
    (card) => (card.bestSignUpBonusValue ?? 0) > 0
  ).length;
  const noDirectDepositBusinessOffers = businessOffers.filter(
    (offer) => !offer.directDeposit.required
  ).length;
  const numericApyBusinessOffers = businessOffers.filter((offer) => offer.apyPercent != null).length;

  const browseViewToggle = (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[42rem] rounded-full border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setBrowseView('cards')}
          className={`flex-1 rounded-full px-6 py-3 text-center text-base font-semibold transition md:whitespace-nowrap ${
            view === 'cards'
              ? 'bg-brand-teal text-black'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Business Credit Cards
          <span className="ml-2 text-sm opacity-70">{businessCards.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setBrowseView('banking')}
          className={`flex-1 rounded-full px-6 py-3 text-center text-base font-semibold transition md:whitespace-nowrap ${
            view === 'banking'
              ? 'bg-brand-teal text-black'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Business Banking Accounts
          <span className="ml-2 text-sm opacity-70">{businessOffers.length}</span>
        </button>
      </div>
    </div>
  );

  return (
    <section>
      {view === 'cards' ? (
        <>
          <CardsDirectoryFilterPanel
            totalCards={businessCards.length}
            filteredCardsCount={cardsState.filteredSortedCards.length}
            noAnnualFeeCount={noAnnualFeeBusinessCards}
            activeBonusCount={activeBonusBusinessCards}
            activeFilterCount={cardsState.activeFilterCount}
            issuer={cardsState.issuer}
            spendCategory={cardsState.spendCategory}
            foreignFee={cardsState.foreignFee}
            rewardType={cardsState.rewardType}
            showBusinessQuickFilter={false}
            sortBy={cardsState.sortBy}
            issuerOptions={cardsState.issuerOptions}
            eyebrowLabel="Business Cards"
            title="Find the right bonus for your business."
            description=""
            preFilterContent={browseViewToggle}
            onIssuerChange={cardsState.setIssuer}
            onSpendCategoryChange={cardsState.setSpendCategory}
            onForeignFeeChange={cardsState.setForeignFee}
            onRewardTypeChange={cardsState.setRewardType}
            onSortByChange={cardsState.setSortBy}
            onClearFilters={cardsState.clearFilters}
          />

          <CardsDirectoryResults
            cards={cardsState.filteredSortedCards}
            selectedCompare={cardsState.selectedCompare}
          />
        </>
      ) : (
        <>
          <BankingDirectoryFilterPanel
            activeFilterCount={bankingState.activeFilterCount}
            activeFilterChips={bankingState.activeFilterChips}
            totalOffers={businessOffers.length}
            filteredOffersCount={bankingState.filteredSortedOffers.length}
            noDirectDepositCount={noDirectDepositBusinessOffers}
            numericApyCount={numericApyBusinessOffers}
            customerType={businessBankingPageCustomerType}
            directDeposit={bankingState.directDeposit}
            apy={bankingState.apy}
            cashRequirement={bankingState.cashRequirement}
            timeline={bankingState.timeline}
            state={bankingState.state}
            sortBy={bankingState.sortBy}
            eyebrowLabel="Business Banking"
            title="Find the right business bank bonus for your plan."
            description="Browse business checking and savings bonuses with the same filter treatment and offer cards used in the main banking directory."
            preFilterContent={browseViewToggle}
            showCustomerTypeFilter={false}
            onCustomerTypeChange={() => {}}
            onDirectDepositChange={bankingState.setDirectDeposit}
            onApyChange={bankingState.setApy}
            onCashRequirementChange={bankingState.setCashRequirement}
            onTimelineChange={bankingState.setTimeline}
            onStateChange={bankingState.setState}
            onSortByChange={bankingState.setSortBy}
            onRemoveFilter={bankingState.removeFilter}
            onReset={bankingState.clearFilters}
          />

          <BankingDirectoryResults
            allOffers={businessOffers}
            offers={bankingState.filteredSortedOffers}
            activeFilterCount={bankingState.activeFilterCount}
            onClearFilters={bankingState.clearFilters}
          />
        </>
      )}
    </section>
  );
}
