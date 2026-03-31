import type { Metadata } from 'next';
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

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'business_page', path: '/business' }}
      />

      <BusinessOffersExplorer businessCards={businessCards} businessOffers={businessBonuses} />
    </div>
  );
}
