import type { Metadata } from 'next';
import Link from 'next/link';
import { BankingOffersGrid } from '@/components/banking/banking-offers-grid';
import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,

  getBankingBonusesData,
  paginateBankingBonuses,
  sortBankingBonuses,
  type BankingBonusesSort
} from '@/lib/banking-bonuses';

export const metadata: Metadata = {
  title: 'Banking Bonuses',
  description:
    'Browse checking and savings bank bonuses with net value estimates, requirements, and timelines.'
};

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  searchParams: Promise<SearchParams>;
};

type BankingFilterState = {
  accountType?: 'checking' | 'savings' | 'bundle';
  requiresDirectDeposit?: 'yes' | 'no';
  difficulty?: 'low' | 'medium' | 'high';
  cashRequirement?: 'none' | 'light' | 'medium' | 'high';
  timeline?: 'fast' | 'standard' | 'long';
  stateLimited?: 'yes' | 'no';
  state?: string;
  sort?: BankingBonusesSort;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function segmentClass(active: boolean) {
  return active
    ? 'bg-brand-teal text-black font-semibold'
    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]';
}

function bankingFiltersHref(current: BankingFilterState, updates: Partial<BankingFilterState>) {
  const next: BankingFilterState = {
    accountType: current.accountType,
    requiresDirectDeposit: current.requiresDirectDeposit,
    difficulty: current.difficulty,
    cashRequirement: current.cashRequirement,
    timeline: current.timeline,
    stateLimited: current.stateLimited,
    state: current.state,
    sort: current.sort,
    ...updates
  };

  const params = new URLSearchParams();
  if (next.accountType) params.set('accountType', next.accountType);
  if (next.requiresDirectDeposit) params.set('directDeposit', next.requiresDirectDeposit);
  if (next.difficulty) params.set('difficulty', next.difficulty);
  if (next.cashRequirement) params.set('cash', next.cashRequirement);
  if (next.timeline) params.set('timeline', next.timeline);
  if (next.stateLimited) params.set('stateLimited', next.stateLimited);
  if (next.state) params.set('state', next.state);
  if (next.sort && next.sort !== 'net') params.set('sort', next.sort);

  const query = params.toString();
  return query ? `/banking?${query}` : '/banking';
}


const cashLabels = {
  none: 'No minimum listed',
  light: 'Up to $2.5k',
  medium: '$2.5k to $10k',
  high: '$10k+'
} as const;
const timelineLabels = {
  fast: '~3 months or less',
  standard: '~4 to 5 months',
  long: 'Long hold'
} as const;

