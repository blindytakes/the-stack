import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Bonuses',
  description:
    'Plan business credit card and business banking bonuses with a dedicated business-only intake and filtered recommendation set.'
};

const quizTopics = [
  {
    title: 'Business spend',
    description: 'How much normal business spend you can shift to a new card without forcing extra purchases.'
  },
  {
    title: 'Deposit readiness',
    description: 'Whether your business can route qualifying deposits to a new bank account for bonus requirements.'
  },
  {
    title: 'Business location',
    description: 'State-based filters keep region-limited business banking offers out of the recommendation set.'
  },
  {
    title: 'Existing accounts',
    description: 'Current business cards and banking relationships stay out of the new-account recommendation set.'
  }
] as const;

const assumptionCards = [
  {
    title: 'Business-only recommendations',
    description: 'This path filters the final plan to business cards and business banking offers only.'
  },
  {
    title: 'Region-aware offer filtering',
    description: 'Business banking recommendations stay aligned with state-level eligibility before they reach the plan.'
  },
  {
    title: 'Built for real operating cash flow',
    description: 'Cash and deposit questions are framed around what your business can actually move without creating strain.'
  }
] as const;

function formatCount(value: number, label: string) {
  return `${value.toLocaleString()} ${label}`;
}

export default async function BusinessPage() {
  const [{ cards }, { bonuses }] = await Promise.all([getCardsData(), getBankingBonusesData()]);
  const businessCards = cards.filter((card) => card.cardType === 'business');
  const businessBonuses = bonuses.filter((bonus) => bonus.customerType === 'business');
  const issuerCount = new Set(businessCards.map((card) => card.issuer)).size;

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'business_page', path: '/business' }}
      />

      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Business Path</p>
            <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-6xl">
              Business cards and bank bonuses, without the consumer noise
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary md:text-lg">
              Use a dedicated intake when you have a sole prop, side hustle, or company spend to route.
              The business path keeps the recommendation set focused on business-only accounts and the
              constraints that actually matter for them.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tools/card-finder?mode=full&audience=business"
                className="inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Build My Business Plan
              </Link>
              <Link
                href="/cards?type=business"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Browse business cards
              </Link>
              <Link
                href="/banking?customerType=business"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Browse business banking
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Current catalog</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-3xl font-semibold text-text-primary">
                  {formatCount(businessCards.length, 'business cards')}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Across {issuerCount.toLocaleString()} issuers in the current directory.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-3xl font-semibold text-text-primary">
                  {formatCount(businessBonuses.length, 'business banking offers')}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Filtered business checking, savings, and bundle bonuses.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {assumptionCards.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.6rem] border border-white/10 bg-bg-surface p-5"
          >
            <p className="text-sm font-semibold text-text-primary">{item.title}</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-[2rem] border border-white/10 bg-bg-elevated/70 p-6 md:p-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Business Intake</p>
          <h2 className="mt-2 font-heading text-3xl text-text-primary">
            Similar quiz, different assumptions
          </h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            The flow mirrors the main planner, but the wording and final recommendation set assume
            you are optimizing for business accounts rather than mixed consumer offers.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {quizTopics.map((topic, index) => (
            <article
              key={topic.title}
              className="rounded-[1.5rem] border border-white/10 bg-bg/40 p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-brand-teal">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-text-primary">{topic.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{topic.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),rgba(255,255,255,0.03))] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Good fit if</p>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              You have real business spend, can document a legitimate business or sole prop activity,
              and want the plan to ignore personal-only accounts from the start.
            </p>
          </div>
          <Link
            href="/tools/card-finder?mode=full&audience=business"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-7 py-3 text-base font-semibold text-black transition hover:opacity-90 sm:w-auto sm:min-w-[250px]"
          >
            Start the business planner
          </Link>
        </div>
      </section>
    </div>
  );
}
