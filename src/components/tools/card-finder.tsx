'use client';

import Link from 'next/link';
import {
  BankSelectionQuestion,
  CardSelectionQuestion,
  CardFinderActions,
  CardFinderProgress,
  CardFinderQuestion,
  CardFinderSelectQuestion,
} from '@/components/tools/card-finder-sections';
import { useCardFinderState } from '@/components/tools/card-finder-state';
import type { CardRecord } from '@/lib/cards';
import type { SelectedOfferIntent } from '@/lib/plan-contract';

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

export function CardFinderTool({
  cards,
  bankNames = [],
  selectedOfferIntent = null
}: {
  cards: CardRecord[];
  bankNames?: string[];
  selectedOfferIntent?: SelectedOfferIntent | null;
}) {
  const {
    steps,
    stepIndex,
    currentStep,
    answers,
    selectedOfferIntent: activeSelectedOfferIntent,
    loading,
    error,
    progress,
    isLastStep,
    isComplete,
    canContinue,
    selectCurrentOption,
    toggleCardSelection,
    clearCardSelection,
    toggleBankSelection,
    clearBankSelection,
    clearSelectedOfferIntent,
    goBack,
    goForward,
    submitQuiz
  } = useCardFinderState(selectedOfferIntent);
  const selectionCards = currentStep.type !== 'card_selection' ? [] : cards;

  const isOptionalStep =
    currentStep.type === 'card_selection' || currentStep.type === 'bank_selection';
  const optionalStepEmpty =
    isOptionalStep && (answers[currentStep.id]?.length ?? 0) === 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {activeSelectedOfferIntent ? (
        <div className="mb-6 rounded-2xl border border-brand-teal/20 bg-brand-teal/10 px-4 py-4 md:px-5">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-teal">Selected offer</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-text-primary md:text-base">
            Building around <span className="font-semibold">{activeSelectedOfferIntent.title}</span> from{' '}
            {activeSelectedOfferIntent.provider} if it still fits your profile, pace, and timeline.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={activeSelectedOfferIntent.detailPath}
              className="font-semibold text-brand-teal transition hover:underline"
            >
              View offer
            </Link>
            <button
              type="button"
              onClick={clearSelectedOfferIntent}
              className="text-text-muted transition hover:text-text-primary"
            >
              Clear selection
            </button>
          </div>
        </div>
      ) : null}

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
        />
      ) : currentStep.type === 'bank_selection' ? (
        <BankSelectionQuestion
          step={currentStep}
          bankNames={bankNames}
          selectedNames={answers[currentStep.id] ?? []}
          onToggle={toggleBankSelection}
          onClear={clearBankSelection}
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
        continueLabel={optionalStepEmpty ? 'Skip for now' : 'Continue'}
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
