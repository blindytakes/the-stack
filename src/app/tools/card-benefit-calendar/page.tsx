import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { CardBenefitCalendar } from '@/components/tools/card-benefit-calendar';

export const metadata: Metadata = {
  title: 'Card Benefit Calendar',
  description:
    'Create a calendar for card credits, benefit deadlines, annual fees, and renewal decisions.'
};

export default function CardBenefitCalendarPage() {
  return (
    <ToolPageShell
      tool="card_benefit_calendar"
      path="/tools/card-benefit-calendar"
      title="Card Benefit Calendar"
      description="Build a rolling reminder schedule for premium card credits, annual fees, and renewal decisions."
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <CardBenefitCalendar />
    </ToolPageShell>
  );
}
