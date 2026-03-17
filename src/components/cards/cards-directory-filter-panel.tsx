import {
  bonusOptions,
  cardTypeOptions,
  feeOptions,
  sortOptions,
  type BonusFilterValue,
  type CardTypeFilterValue,
  type FeeFilterValue,
  type IssuerOption,
  type SortValue
} from '@/lib/cards-directory-explorer';

type CardsDirectoryFilterPanelProps = {
  cardsCount: number;
  filteredCount: number;
  activeFilterCount: number;
  query: string;
  issuer: string;
  bonusFilter: BonusFilterValue;
  maxFee: FeeFilterValue;
  cardType: CardTypeFilterValue;
  sortBy: SortValue;
  issuerOptions: IssuerOption[];
  onQueryChange: (value: string) => void;
  onIssuerChange: (value: string) => void;
  onBonusFilterChange: (value: BonusFilterValue) => void;
  onMaxFeeChange: (value: FeeFilterValue) => void;
  onCardTypeChange: (value: CardTypeFilterValue) => void;
  onSortByChange: (value: SortValue) => void;
  onReset: () => void;
};

export function CardsDirectoryFilterPanel({
  cardsCount,
  filteredCount,
  activeFilterCount,
  query,
  issuer,
  bonusFilter,
  maxFee,
  cardType,
  sortBy,
  issuerOptions,
  onQueryChange,
  onIssuerChange,
  onBonusFilterChange,
  onMaxFeeChange,
  onCardTypeChange,
  onSortByChange,
  onReset
}: CardsDirectoryFilterPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-bg-surface p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Search</span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Card name or issuer"
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none"
          />
        </label>

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
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sign-Up Bonus</span>
          <select
            value={bonusFilter}
            onChange={(event) => onBonusFilterChange(event.target.value as BonusFilterValue)}
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
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortValue)}
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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Card Type</span>
          <select
            value={cardType}
            onChange={(event) => onCardTypeChange(event.target.value as CardTypeFilterValue)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {cardTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Annual Fee</span>
          <select
            value={maxFee}
            onChange={(event) => onMaxFeeChange(event.target.value as FeeFilterValue)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-brand-teal focus:outline-none"
          >
            {feeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          Showing {filteredCount} of {cardsCount} cards
          {activeFilterCount > 0
            ? ` with ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`
            : ''}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
}
