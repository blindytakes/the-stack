import type { Metadata } from 'next';
import { HiddenBenefitsTool } from '@/components/tools/hidden-benefits';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Hidden Benefits',
  description:
    'Discover the hidden perks of your credit card — from purchase protection to travel credits — with estimated annual values.'
};

export default function HiddenBenefitsPage() {
  return (
    <ToolPageShell
      tool="hidden_benefits"
      path="/tools/hidden-benefits"
      tag="Tool 02"
      tagColorClassName="text-brand-gold"
      title="Hidden Benefits"
      description="Select your card and see which protections and credits are worth real money."
    >
      <HiddenBenefitsTool />
    </ToolPageShell>
  );
}
