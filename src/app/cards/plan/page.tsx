import type { Metadata } from 'next';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { CardsOnlyPlanPath } from '@/components/cards/cards-only-plan-path';
import { getCardsData } from '@/lib/cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '12-Month Card Plan',
  description:
    'Build a shorter card-only plan using the cards you already have, Chase status, spend, and credit profile.'
};

export default async function CardsPlanPage() {
  const { cards } = await getCardsData();

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="tool_started"
        properties={{ source: 'page_view', tool: 'cards_only_path', path: '/cards/plan' }}
      />
      <CardsOnlyPlanPath cards={cards} />
    </div>
  );
}
