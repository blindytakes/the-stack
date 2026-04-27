import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PointsAdvisor } from '@/components/tools/points-advisor';

export const metadata: Metadata = {
  title: 'Points Redemption Advisor',
  description:
    'Enter your points balance and get ranked redemption ideas for Chase Sapphire Reserve, Amex Membership Rewards, and Venture X.'
};

export default function PointsAdvisorPage() {
  return (
    <ToolPageShell
      tool="points_redemption_advisor"
      path="/tools/points-advisor"
      title="Points Redemption Advisor"
      description="See the strongest easy exits, transfer plays, and hold decisions for your points balance."
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PointsAdvisor />
    </ToolPageShell>
  );
}
