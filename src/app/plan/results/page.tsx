import type { Metadata } from 'next';
import { PlanResultsView } from '@/components/plan/plan-results-view';

export const metadata: Metadata = {
  title: 'Your Bonus Plan',
  description: 'Your personalized 6-month card and banking bonus action plan.',
  robots: {
    index: false,
    follow: false
  }
};

export default function PlanResultsPage() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-5 pt-12 pb-16">
      <PlanResultsView />
    </div>
  );
}
