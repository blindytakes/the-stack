import type { Metadata } from 'next';
import { CardVsCardTool } from '@/components/tools/card-vs-card';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Offer vs Offer',
  description:
    'Compare two offers side by side on net value, fees, rewards, benefits, and welcome bonuses.'
};

export default function CardVsCardPage() {
  return (
    <ToolPageShell
      tool="card_vs_card"
      path="/tools/card-vs-card"
      tag="Tool 03"
      tagColorClassName="text-brand-coral"
      title="Offer vs Offer"
      description="Pick two options and see a head-to-head net-value breakdown on fees, rewards, and bonuses."
    >
      <CardVsCardTool />
    </ToolPageShell>
  );
}
