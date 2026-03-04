'use client';

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
      <CardFinderProgress stepIndex={stepIndex} totalSteps={steps.length} progress={progress} />

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
