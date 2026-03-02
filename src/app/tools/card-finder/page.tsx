import type { Metadata } from 'next';
import { CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Card Finder',
  description: 'Answer a few questions to get personalized credit card recommendations based on your spending and goals.'
};

export default function CardFinderPage() {
  return (
    <ToolPageShell
      tool="card_finder"
      path="/tools/card-finder"
      tag="Tool 01"
      tagColorClassName="text-brand-teal"
      title="Card Finder"
      description="Answer a few questions to get a short list of cards tailored to your spend, fees, and goals."
    >
      <CardFinderTool />
    </ToolPageShell>
  );
}
