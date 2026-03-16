import type { Metadata } from 'next';
import { HiddenBenefitsTool } from '@/components/tools/hidden-benefits';
import { ToolPageShell } from '@/components/layout/tool-page-shell';

export const metadata: Metadata = {
  title: 'Hidden Benefits',
  description:
    'Find money you are leaving on the table in your card benefits, from protections to credits, with estimated annual values.'
};

export default function HiddenBenefitsPage() {
  return (
    <ToolPageShell
      tool="hidden_benefits"
      path="/tools/hidden-benefits"
      title="Hidden Benefits"
      description=""
    >
      <HiddenBenefitsTool />
    </ToolPageShell>
  );
}