export default async function BankingPage({ searchParams }: Props) {
  const search = await searchParams;
  const rawQuery = {
    accountType: firstParam(search.accountType),
    requiresDirectDeposit: firstParam(search.directDeposit),
    difficulty: firstParam(search.difficulty),
    cashRequirement: firstParam(search.cash),
    timeline: firstParam(search.timeline),
    stateLimited: firstParam(search.stateLimited),
    state: firstParam(search.state),
    sort: firstParam(search.sort),
    limit: 100,
    offset: 0
  };
  const parsedQuery = bankingBonusesQuerySchema.safeParse(rawQuery);
  const query =
    parsedQuery.success ? parsedQuery.data : bankingBonusesQuerySchema.parse({ limit: 100, offset: 0 });
  const currentFilters: BankingFilterState = {
    accountType: query.accountType,
    requiresDirectDeposit: query.requiresDirectDeposit,
    difficulty: query.difficulty,
    cashRequirement: query.cashRequirement,
    timeline: query.timeline,
    stateLimited: query.stateLimited,
    state: query.state,
    sort: query.sort
  };

  const { bonuses } = await getBankingBonusesData();
  const filteredBonuses = filterBankingBonuses(bonuses, query);
  const sortedBonuses = sortBankingBonuses(filteredBonuses, query.sort);
  const offers = paginateBankingBonuses(sortedBonuses, query);

  const activeFilters = [
    query.requiresDirectDeposit === 'yes'
      ? 'Payroll required'
      : query.requiresDirectDeposit === 'no'
        ? 'No payroll'
        : null,
    query.cashRequirement ? cashLabels[query.cashRequirement] : null,
    query.timeline ? timelineLabels[query.timeline] : null,
    query.stateLimited === 'yes'
      ? 'State-limited only'
      : query.stateLimited === 'no'
        ? 'No state restrictions'
        : null,
    query.state ? `State: ${query.state}` : null
  ].filter((value): value is string => Boolean(value));

  const hasActiveFilters = activeFilters.length > 0;
  const clearFiltersHref = '/banking';

  return (
    <div className="container-page pt-8 pb-16">
      {/* Hero + inline filters */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Banking Bonuses</p>
        <h1 className="mt-1.5 font-heading text-4xl text-text-primary">
          Bank bonus offers you can actually finish.
        </h1>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Payroll segment */}
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[13px] font-medium text-text-muted sm:w-auto">Payroll</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
              {[
                { label: 'Any', value: undefined },
                { label: 'No payroll', value: 'no' as const },
                { label: 'Required', value: 'yes' as const }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={bankingFiltersHref(currentFilters, { requiresDirectDeposit: item.value })}
                  className={buildClassName(
                    'whitespace-nowrap px-3.5 py-1.5 text-[13px] transition',
                    segmentClass(
                      query.requiresDirectDeposit === item.value ||
                        (!query.requiresDirectDeposit && !item.value)
                    )
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Deposit segment */}
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[13px] font-medium text-text-muted sm:w-auto">Deposit</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
              {[
                { label: 'Any', value: undefined },
                { label: 'No min', value: 'none' as const },
                { label: '≤$2.5k', value: 'light' as const },
                { label: '$2.5–10k', value: 'medium' as const },
                { label: '$10k+', value: 'high' as const }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={bankingFiltersHref(currentFilters, { cashRequirement: item.value })}
                  className={buildClassName(
                    'whitespace-nowrap px-3 py-1.5 text-[13px] transition',
                    segmentClass(
                      query.cashRequirement === item.value || (!query.cashRequirement && !item.value)
                    )
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Timeline segment */}
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[13px] font-medium text-text-muted sm:w-auto">Timeline</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
              {[
                { label: 'Any', value: undefined },
                { label: '≤3 mo', value: 'fast' as const },
                { label: '4–5 mo', value: 'standard' as const },
                { label: 'Long', value: 'long' as const }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={bankingFiltersHref(currentFilters, { timeline: item.value })}
                  className={buildClassName(
                    'whitespace-nowrap px-3.5 py-1.5 text-[13px] transition',
                    segmentClass(query.timeline === item.value || (!query.timeline && !item.value))
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Link
              href={clearFiltersHref}
              className="self-start rounded-lg border border-white/10 px-3.5 py-1.5 text-[13px] text-text-secondary transition hover:border-white/30 hover:text-text-primary sm:self-auto"
            >
              Reset
            </Link>
          )}
        </div>
      </div>

      {/* Full-width offers grid */}
      {offers.length > 0 ? (
        <BankingOffersGrid offers={offers} source="banking_directory" />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">No offers match your filters</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Try broadening the filters or reset to see the full list.
          </p>
          <div className="mt-4">
            <Link
              href={clearFiltersHref}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
            >
              Reset Filters
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-bg-elevated/80 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl text-text-primary md:text-3xl">
              Need the full sequence?
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Plan cards and bank bonuses in one order of operations.
            </p>
          </div>
          <Link
            href="/tools/card-finder?mode=full"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-7 py-3 text-base font-semibold text-black transition hover:opacity-90 sm:w-auto sm:min-w-[240px] md:px-8 md:py-3.5"
          >
            Build Full Bonus Plan
          </Link>
        </div>
      </section>

      <p className="mt-6 text-xs text-text-muted">
        Net-value estimates are modeled, not guaranteed. Confirm final terms directly with the bank before opening.
      </p>
    </div>
  );
}
