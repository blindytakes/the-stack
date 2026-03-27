import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { BusinessOffersExplorer } from '@/components/business/business-offers-explorer';
import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Bonuses',
  description:
    'Plan business credit card and business banking bonuses with a dedicated business-only intake and filtered recommendation set.'
};

export default async function BusinessPage() {
  const [{ cards }, { bonuses }] = await Promise.all([getCardsData(), getBankingBonusesData()]);
  const businessCards = cards.filter((card) => card.cardType === 'business');
  const businessBonuses = bonuses.filter((bonus) => bonus.customerType === 'business');
  const businessCardCount = businessCards.length;
  const businessBankingCount = businessBonuses.length;

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'business_page', path: '/business' }}
      />

      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Business Path</p>
            <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-6xl">
              Plan business card and bank bonuses without the consumer noise
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary md:text-lg">
              Built for sole props, side hustles, and companies that want business-only recommendations.
            </p>
            <div className="mt-7">
              <Link
                href="/tools/card-finder?mode=full&audience=business"
                className="inline-flex items-center justify-center rounded-full bg-brand-teal px-7 py-3.5 text-base font-semibold text-black transition hover:opacity-90"
              >
                Start Business Plan
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">Current catalog</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-3xl font-semibold text-text-primary">
                  {businessCardCount.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-text-secondary">Business cards</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-3xl font-semibold text-text-primary">
                  {businessBankingCount.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-text-secondary">Business banking offers</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <BusinessOffersExplorer businessCards={businessCards} businessOffers={businessBonuses} />
    </div>
  );
}
