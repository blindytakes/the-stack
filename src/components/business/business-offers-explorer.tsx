'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BankingDirectoryFilterPanel } from '@/components/banking/banking-directory-filter-panel';
import { BankingDirectoryResults } from '@/components/banking/banking-directory-results';
import { CardsDirectoryFilterPanel } from '@/components/cards/cards-directory-filter-panel';
import { CardsDirectoryResults } from '@/components/cards/cards-directory-results';
import type { BankingBonusListItem, BankingBonusesSort } from '@/lib/banking-bonuses';
import {
  buildActiveBankingFilterChips,
  buildBankingDirectorySearchParams,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  filterAndSortBankingOffers,
  parseBankingDirectoryFilters,
  type BankingDirectoryFilters,
  type ApyFilterValue,
  type BankingDirectoryFilterKey,
  type CashRequirementFilterValue,
  type CustomerTypeFilterValue,
  type DirectDepositFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';
import type { CardRecord } from '@/lib/cards';
import {
  buildCardsDirectorySearchParams,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  filterAndSortCards,
  parseCardsDirectoryFilters,
  type CardsDirectoryFilters,
  type CardTypeFilterValue,
  type ForeignFeeFilterValue,
  type RewardTypeFilterValue,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';

type BusinessOffersExplorerProps = {
  businessCards: CardRecord[];
  businessOffers: BankingBonusListItem[];
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

export function BusinessOffersExplorer({
  businessCards,
  businessOffers
}: BusinessOffersExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const hasHydratedFromUrl = useRef(false);
  const issuerOptions = useMemo(() => buildIssuerOptions(businessCards), [businessCards]);
  const view = getBusinessBrowseView(searchParams.get('view'));

  const [cardsIssuer, setCardsIssuer] = useState(defaultCardsDirectoryFilters.issuer);
  const [cardsSpendCategory, setCardsSpendCategory] = useState<SpendCategoryFilterValue>(
    defaultCardsDirectoryFilters.spendCategory
  );
  const [cardsForeignFee, setCardsForeignFee] = useState<ForeignFeeFilterValue>(
    defaultCardsDirectoryFilters.foreignFee
  );
  const [cardsRewardType, setCardsRewardType] = useState<RewardTypeFilterValue>(
    defaultCardsDirectoryFilters.rewardType
  );
  const [cardsSortBy, setCardsSortBy] = useState<SortValue>(defaultCardsDirectoryFilters.sortBy);

  const [bankingDirectDeposit, setBankingDirectDeposit] = useState<DirectDepositFilterValue>(
    defaultBankingDirectoryFilters.directDeposit
  );
  const [bankingApy, setBankingApy] = useState<ApyFilterValue>(defaultBankingDirectoryFilters.apy);
  const [bankingCashRequirement, setBankingCashRequirement] = useState<CashRequirementFilterValue>(
    defaultBankingDirectoryFilters.cashRequirement
  );
  const [bankingTimeline, setBankingTimeline] = useState<TimelineFilterValue>(
    defaultBankingDirectoryFilters.timeline
  );
  const [bankingState, setBankingState] = useState(defaultBankingDirectoryFilters.state);
  const [bankingSortBy, setBankingSortBy] = useState<BankingBonusesSort>(
    defaultBankingDirectoryFilters.sortBy
  );

  function setBrowseView(nextView: BusinessBrowseView) {
    if (nextView === view) return;

    const params =
      nextView === 'cards'
        ? buildBusinessCardsSearchParams(new URLSearchParams(searchParamsString), cardFilters)
        : buildBusinessBankingSearchParams(new URLSearchParams(searchParamsString), bankingFilters);
    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
  }

  const cardFilters = useMemo(
    () => ({
      issuer: cardsIssuer,
      spendCategory: cardsSpendCategory,
      foreignFee: cardsForeignFee,
      rewardType: cardsRewardType,
      bonusFilter: defaultCardsDirectoryFilters.bonusFilter,
      maxFee: defaultCardsDirectoryFilters.maxFee,
      cardType: businessCardsPageCardType,
      sortBy: cardsSortBy
    }),
    [cardsForeignFee, cardsIssuer, cardsRewardType, cardsSortBy, cardsSpendCategory]
  );

  const bankingFilters = useMemo(
    () => ({
      accountType: defaultBankingDirectoryFilters.accountType,
      customerType: businessBankingPageCustomerType,
      directDeposit: bankingDirectDeposit,
      apy: bankingApy,
      difficulty: defaultBankingDirectoryFilters.difficulty,
      cashRequirement: bankingCashRequirement,
      timeline: bankingTimeline,
      stateLimited: defaultBankingDirectoryFilters.stateLimited,
      state: bankingState,
      sortBy: bankingSortBy
    }),
    [
      bankingApy,
      bankingCashRequirement,
      bankingDirectDeposit,
      bankingSortBy,
      bankingState,
      bankingTimeline
    ]
  );
  const bankingFiltersForUi = useMemo(
    () => ({
      ...bankingFilters,
      customerType: defaultBankingDirectoryFilters.customerType
    }),
    [bankingFilters]
  );

  useEffect(() => {
    if (view === 'cards') {
      const nextFilters = parseCardsDirectoryFilters(
        new URLSearchParams(searchParamsString),
        issuerOptions
      );

      setCardsIssuer(nextFilters.issuer);
      setCardsSpendCategory(nextFilters.spendCategory);
      setCardsForeignFee(nextFilters.foreignFee);
      setCardsRewardType(nextFilters.rewardType);
      setCardsSortBy(nextFilters.sortBy);
    } else {
      const nextFilters = parseBankingDirectoryFilters(new URLSearchParams(searchParamsString));

      setBankingDirectDeposit(nextFilters.directDeposit);
      setBankingApy(nextFilters.apy);
      setBankingCashRequirement(nextFilters.cashRequirement);
      setBankingTimeline(nextFilters.timeline);
      setBankingState(nextFilters.state);
      setBankingSortBy(nextFilters.sortBy);
    }

    hasHydratedFromUrl.current = true;
  }, [issuerOptions, searchParamsString, view]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;

    const nextParams =
      view === 'cards'
        ? buildBusinessCardsSearchParams(new URLSearchParams(searchParamsString), cardFilters)
        : buildBusinessBankingSearchParams(new URLSearchParams(searchParamsString), bankingFilters);
    const nextQueryString = nextParams.toString();

    if (nextQueryString === searchParamsString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [bankingFilters, cardFilters, pathname, router, searchParamsString, view]);

  const filteredBusinessCards = useMemo(
    () => filterAndSortCards(businessCards, cardFilters),
    [businessCards, cardFilters]
  );
  const filteredBusinessOffers = useMemo(
    () => filterAndSortBankingOffers(businessOffers, bankingFilters),
    [bankingFilters, businessOffers]
  );
  const cardFilterCount = useMemo(
    () =>
      countActiveCardsDirectoryFilters({
        ...cardFilters,
        cardType: defaultCardsDirectoryFilters.cardType
      }),
    [cardFilters]
  );
  const bankingFilterCount = useMemo(
    () => countActiveBankingDirectoryFilters(bankingFiltersForUi),
    [bankingFiltersForUi]
  );
  const bankingActiveFilterChips = useMemo(
    () => buildActiveBankingFilterChips(bankingFiltersForUi),
    [bankingFiltersForUi]
  );

  const noAnnualFeeBusinessCards = filteredBusinessCards.filter((card) => card.annualFee === 0).length;
  const activeBonusBusinessCards = filteredBusinessCards.filter(
    (card) => (card.bestSignUpBonusValue ?? 0) > 0
  ).length;
  const noDirectDepositBusinessOffers = businessOffers.filter(
    (offer) => !offer.directDeposit.required
  ).length;
  const numericApyBusinessOffers = businessOffers.filter((offer) => offer.apyPercent != null).length;

  function clearBankingFilters() {
    setBankingDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    setBankingApy(defaultBankingDirectoryFilters.apy);
    setBankingCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    setBankingTimeline(defaultBankingDirectoryFilters.timeline);
    setBankingState(defaultBankingDirectoryFilters.state);
    setBankingSortBy(defaultBankingDirectoryFilters.sortBy);
  }

  function clearCardFilters() {
    setCardsIssuer(defaultCardsDirectoryFilters.issuer);
    setCardsSpendCategory(defaultCardsDirectoryFilters.spendCategory);
    setCardsForeignFee(defaultCardsDirectoryFilters.foreignFee);
    setCardsRewardType(defaultCardsDirectoryFilters.rewardType);
    setCardsSortBy(defaultCardsDirectoryFilters.sortBy);
  }

  function removeBankingFilter(key: BankingDirectoryFilterKey) {
    if (key === 'customerType') return;
    if (key === 'directDeposit') setBankingDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    if (key === 'apy') setBankingApy(defaultBankingDirectoryFilters.apy);
    if (key === 'cashRequirement') {
      setBankingCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    }
    if (key === 'timeline') setBankingTimeline(defaultBankingDirectoryFilters.timeline);
    if (key === 'state') setBankingState(defaultBankingDirectoryFilters.state);
  }

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
            filteredCardsCount={filteredBusinessCards.length}
            noAnnualFeeCount={noAnnualFeeBusinessCards}
            activeBonusCount={activeBonusBusinessCards}
            activeFilterCount={cardFilterCount}
            issuer={cardsIssuer}
            spendCategory={cardsSpendCategory}
            foreignFee={cardsForeignFee}
            rewardType={cardsRewardType}
            showBusinessQuickFilter={false}
            sortBy={cardsSortBy}
            issuerOptions={issuerOptions}
            eyebrowLabel="Business Cards"
            title="Find the right bonus for your business."
            description=""
            preFilterContent={browseViewToggle}
            onIssuerChange={setCardsIssuer}
            onSpendCategoryChange={setCardsSpendCategory}
            onForeignFeeChange={setCardsForeignFee}
            onRewardTypeChange={setCardsRewardType}
            onSortByChange={setCardsSortBy}
            onClearFilters={clearCardFilters}
          />

          <CardsDirectoryResults
            cards={filteredBusinessCards}
            selectedCompare={[]}
          />
        </>
      ) : (
        <>
          <BankingDirectoryFilterPanel
            activeFilterCount={bankingFilterCount}
            activeFilterChips={bankingActiveFilterChips}
            totalOffers={businessOffers.length}
            filteredOffersCount={filteredBusinessOffers.length}
            noDirectDepositCount={noDirectDepositBusinessOffers}
            numericApyCount={numericApyBusinessOffers}
            customerType={businessBankingPageCustomerType}
            directDeposit={bankingDirectDeposit}
            apy={bankingApy}
            cashRequirement={bankingCashRequirement}
            timeline={bankingTimeline}
            state={bankingState}
            sortBy={bankingSortBy}
            eyebrowLabel="Business Banking"
            title="Find the right business bank bonus for your plan."
            description="Browse business checking and savings bonuses with the same filter treatment and offer cards used in the main banking directory."
            preFilterContent={browseViewToggle}
            showCustomerTypeFilter={false}
            onCustomerTypeChange={() => {}}
            onDirectDepositChange={setBankingDirectDeposit}
            onApyChange={setBankingApy}
            onCashRequirementChange={setBankingCashRequirement}
            onTimelineChange={setBankingTimeline}
            onStateChange={setBankingState}
            onSortByChange={setBankingSortBy}
            onRemoveFilter={removeBankingFilter}
            onReset={clearBankingFilters}
          />

          <BankingDirectoryResults
            allOffers={businessOffers}
            offers={filteredBusinessOffers}
            activeFilterCount={bankingFilterCount}
            onClearFilters={clearBankingFilters}
          />
        </>
      )}
    </section>
  );
}
