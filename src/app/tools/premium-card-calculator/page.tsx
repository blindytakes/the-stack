import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PremiumCardCalculator } from '@/components/tools/premium-card-calculator';

export const metadata: Metadata = {
  title: 'Premium Card Calculator',
  description:
    'Compare Amex Platinum, Chase Sapphire Reserve, and Capital One Venture X using your real spend, point value, credit usage, and annual-fee math.'
};

export default function PremiumCardCalculatorPage() {
  return (
    <ToolPageShell
      tool="premium_card_calculator"
      path="/tools/premium-card-calculator"
      title="Premium Card Calculator"
      description="See whether Amex Platinum, Sapphire Reserve, or Venture X actually makes sense under your own assumptions."
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PremiumCardCalculator />
    </ToolPageShell>
  );
}
