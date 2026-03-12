'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import {
  CardSelectionQuestion,
  CardFinderActions,
  CardFinderProgress,
  CardFinderQuestion,
  CardFinderSelectQuestion,
  type FinderQuestionStep
} from '@/components/tools/card-finder-sections';
import { submitPlanQuiz } from '@/lib/plan-client';
import { quizRequestSchema, type QuizRequest } from '@/lib/quiz-engine';
import type { CardRecord } from '@/lib/cards';

type CardOnlyQuestionId =
  | 'ownedCardSlugs'
  | 'chase524Status'
  | 'spend'
  | 'monthlySpend'
  | 'credit';
type CardOnlyAnswers = Partial<
  Pick<
    QuizRequest,
    | 'ownedCardSlugs'
    | 'chase524Status'
    | 'spend'
    | 'monthlySpend'
    | 'credit'
  >
>;

type CardOnlyStep = FinderQuestionStep & { id: CardOnlyQuestionId };

const cardOnlySteps: CardOnlyStep[] = [
  {
    id: 'monthlySpend',
    type: 'options',
    title: 'How much normal monthly spend can you put on a new card?',
    description: 'This keeps minimum-spend targets grounded in what you can actually do.',
    options: [
      { label: 'Under $1,000', value: 'lt_1000' },
      { label: '$1,000 to $2,500', value: 'from_1000_to_2500' },
      { label: '$2,500 to $5,000', value: 'from_2500_to_5000' },
      { label: '$5,000+', value: 'at_least_5000' }
    ]
  },
  {
    id: 'spend',
    type: 'options',
    title: 'Where does most of your monthly spend go?',
    description: 'We use this to break ties between otherwise similar welcome-bonus options.',
    options: [
      { label: 'Groceries', value: 'groceries' },
      { label: 'Dining', value: 'dining' },
      { label: 'Travel', value: 'travel' },
      { label: 'General spending', value: 'all' }
    ]
  },
  {
    id: 'credit',
    type: 'options',
    title: 'How would you describe your credit profile?',
    description: 'This keeps the recommendations inside a realistic approval range.',
    options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Building', value: 'building' }
    ]
  },
  {
    id: 'chase524Status',
    type: 'options',
    title: 'What is your Chase 5/24 status?',
    description: 'This mostly affects Chase cards, but it can change the top of the plan.',
    options: [
      { label: 'Under 5/24', value: 'under_5_24' },
      { label: 'At or over 5/24', value: 'at_or_over_5_24' },
      { label: 'Not sure', value: 'not_sure' }
    ]
  },
  {
    id: 'ownedCardSlugs',
    type: 'card_selection',
    title: 'Which cards do you already have?',
    description: 'Optional, but useful. We will exclude cards you already have from new-card recommendations.'
  }
];

export function CardsOnlyPlanPath({ cards }: { cards: CardRecord[] }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<CardOnlyAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStep = cardOnlySteps[stepIndex];
  const selectedValue = currentStep.type === 'card_selection' ? undefined : answers[currentStep.id];
  const isLastStep = stepIndex === cardOnlySteps.length - 1;
  const canContinue = currentStep.type === 'card_selection' ? true : Boolean(selectedValue);
  const isComplete = cardOnlySteps.every((step) =>
    step.type === 'card_selection' ? true : Boolean(answers[step.id])
  );
  const progress = useMemo(
    () => ((stepIndex + 1) / cardOnlySteps.length) * 100,
    [stepIndex]
  );

  function selectCurrentOption(value: string) {
    if (currentStep.type === 'card_selection') {
      return;
    }

    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  }

  function updateCardSelection(selectionId: 'ownedCardSlugs', nextValues: string[]) {
    setAnswers((prev) => ({
      ...prev,
      [selectionId]: nextValues
    }));
  }

  function toggleCardSelection(slug: string) {
    if (currentStep.type !== 'card_selection') {
      return;
    }

    const selectionId = currentStep.id;
    const next = new Set(answers[selectionId] ?? []);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }

    updateCardSelection(selectionId, Array.from(next));
  }

  function clearCardSelection() {
    if (currentStep.type !== 'card_selection') {
      return;
    }

    updateCardSelection(currentStep.id, []);
  }

  function goBack() {
    setStepIndex((prev) => Math.max(0, prev - 1));
    setError('');
  }

  function goForward() {
    if (!canContinue) return;
    setStepIndex((prev) => Math.min(cardOnlySteps.length - 1, prev + 1));
    setError('');
  }

  async function buildCardPlan() {
    setLoading(true);
    setError('');

    const parsedAnswers = quizRequestSchema.safeParse({
      ownedCardSlugs: answers.ownedCardSlugs ?? [],
      amexLifetimeBlockedSlugs: [],
      chase524Status: answers.chase524Status,
      goal: 'flexibility',
      spend: answers.spend,
      monthlySpend: answers.monthlySpend,
      fee: 'over_95_ok',
      credit: answers.credit,
      directDeposit: 'no',
      state: 'OT',
      pace: 'balanced'
    });

    if (!parsedAnswers.success) {
      setLoading(false);
      setError('Please answer all questions before continuing.');
      return;
    }

    try {
      await submitPlanQuiz({
        answers: parsedAnswers.data,
        options: {
          maxBanking: 0
        }
      });

      trackFunnelEvent('quiz_completed', {
        source: 'cards_plan_page',
        tool: 'cards_only_path',
        path: '/cards/plan'
      });
      router.push('/plan/results?mode=cards_only');
    } catch {
      setError('Could not build your card plan right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Card-Only Path</p>
          <h2 className="mt-2 font-heading text-3xl text-text-primary">Build My 12-Month Card Plan</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Start with your spend capacity and credit profile, then layer in Chase status and
            cards you already hold to get a focused roadmap based only on welcome bonuses.
          </p>
        </div>
        <Link href="/cards" className="text-sm text-text-secondary transition hover:text-text-primary">
          Browse cards instead
        </Link>
      </div>

      <div className="mt-8">
        <CardFinderProgress
          stepIndex={stepIndex}
          totalSteps={cardOnlySteps.length}
          progress={progress}
          currentStepTitle={currentStep.title}
        />
      </div>

      {currentStep.type === 'card_selection' ? (
        <CardSelectionQuestion
          step={currentStep}
          cards={cards}
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
      ) : (
        currentStep.type === 'select' ? (
          <CardFinderSelectQuestion
            step={currentStep}
            selectedValue={typeof selectedValue === 'string' ? selectedValue : undefined}
            onSelect={selectCurrentOption}
          />
        ) : (
          <CardFinderQuestion
            step={currentStep}
            selectedValue={typeof selectedValue === 'string' ? selectedValue : undefined}
            onSelect={selectCurrentOption}
          />
        )
      )}

      <CardFinderActions
        canGoBack={stepIndex > 0}
        canContinue={canContinue}
        isLastStep={isLastStep}
        isComplete={isComplete}
        loading={loading}
        continueLabel={
          currentStep.type === 'card_selection' && (answers[currentStep.id]?.length ?? 0) === 0
            ? 'Skip for now'
            : 'Continue'
        }
        submitLabel="See my 12-month card plan"
        submittingLabel="Building plan..."
        onBack={goBack}
        onContinue={goForward}
        onSubmit={buildCardPlan}
      />

      {error && <p className="mt-4 text-sm text-brand-coral">{error}</p>}
      <p className="mt-4 text-xs text-text-muted">
        Need card + bank bonus strategy instead?{' '}
        <Link href="/tools/card-finder?mode=full" className="text-brand-teal transition hover:underline">
          Use the full payout planner.
        </Link>
      </p>
    </section>
  );
}
