import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PersonalFinanceTrackerDownload } from '@/components/tools/personal-finance-tracker-download';

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Download the personal finance tracker spreadsheet to log spending, bills, savings, and monthly cash flow.'
};

export default function CardVsCardPage() {
  return (
    <ToolPageShell
      tool="card_vs_card"
      path="/tools/card-vs-card"
      title="Personal Finance Tracker"
      description=""
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PersonalFinanceTrackerDownload />
    </ToolPageShell>
  );
}
