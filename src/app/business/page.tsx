import type { Metadata } from 'next';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { BusinessOffersExplorer } from '@/components/business/business-offers-explorer';
import { getBusinessCardsData } from '@/lib/cards';
import { getBusinessBankingBonusesData } from '@/lib/banking-bonuses';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Bonuses',
  description:
    'Plan business credit card and business banking bonuses with a dedicated business-only intake and filtered recommendation set.'
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

export default async function BusinessPage({ searchParams }: Props) {
  const [{ cards: businessCards }, { bonuses: businessBonuses }] = await Promise.all([
    getBusinessCardsData(),
    getBusinessBankingBonusesData()
  ]);
  const initialSearchParams = buildInitialSearchParams(await searchParams);

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'business_page', path: '/business' }}
      />

      <BusinessOffersExplorer
        businessCards={businessCards}
        businessOffers={businessBonuses}
        initialSearchParams={initialSearchParams}
      />
    </div>
  );
}
