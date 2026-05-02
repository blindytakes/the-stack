import type { Metadata } from 'next';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { PersonalFinanceTrackerDownload } from '@/components/tools/personal-finance-tracker-download';

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Download the personal finance tracker spreadsheet to log spending, bills, savings, and monthly cash flow.'
};

export default function PersonalFinanceTrackerPage() {
  return (
    <ToolPageShell
      tool="personal_finance_tracker"
      path="/tools/personal-finance-tracker"
      title="Personal Finance Tracker"
      description=""
      hideHeader
      containerClassName="pt-6 md:pt-8"
    >
      <PersonalFinanceTrackerDownload />
    </ToolPageShell>
  );
}
