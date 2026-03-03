import type { Metadata } from 'next';
import { CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Payout Planner',
  description:
    'Answer a few questions to build a personalized offer strategy based on your spending goals and credit profile.'
};

export default function CardFinderPage() {
  return (
    <ToolPageShell
      tool="card_finder"
      path="/tools/card-finder"
      tag="Tool 01"
      tagColorClassName="text-brand-teal"
      title="Payout Planner"
      description="Answer a few questions to get a short list of high-fit offers for your spend, fee tolerance, and goals."
    >
      <CardFinderTool />
    </ToolPageShell>
  );
}
