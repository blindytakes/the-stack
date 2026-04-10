import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PremiumCardCalculator } from '@/components/tools/premium-card-calculator';

export const metadata: Metadata = {
  title: 'Travel Rewards Card Calculator',
  description:
    'Compare premium and mid-fee travel rewards cards using your real spend, point value, credits, and annual-fee math.'
};

export default function PremiumCardCalculatorPage() {
  return (
    <ToolPageShell
      tool="premium_card_calculator"
      path="/tools/premium-card-calculator"
      title="Travel Rewards Card Calculator"
      description="See whether a flagship premium card or a lower-fee travel earner actually makes sense under your own assumptions."
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PremiumCardCalculator />
    </ToolPageShell>
  );
}
