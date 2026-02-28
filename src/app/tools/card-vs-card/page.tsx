import type { Metadata } from 'next';
import { CardVsCardTool } from '@/components/tools/card-vs-card';

export const metadata: Metadata = {
  title: 'Card vs Card',
  description:
    'Compare two credit cards side by side on fees, rewards, benefits, sign-up bonuses, and more.'
};

export default function CardVsCardPage() {
  return (
    <div className="container-page pt-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-coral">Tool 03</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">
          Card vs Card
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Pick two cards and see a head-to-head breakdown on fees, rewards, and bonuses.
        </p>
      </div>
      <CardVsCardTool />
    </div>
  );
}
