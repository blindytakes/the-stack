import type { Metadata } from 'next';
import { CardVsCardTool } from '@/components/tools/card-vs-card';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Card vs Card',
  description:
    'Compare two credit cards side by side on fees, rewards, benefits, sign-up bonuses, and more.'
};

export default function CardVsCardPage() {
  return (
    <ToolPageShell
      tool="card_vs_card"
      path="/tools/card-vs-card"
      tag="Tool 03"
      tagColorClassName="text-brand-coral"
      title="Card vs Card"
      description="Pick two cards and see a head-to-head breakdown on fees, rewards, and bonuses."
    >
      <CardVsCardTool />
    </ToolPageShell>
  );
}
