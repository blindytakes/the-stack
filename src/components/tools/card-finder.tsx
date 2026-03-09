'use client';

import Link from 'next/link';
import {
  CardFinderActions,
  CardFinderProgress,
  CardFinderQuestion
} from '@/components/tools/card-finder-sections';
import { useCardFinderState } from '@/components/tools/card-finder-state';

export function CardFinderTool() {
  const {
    steps,
    stepIndex,
    currentStep,
    answers,
    loading,
    error,
    progress,
    isLastStep,
    isComplete,
    canContinue,
    selectCurrentOption,
    goBack,
    goForward,
    submitQuiz
  } = useCardFinderState();

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Choose Your Path</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 p-4">
            <p className="text-sm font-semibold text-text-primary">Full bonus plan</p>
            <p className="mt-2 text-sm text-text-secondary">
              Cards + bank bonuses. Slightly longer intake, higher total payout ceiling.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-brand-teal">Current path</p>
          </div>
          <Link
            href="/cards#card-plan"
            className="rounded-2xl border border-white/10 bg-bg/40 p-4 transition hover:border-white/30 hover:bg-bg-surface"
          >
            <p className="text-sm font-semibold text-text-primary">Card bonuses only</p>
            <p className="mt-2 text-sm text-text-secondary">
              Shorter flow focused only on welcome bonuses from credit cards.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-text-muted">Shorter intake</p>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <CardFinderProgress stepIndex={stepIndex} totalSteps={steps.length} progress={progress} />
      </div>

      <CardFinderQuestion
        step={currentStep}
        selectedValue={answers[currentStep.id]}
        onSelect={selectCurrentOption}
      />

      <CardFinderActions
        canGoBack={stepIndex > 0}
        canContinue={canContinue}
        isLastStep={isLastStep}
        isComplete={isComplete}
        loading={loading}
        onBack={goBack}
        onContinue={goForward}
        onSubmit={submitQuiz}
      />

      {error && (
        <div className="mt-10">
          <p className="text-sm text-brand-coral">{error}</p>
        </div>
      )}
    </section>
  );
}
