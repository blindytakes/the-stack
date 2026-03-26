'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BankingDirectoryResults } from '@/components/banking/banking-directory-results';
import { CardsDirectoryResults } from '@/components/cards/cards-directory-results';
import type { BankingBonusListItem, BankingBonusesSort } from '@/lib/banking-bonuses';
import {
  bankingSortOptions,
  cashRequirementOptions,
  countActiveBankingDirectoryFilters,
  defaultBankingDirectoryFilters,
  directDepositOptions,
  filterAndSortBankingOffers,
  stateLimitedOptions,
  timelineOptions,
  type CashRequirementFilterValue,
  type DirectDepositFilterValue,
  type StateLimitedFilterValue,
  type TimelineFilterValue
} from '@/lib/banking-directory-explorer';
import type { CardRecord } from '@/lib/cards';
import {
  bonusOptions,
  buildIssuerOptions,
  countActiveCardsDirectoryFilters,
  defaultCardsDirectoryFilters,
  feeOptions,
  filterAndSortCards,
  sortOptions,
  spendCategoryOptions,
  type BonusFilterValue,
  type FeeFilterValue,
  type SpendCategoryFilterValue,
  type SortValue
} from '@/lib/cards-directory-explorer';
import { usStateOptions } from '@/lib/us-state-options';

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

