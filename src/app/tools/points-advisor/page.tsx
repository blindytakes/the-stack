import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PointsAdvisor } from '@/components/tools/points-advisor';

export const metadata: Metadata = {
  title: 'Points Redemption Tool',
  description:
    'Enter your points balance and price real redemptions across Chase, Amex, Capital One, and Citi points programs.'
};

export default function PointsAdvisorPage() {
  return (
    <ToolPageShell
      tool="points_redemption_advisor"
      path="/tools/points-advisor"
      title="Points Redemption Tool"
      description="See the strongest easy exits, transfer plays, hold decisions, and trip-specific redemption math for your points balance."
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PointsAdvisor />
    </ToolPageShell>
  );
}
