import type { Metadata } from 'next';
import Link from 'next/link';
import { BankingOfferCard } from '@/components/banking/banking-offer-card';
import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,
  formatBankingAccountType,
  formatBankingCurrency,
  getBankingBonusesData,
  getBankingOfferDifficulty,
  getBankingOfferTimeline,
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

type FilterLinkTone = 'default' | 'teal' | 'gold';

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function getFilterLinkClassName(active: boolean, tone: FilterLinkTone = 'default') {
  if (!active) {
    return 'border-white/10 bg-bg/25 text-text-secondary hover:border-white/30 hover:text-text-primary';
  }

  if (tone === 'gold') {
    return 'border-brand-gold/35 bg-brand-gold/10 text-brand-gold';
  }

  if (tone === 'teal') {
    return 'border-brand-teal/35 bg-brand-teal/10 text-brand-teal';
  }

  return 'border-white/20 bg-white/5 text-text-primary';
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

function FilterGroup({
  title,
  description,
  tone = 'default',
  items
}: {
  title: string;
  description: string;
  tone?: FilterLinkTone;
  items: Array<{ label: string; href: string; active: boolean }>;
}) {
  return (
    <div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={buildClassName(
              'rounded-full border px-3 py-1.5 text-xs transition',
              getFilterLinkClassName(item.active, tone)
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const capitalLightThreshold = 2500;
const sortLabels: Record<BankingBonusesSort, string> = {
  net: 'Best net value',
  easy: 'Easiest to complete',
  fast: 'Fastest to finish',
  low_cash: 'Lowest cash required'
};
const sortDescriptions: Record<BankingBonusesSort, string> = {
  net: 'Highest modeled net value first.',
  easy: 'Lighter execution paths rise to the top.',
  fast: 'Shortest completion windows first.',
  low_cash: 'Lowest opening deposit requirements first.'
};
const difficultyLabels = {
  low: 'Low friction',
  medium: 'Moderate friction',
  high: 'High friction'
} as const;
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

  const noDirectDepositOffers = filteredBonuses.filter((offer) => !offer.directDeposit.required);
  const lowFrictionOffers = filteredBonuses.filter(
    (offer) => getBankingOfferDifficulty(offer).level === 'low'
  );
  const lightCashOffers = filteredBonuses.filter(
    (offer) => (offer.minimumOpeningDeposit ?? 0) <= capitalLightThreshold
  );
  const fastestOffer = sortBankingBonuses(
    filteredBonuses.filter((offer) => typeof offer.holdingPeriodDays === 'number'),
    'fast'
  )[0];
  const stateLimitedCount = filteredBonuses.filter(
    (offer) => offer.stateRestrictions && offer.stateRestrictions.length > 0
  ).length;
  const quickStartOffer =
    lowFrictionOffers.find((offer) => !offer.directDeposit.required) ??
    lowFrictionOffers[0] ??
    noDirectDepositOffers[0] ??
    filteredBonuses[0];

  const activeFilters = [
    query.accountType ? formatBankingAccountType(query.accountType) : null,
    query.requiresDirectDeposit === 'yes'
      ? 'Payroll required'
      : query.requiresDirectDeposit === 'no'
        ? 'No payroll'
        : null,
    query.difficulty ? difficultyLabels[query.difficulty] : null,
    query.cashRequirement ? cashLabels[query.cashRequirement] : null,
    query.timeline ? timelineLabels[query.timeline] : null,
    query.stateLimited === 'yes'
      ? 'State-limited only'
      : query.stateLimited === 'no'
        ? 'No state restrictions'
        : null,
    query.state ? `State: ${query.state}` : null
  ].filter((value): value is string => Boolean(value));

  const clearFiltersHref = '/banking';

  return (
    <div className="container-page pt-12 pb-16">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-elevated p-5 md:p-6">
        <div className="max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Banking Bonuses</p>
          <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-[3.35rem] md:leading-[1.02]">
            Find bank bonuses you can actually finish.
          </h1>
          <p className="mt-3 max-w-3xl text-base text-text-secondary md:text-lg">
            Compare net value, payroll friction, cash required, and timeline. Use the left rail to
            narrow the work, or jump straight into one of the quick paths below.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-bg/35 px-3 py-1.5 text-xs text-text-secondary">
            {filteredBonuses.length} offers
          </span>
          <Link
            href={bankingFiltersHref(currentFilters, { requiresDirectDeposit: 'no', sort: 'easy' })}
            className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1.5 text-xs text-brand-teal transition hover:border-brand-teal/40"
          >
            {noDirectDepositOffers.length} no payroll
          </Link>
          <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1.5 text-xs text-brand-gold">
            {lightCashOffers.length} low cash paths
          </span>
          <Link
            href={bankingFiltersHref(currentFilters, { difficulty: 'low', sort: 'easy' })}
            className="rounded-full border border-white/10 bg-bg/25 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Start with easiest
          </Link>
          <Link
            href={bankingFiltersHref(currentFilters, { timeline: undefined, sort: 'fast' })}
            className="rounded-full border border-white/10 bg-bg/25 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
          >
            Fastest to finish
          </Link>
          {stateLimitedCount > 0 ? (
            <span className="rounded-full border border-white/10 bg-bg/25 px-3 py-1.5 text-xs text-text-secondary">
              {stateLimitedCount} state-limited
            </span>
          ) : null}
        </div>

        {quickStartOffer ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.6rem] border border-white/10 bg-bg/30 px-4 py-3">
            <span className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Quick start</span>
            <span className="text-sm font-semibold text-text-primary">{quickStartOffer.bankName}</span>
            <span className="text-sm text-text-secondary">{quickStartOffer.offerName}</span>
            <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal">
              {formatBankingCurrency(quickStartOffer.estimatedNetValue)} net
            </span>
            <span className="rounded-full border border-white/10 bg-bg/25 px-3 py-1 text-xs text-text-secondary">
              {quickStartOffer.directDeposit.required ? 'Payroll required' : 'No payroll'}
            </span>
            <span className="rounded-full border border-white/10 bg-bg/25 px-3 py-1 text-xs text-text-secondary">
              {getBankingOfferTimeline(quickStartOffer).label}
            </span>
            <Link
              href={`/banking/${quickStartOffer.slug}?src=banking_directory`}
              className="inline-flex items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 sm:ml-auto"
            >
              Open Steps
            </Link>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-text-muted">
          Net-value examples are estimates, not guarantees. Confirm final terms directly with the
          bank before you open anything.
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[285px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <section className="rounded-3xl border border-white/10 bg-bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Filters</p>
                <h2 className="mt-2 font-heading text-2xl text-text-primary">Refine by execution fit</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Use the rail to narrow by payroll friction, cash commitment, completion speed,
                  and availability.
                </p>
              </div>
              <Link
                href={clearFiltersHref}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Reset
              </Link>
            </div>

            {query.state ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-bg/30 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Location Lock</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Results are currently limited by the URL state filter for{' '}
                  <span className="text-text-primary">{query.state}</span>.
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              <FilterGroup
                title="Payroll Routing"
                description="Lead with whether qualifying direct deposit is even viable."
                tone="gold"
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { requiresDirectDeposit: undefined }),
                    active: !query.requiresDirectDeposit
                  },
                  {
                    label: 'No payroll',
                    href: bankingFiltersHref(currentFilters, { requiresDirectDeposit: 'no' }),
                    active: query.requiresDirectDeposit === 'no'
                  },
                  {
                    label: 'Payroll required',
                    href: bankingFiltersHref(currentFilters, { requiresDirectDeposit: 'yes' }),
                    active: query.requiresDirectDeposit === 'yes'
                  }
                ]}
              />

              <FilterGroup
                title="Friction"
                description="Filter by how hands-on the execution looks before you click."
                tone="teal"
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { difficulty: undefined }),
                    active: !query.difficulty
                  },
                  {
                    label: 'Low',
                    href: bankingFiltersHref(currentFilters, { difficulty: 'low' }),
                    active: query.difficulty === 'low'
                  },
                  {
                    label: 'Moderate',
                    href: bankingFiltersHref(currentFilters, { difficulty: 'medium' }),
                    active: query.difficulty === 'medium'
                  },
                  {
                    label: 'High',
                    href: bankingFiltersHref(currentFilters, { difficulty: 'high' }),
                    active: query.difficulty === 'high'
                  }
                ]}
              />

              <FilterGroup
                title="Cash Required"
                description="Separate easy openings from offers that tie up real cash."
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { cashRequirement: undefined }),
                    active: !query.cashRequirement
                  },
                  {
                    label: 'No minimum',
                    href: bankingFiltersHref(currentFilters, { cashRequirement: 'none' }),
                    active: query.cashRequirement === 'none'
                  },
                  {
                    label: 'Up to $2.5k',
                    href: bankingFiltersHref(currentFilters, { cashRequirement: 'light' }),
                    active: query.cashRequirement === 'light'
                  },
                  {
                    label: '$2.5k to $10k',
                    href: bankingFiltersHref(currentFilters, { cashRequirement: 'medium' }),
                    active: query.cashRequirement === 'medium'
                  },
                  {
                    label: '$10k+',
                    href: bankingFiltersHref(currentFilters, { cashRequirement: 'high' }),
                    active: query.cashRequirement === 'high'
                  }
                ]}
              />

              <FilterGroup
                title="Timeline"
                description="Focus on offers you can finish inside the window you want."
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { timeline: undefined }),
                    active: !query.timeline
                  },
                  {
                    label: '~3 months or less',
                    href: bankingFiltersHref(currentFilters, { timeline: 'fast' }),
                    active: query.timeline === 'fast'
                  },
                  {
                    label: '~4 to 5 months',
                    href: bankingFiltersHref(currentFilters, { timeline: 'standard' }),
                    active: query.timeline === 'standard'
                  },
                  {
                    label: 'Long hold',
                    href: bankingFiltersHref(currentFilters, { timeline: 'long' }),
                    active: query.timeline === 'long'
                  }
                ]}
              />

              <FilterGroup
                title="Account Type"
                description="Use account type only after you have narrowed by execution fit."
                tone="teal"
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { accountType: undefined }),
                    active: !query.accountType
                  },
                  {
                    label: 'Checking',
                    href: bankingFiltersHref(currentFilters, { accountType: 'checking' }),
                    active: query.accountType === 'checking'
                  },
                  {
                    label: 'Savings',
                    href: bankingFiltersHref(currentFilters, { accountType: 'savings' }),
                    active: query.accountType === 'savings'
                  },
                  {
                    label: 'Bundle',
                    href: bankingFiltersHref(currentFilters, { accountType: 'bundle' }),
                    active: query.accountType === 'bundle'
                  }
                ]}
              />

              <FilterGroup
                title="Availability"
                description="Call out offers with geographic restrictions or keep only broad ones."
                items={[
                  {
                    label: 'Any',
                    href: bankingFiltersHref(currentFilters, { stateLimited: undefined }),
                    active: !query.stateLimited
                  },
                  {
                    label: 'No state limits',
                    href: bankingFiltersHref(currentFilters, { stateLimited: 'no' }),
                    active: query.stateLimited === 'no'
                  },
                  {
                    label: 'State-limited',
                    href: bankingFiltersHref(currentFilters, { stateLimited: 'yes' }),
                    active: query.stateLimited === 'yes'
                  }
                ]}
              />
            </div>
          </section>
        </aside>

        <div>
          <section className="rounded-2xl border border-white/10 bg-bg-surface px-5 py-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Execution Pages</p>
                <h2 className="mt-1.5 font-heading text-2xl text-text-primary">
                  {filteredBonuses.length} offers in view
                </h2>
              </div>

              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Sort By</p>
                <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                  {(
                    [
                      { value: 'net', label: sortLabels.net },
                      { value: 'easy', label: sortLabels.easy },
                      { value: 'fast', label: sortLabels.fast },
                      { value: 'low_cash', label: sortLabels.low_cash }
                    ] as Array<{ value: BankingBonusesSort; label: string }>
                  ).map((item) => (
                    <Link
                      key={item.value}
                      href={bankingFiltersHref(currentFilters, { sort: item.value })}
                      className={buildClassName(
                        'rounded-full border px-3 py-1.5 text-xs transition',
                        getFilterLinkClassName(query.sort === item.value, 'teal')
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-bg/25 px-3 py-1 text-xs text-text-secondary">
                {sortDescriptions[query.sort]}
              </span>
              {fastestOffer ? (
                <span className="rounded-full border border-white/10 bg-bg/25 px-3 py-1 text-xs text-text-secondary">
                  Fastest visible: {getBankingOfferTimeline(fastestOffer).label}
                </span>
              ) : null}
            </div>

            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-white/10 bg-bg/25 px-3 py-1 text-xs text-text-secondary"
                  >
                    {filter}
                  </span>
                ))}
                <Link
                  href={clearFiltersHref}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-secondary transition hover:border-white/30 hover:text-text-primary"
                >
                  Clear all
                </Link>
              </div>
            ) : null}
          </section>

          {offers.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <BankingOfferCard key={offer.slug} offer={offer} source="banking_directory" />
              ))}
            </div>
          ) : (
            <section className="mt-5 rounded-2xl border border-white/10 bg-bg-surface p-6">
              <h2 className="text-lg font-semibold text-text-primary">No offers match your filters</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Try broadening the execution filters or clear the rail to get back to the full list.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={clearFiltersHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
                >
                  Clear Filters
                </Link>
                <Link
                  href="/tools/card-finder?mode=full"
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Build My Bonus Plan
                </Link>
              </div>
            </section>
          )}
        </div>
      </section>

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
    </div>
  );
}
