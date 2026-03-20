import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SavedPlanView } from '@/components/plan/saved-plan-view';
import { getSavedPlanSnapshot } from '@/lib/services/plan-snapshot-service';

type Props = {
  params: Promise<{ planId: string }>;
};

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved Bonus Plan',
  description: 'A saved snapshot of your personalized card and banking bonus plan.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function SavedPlanPage({ params }: Props) {
  const { planId } = await params;
  const result = await getSavedPlanSnapshot(planId);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }

    return (
      <div className="mx-auto w-full max-w-[80rem] px-5 pt-12 pb-16">
        <section className="rounded-3xl border border-white/10 bg-bg-surface p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-coral">Saved plan unavailable</p>
          <h1 className="mt-3 font-heading text-4xl text-text-primary">We could not load this saved plan</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            {result.error}
          </p>
        </section>
      </div>
    );
  }

  return (
    <SavedPlanView
      planId={result.body.planId}
      createdAt={result.body.createdAt}
      snapshot={result.body.snapshot}
    />
  );
}
