import type { Metadata } from 'next';
import Link from 'next/link';
import { BankingDirectoryExplorer } from '@/components/banking/banking-directory-explorer';
import { getBankingBonusesData } from '@/lib/banking-bonuses';

export const metadata: Metadata = {
  title: 'Banking Bonuses',
  description:
    'Browse checking and savings bank bonuses with net value estimates, requirements, and timelines.'
};

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  searchParams: Promise<SearchParams>;
};

function buildInitialSearchParams(searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
      continue;
    }

    if (value) params.set(key, value);
  }

  return params.toString();
}

export default async function BankingPage({ searchParams }: Props) {
  const { bonuses } = await getBankingBonusesData();
  const initialSearchParams = buildInitialSearchParams(await searchParams);

  return (
    <div className="container-page pt-12 pb-16">
      <BankingDirectoryExplorer offers={bonuses} initialSearchParams={initialSearchParams} />

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
        Net-value estimates are modeled, not guaranteed. APYs and bonus terms can change. Confirm
        final terms directly with the bank before opening.
      </p>
    </div>
  );
}