export function BusinessOffersExplorer({
  businessCards,
  businessOffers
}: BusinessOffersExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const issuerOptions = useMemo(() => buildIssuerOptions(businessCards), [businessCards]);
  const view = getBusinessBrowseView(searchParams.get('view'));

  const [cardsQuery, setCardsQuery] = useState('');
  const [cardsIssuer, setCardsIssuer] = useState(defaultCardsDirectoryFilters.issuer);
  const [cardsSpendCategory, setCardsSpendCategory] = useState<SpendCategoryFilterValue>(
    defaultCardsDirectoryFilters.spendCategory
  );
  const [cardsBonusFilter, setCardsBonusFilter] = useState<BonusFilterValue>(
    defaultCardsDirectoryFilters.bonusFilter
  );
  const [cardsMaxFee, setCardsMaxFee] = useState<FeeFilterValue>(defaultCardsDirectoryFilters.maxFee);
  const [cardsSortBy, setCardsSortBy] = useState<SortValue>(defaultCardsDirectoryFilters.sortBy);

  const [bankingQuery, setBankingQuery] = useState(defaultBankingDirectoryFilters.query);
  const [bankingDirectDeposit, setBankingDirectDeposit] = useState<DirectDepositFilterValue>(
    defaultBankingDirectoryFilters.directDeposit
  );
  const [bankingCashRequirement, setBankingCashRequirement] = useState<CashRequirementFilterValue>(
    defaultBankingDirectoryFilters.cashRequirement
  );
  const [bankingTimeline, setBankingTimeline] = useState<TimelineFilterValue>(
    defaultBankingDirectoryFilters.timeline
  );
  const [bankingStateLimited, setBankingStateLimited] = useState<StateLimitedFilterValue>(
    defaultBankingDirectoryFilters.stateLimited
  );
  const [bankingState, setBankingState] = useState(defaultBankingDirectoryFilters.state);
  const [bankingSortBy, setBankingSortBy] = useState<BankingBonusesSort>(
    defaultBankingDirectoryFilters.sortBy
  );

  function setBrowseView(nextView: BusinessBrowseView) {
    if (nextView === view) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'cards') {
      params.delete('view');
      params.delete('bank');
    } else {
      params.set('view', 'banking');
      params.delete('card');
    }

    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
  }

  const cardFilters = useMemo(
    () => ({
      query: cardsQuery,
      issuer: cardsIssuer,
      spendCategory: cardsSpendCategory,
      bonusFilter: cardsBonusFilter,
      maxFee: cardsMaxFee,
      cardType: 'all' as const,
      sortBy: cardsSortBy
    }),
    [cardsBonusFilter, cardsIssuer, cardsMaxFee, cardsQuery, cardsSortBy, cardsSpendCategory]
  );

  const bankingFilters = useMemo(
    () => ({
      query: bankingQuery,
      accountType: 'all' as const,
      customerType: 'all' as const,
      directDeposit: bankingDirectDeposit,
      apy: 'any' as const,
      difficulty: 'any' as const,
      cashRequirement: bankingCashRequirement,
      timeline: bankingTimeline,
      stateLimited: bankingStateLimited,
      state: bankingState,
      sortBy: bankingSortBy
    }),
    [
      bankingCashRequirement,
      bankingDirectDeposit,
      bankingQuery,
      bankingSortBy,
      bankingState,
      bankingStateLimited,
      bankingTimeline
    ]
  );

  const filteredBusinessCards = useMemo(
    () => filterAndSortCards(businessCards, cardFilters),
    [businessCards, cardFilters]
  );
  const filteredBusinessOffers = useMemo(
    () => filterAndSortBankingOffers(businessOffers, bankingFilters),
    [bankingFilters, businessOffers]
  );
  const cardFilterCount = useMemo(
    () => countActiveCardsDirectoryFilters(cardFilters),
    [cardFilters]
  );
  const bankingFilterCount = useMemo(
    () => countActiveBankingDirectoryFilters(bankingFilters),
    [bankingFilters]
  );

  const noAnnualFeeBusinessCards = businessCards.filter((card) => card.annualFee === 0).length;
  const noDirectDepositBusinessOffers = businessOffers.filter((offer) => !offer.directDeposit.required).length;

  function clearCardFilters() {
    setCardsQuery(defaultCardsDirectoryFilters.query);
    setCardsIssuer(defaultCardsDirectoryFilters.issuer);
    setCardsSpendCategory(defaultCardsDirectoryFilters.spendCategory);
    setCardsBonusFilter(defaultCardsDirectoryFilters.bonusFilter);
    setCardsMaxFee(defaultCardsDirectoryFilters.maxFee);
    setCardsSortBy(defaultCardsDirectoryFilters.sortBy);
  }

  function clearBankingFilters() {
    setBankingQuery(defaultBankingDirectoryFilters.query);
    setBankingDirectDeposit(defaultBankingDirectoryFilters.directDeposit);
    setBankingCashRequirement(defaultBankingDirectoryFilters.cashRequirement);
    setBankingTimeline(defaultBankingDirectoryFilters.timeline);
    setBankingStateLimited(defaultBankingDirectoryFilters.stateLimited);
    setBankingState(defaultBankingDirectoryFilters.state);
    setBankingSortBy(defaultBankingDirectoryFilters.sortBy);
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,32,0.96),rgba(12,13,22,0.98))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)] md:p-5">
      <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.1),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setBrowseView('cards')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === 'cards'
                  ? 'bg-brand-teal text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Business Cards
              <span className="ml-2 text-xs opacity-70">{businessCards.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setBrowseView('banking')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === 'banking'
                  ? 'bg-brand-teal text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Business Checking
              <span className="ml-2 text-xs opacity-70">{businessOffers.length}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {view === 'cards' ? (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {filteredBusinessCards.length} showing
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {noAnnualFeeBusinessCards} no-fee
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {cardFilterCount} filters active
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {filteredBusinessOffers.length} showing
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  checking only
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {noDirectDepositBusinessOffers} no DD
                </span>
              </>
            )}
          </div>
        </div>

        <div className="relative mt-4">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={view === 'cards' ? cardsQuery : bankingQuery}
            onChange={(event) =>
              view === 'cards'
                ? setCardsQuery(event.target.value)
                : setBankingQuery(event.target.value)
            }
            placeholder={
              view === 'cards'
                ? 'Search issuer, card, or reward fit...'
                : 'Search bank, offer, or requirement...'
            }
            className="w-full rounded-2xl border border-white/10 bg-bg-elevated/90 py-3 pr-4 pl-11 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none"
          />
        </div>

        {view === 'cards' ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Issuer</span>
              <select
                value={cardsIssuer}
                onChange={(event) => setCardsIssuer(event.target.value)}
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
                Spend Fit
              </span>
              <select
                value={cardsSpendCategory}
                onChange={(event) =>
                  setCardsSpendCategory(event.target.value as SpendCategoryFilterValue)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
              >
                {spendCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Bonus Value
              </span>
              <select
                value={cardsBonusFilter}
                onChange={(event) => setCardsBonusFilter(event.target.value as BonusFilterValue)}
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
                value={cardsMaxFee}
                onChange={(event) => setCardsMaxFee(event.target.value as FeeFilterValue)}
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sort</span>
              <select
                value={cardsSortBy}
                onChange={(event) => setCardsSortBy(event.target.value as SortValue)}
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
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Direct Deposit
              </span>
              <select
                value={bankingDirectDeposit}
                onChange={(event) =>
                  setBankingDirectDeposit(event.target.value as DirectDepositFilterValue)
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Cash Needed
              </span>
              <select
                value={bankingCashRequirement}
                onChange={(event) =>
                  setBankingCashRequirement(event.target.value as CashRequirementFilterValue)
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Hold Period
              </span>
              <select
                value={bankingTimeline}
                onChange={(event) => setBankingTimeline(event.target.value as TimelineFilterValue)}
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
                Availability
              </span>
              <select
                value={bankingStateLimited}
                onChange={(event) =>
                  setBankingStateLimited(event.target.value as StateLimitedFilterValue)
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sort</span>
              <select
                value={bankingSortBy}
                onChange={(event) => setBankingSortBy(event.target.value as BankingBonusesSort)}
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
        )}

        {view === 'banking' && (
          <div className="mt-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">State</span>
              <select
                value={bankingState}
                onChange={(event) => setBankingState(event.target.value)}
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

      </div>

      <div className="mt-6">
        {view === 'cards' ? (
          <CardsDirectoryResults
            cards={filteredBusinessCards}
            activeFilterCount={cardFilterCount}
            selectedCompare={[]}
            onClearFilters={clearCardFilters}
          />
        ) : (
          <BankingDirectoryResults
            allOffers={businessOffers}
            offers={filteredBusinessOffers}
            activeFilterCount={bankingFilterCount}
            onClearFilters={clearBankingFilters}
          />
        )}
      </div>
    </section>
  );
}
