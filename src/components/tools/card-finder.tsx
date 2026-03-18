'use client';

import Link from 'next/link';
import {
  CardSelectionQuestion,
  CardFinderActions,
  CardFinderProgress,
  CardFinderQuestion,
  CardFinderSelectQuestion,
} from '@/components/tools/card-finder-sections';
import { useCardFinderState } from '@/components/tools/card-finder-state';
import type { CardRecord } from '@/lib/cards';

export function CardFinderPathChooser() {
  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Choose Your Path</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Link
            href="/tools/card-finder?mode=full"
            className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 p-4 transition hover:border-brand-teal/60 hover:bg-brand-teal/15"
          >
            <p className="text-sm font-semibold text-text-primary">Full bonus plan</p>
            <p className="mt-2 text-sm text-text-secondary">
              Cards + bank bonuses. Includes direct deposit checks so the plan reflects offers you can actually complete.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-brand-teal">Cards + banking</p>
          </Link>
          <Link
            href="/cards/plan"
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
    </section>
  );
}

export function CardFinderTool({ cards }: { cards: CardRecord[] }) {
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
    toggleCardSelection,
    clearCardSelection,
    goBack,
    goForward,
    submitQuiz
  } = useCardFinderState();
  const selectionCards = currentStep.type !== 'card_selection' ? [] : cards;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div>
        <CardFinderProgress
          stepIndex={stepIndex}
          totalSteps={steps.length}
          progress={progress}
        />
      </div>

      {currentStep.type === 'card_selection' ? (
        <CardSelectionQuestion
          step={currentStep}
          cards={selectionCards}
          selectedSlugs={answers[currentStep.id] ?? []}
          onToggle={toggleCardSelection}
          onClear={clearCardSelection}
          searchId="owned-card-search"
          searchLabel="Search cards"
          searchPlaceholder="Search by card name or issuer"
          selectedHeading="Already open"
          selectedSummary={(count) =>
            `We’ll exclude ${count} current card${count === 1 ? '' : 's'} from new-card recommendations.`
          }
          emptySelectionText="Search for cards you already hold, or continue and add this later once you see your first draft."
        />
      ) : currentStep.type === 'select' ? (
        <CardFinderSelectQuestion
          step={currentStep}
          selectedValue={typeof answers[currentStep.id] === 'string' ? answers[currentStep.id] : undefined}
          onSelect={selectCurrentOption}
        />
      ) : (
        <CardFinderQuestion
          step={currentStep}
          selectedValue={typeof answers[currentStep.id] === 'string' ? answers[currentStep.id] : undefined}
          onSelect={selectCurrentOption}
          onAutoAdvance={goForward}
        />
      )}

      <CardFinderActions
        canGoBack={stepIndex > 0}
        canContinue={canContinue}
        isLastStep={isLastStep}
        isComplete={isComplete}
        loading={loading}
        hideContinue={currentStep.type === 'options'}
        continueLabel={
          currentStep.type === 'card_selection' && (answers[currentStep.id]?.length ?? 0) === 0
            ? 'Skip for now'
            : 'Continue'
        }
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
