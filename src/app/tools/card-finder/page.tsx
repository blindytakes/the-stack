import type { Metadata } from 'next';
import { CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Payout Planner',
  description:
    'Build a full bonus plan across cards and bank offers, or choose the shorter card-only path for welcome bonuses only.'
};

export default function CardFinderPage() {
  return (
    <ToolPageShell
      tool="card_finder"
      path="/tools/card-finder"
      tag="Tool 01"
      tagColorClassName="text-brand-teal"
      title="Payout Planner"
      description="Build a full 12-month bonus plan across cards and bank offers, or switch to the shorter card-only path if you only want welcome bonuses."
    >
      <CardFinderTool />
    </ToolPageShell>
  );
}
