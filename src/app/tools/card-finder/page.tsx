import type { Metadata } from 'next';
import { CardFinderTool } from '@/components/tools/card-finder';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';

export const metadata: Metadata = {
  title: 'Card Finder',
  description: 'Answer a few questions to get personalized credit card recommendations based on your spending and goals.'
};

export default function CardFinderPage() {
  return (
    <div className="container-page pt-12">
      <TrackFunnelEventOnView
        event="tool_started"
        properties={{ source: 'page_view', tool: 'card_finder', path: '/tools/card-finder' }}
      />
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Tool 01</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">Card Finder</h1>
        <p className="mt-4 text-lg text-text-secondary">
          Answer a few questions to get a short list of cards tailored to your spend, fees, and goals.
        </p>
      </div>
      <CardFinderTool />
    </div>
  );
}
