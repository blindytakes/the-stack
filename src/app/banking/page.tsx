import type { Metadata } from 'next';
import Link from 'next/link';
import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,
  getBankingBonusesData,
  getBankingOfferRequirements,
  paginateBankingBonuses
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

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function accountTypeHref(accountType?: 'checking' | 'savings' | 'bundle') {
  if (!accountType) return '/banking';
  const params = new URLSearchParams({ accountType });
  return `/banking?${params.toString()}`;
}

function directDepositHref(value?: 'yes' | 'no') {
  if (!value) return '/banking';
  const params = new URLSearchParams({ directDeposit: value });
  return `/banking?${params.toString()}`;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export default async function BankingPage({ searchParams }: Props) {
  const search = await searchParams;
  const rawQuery = {
    accountType: firstParam(search.accountType),
    requiresDirectDeposit: firstParam(search.directDeposit),
    state: firstParam(search.state),
    limit: 100,
    offset: 0
  };
  const parsedQuery = bankingBonusesQuerySchema.safeParse(rawQuery);
  const query =
    parsedQuery.success ? parsedQuery.data : bankingBonusesQuerySchema.parse({ limit: 100, offset: 0 });

  const { bonuses } = getBankingBonusesData();
  const filtered = filterBankingBonuses(bonuses, query);
  const offers = paginateBankingBonuses(filtered, query);
  const totalNetValue = offers.reduce((sum, offer) => sum + offer.estimatedNetValue, 0);
  const directDepositRequiredCount = offers.filter((offer) => offer.directDeposit.required).length;

  return (
    <div className="container-page pt-12 pb-16">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Banking Bonuses</p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-5xl">
          Capture checking and savings bonuses with fewer misses.
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Compare real net value after likely fees, required actions, and timeline constraints.
          Build a bank-bonus stack that works with your card strategy.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Value examples are estimates, not guarantees. Confirm final terms directly with each bank.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Filters</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: 'All account types', href: accountTypeHref(), active: !query.accountType },
            {
              label: 'Checking',
              href: accountTypeHref('checking'),
              active: query.accountType === 'checking'
            },
            { label: 'Savings', href: accountTypeHref('savings'), active: query.accountType === 'savings' },
            { label: 'Bundle', href: accountTypeHref('bundle'), active: query.accountType === 'bundle' }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                item.active
                  ? 'border-brand-teal/40 bg-brand-teal/10 text-brand-teal'
                  : 'border-white/10 text-text-secondary hover:border-white/30'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            {
              label: 'Any direct deposit requirement',
              href: directDepositHref(),
              active: !query.requiresDirectDeposit
            },
            {
              label: 'Direct deposit required',
              href: directDepositHref('yes'),
              active: query.requiresDirectDeposit === 'yes'
            },
            {
              label: 'No direct deposit required',
              href: directDepositHref('no'),
              active: query.requiresDirectDeposit === 'no'
            }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                item.active
                  ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold'
                  : 'border-white/10 text-text-secondary hover:border-white/30'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Visible Offers</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{offers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net Value Snapshot</p>
          <p className="mt-2 text-2xl font-semibold text-brand-teal">{formatCurrency(totalNetValue)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Direct Deposit Required</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{directDepositRequiredCount}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <Link
            key={offer.slug}
            href={`/banking/${offer.slug}?src=banking_directory`}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
          >
            <p className="text-xs text-text-muted">{offer.bankName}</p>
            <h2 className="mt-1 text-base font-semibold text-text-primary transition group-hover:text-brand-teal">
              {offer.offerName}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{offer.headline}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-bg/50 p-2">
                <p className="text-text-muted">Bonus</p>
                <p className="mt-1 font-semibold text-text-primary">{formatCurrency(offer.bonusAmount)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg/50 p-2">
                <p className="text-text-muted">Net est.</p>
                <p className="mt-1 font-semibold text-brand-teal">
                  {formatCurrency(offer.estimatedNetValue)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-brand-gold/20 bg-brand-gold/5 px-2 py-0.5 text-[10px] uppercase text-brand-gold">
                {offer.accountType}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-text-muted">
                {offer.directDeposit.required ? 'Direct deposit' : 'No direct deposit'}
              </span>
              {offer.stateRestrictions && offer.stateRestrictions.length > 0 && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-text-muted">
                  State-limited
                </span>
              )}
            </div>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-text-muted">
              {getBankingOfferRequirements(offer)
                .slice(0, 2)
                .map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
            </ul>
          </Link>
        ))}
      </section>

      {offers.length === 0 && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">No offers match your filters</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Try removing filters or build a full plan to get card and banking recommendations
            together.
          </p>
          <Link
            href="/tools/card-finder"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Build My Bonus Plan
          </Link>
        </section>
      )}

      <section className="mt-12 rounded-3xl border border-white/10 bg-bg-elevated p-8">
        <h2 className="font-heading text-3xl text-text-primary">Want card + bank sequencing together?</h2>
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">
          Use the planner to prioritize do-now and do-next actions across both lanes in one 12-month
          strategy.
        </p>
        <div className="mt-6">
          <Link
            href="/tools/card-finder"
            className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Build My Bonus Plan
          </Link>
        </div>
      </section>
    </div>
  );
}
