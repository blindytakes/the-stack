'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import {
  CardFinderActions,
  CardFinderProgress,
  CardFinderQuestion,
  type FinderQuestionStep
} from '@/components/tools/card-finder-sections';
import { buildPlanResultsPayload, savePlanResults } from '@/lib/plan-results-storage';
import { quizRequestSchema } from '@/lib/quiz-engine';
import type { PlanScheduleItem } from '@/lib/plan-engine';
import type {
  PlannerExcludedOffer,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

type CardOnlyQuestionId = 'goal' | 'spend' | 'monthlySpend' | 'fee' | 'credit' | 'pace';
type CardOnlyAnswers = Partial<Record<CardOnlyQuestionId, string>>;
type PlanApiResponse = {
  generatedAt: number;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanScheduleItem[];
};

type CardOnlyStep = FinderQuestionStep & { id: CardOnlyQuestionId };

const cardOnlySteps: CardOnlyStep[] = [
  {
    id: 'goal',
    title: 'What is your top goal right now?',
    options: [
      { label: 'Fast cash value', value: 'cashback' },
      { label: 'Travel upside', value: 'travel' },
      { label: 'Flexible rewards', value: 'flexibility' }
    ]
  },
  {
    id: 'spend',
    title: 'Where does most of your monthly spend go?',
    options: [
      { label: 'Groceries', value: 'groceries' },
      { label: 'Dining', value: 'dining' },
      { label: 'Travel', value: 'travel' },
      { label: 'General spending', value: 'all' }
    ]
  },
  {
    id: 'monthlySpend',
    title: 'How much normal monthly spend can you put on a new card?',
    options: [
      { label: 'Under $1,000', value: 'lt_1000' },
      { label: '$1,000 to $2,500', value: 'from_1000_to_2500' },
      { label: '$2,500 to $5,000', value: 'from_2500_to_5000' },
      { label: '$5,000+', value: 'at_least_5000' }
    ]
  },
  {
    id: 'fee',
    title: 'What annual fee range are you comfortable with?',
    options: [
      { label: 'No annual fee', value: 'no_fee' },
      { label: 'Up to $95', value: 'up_to_95' },
      { label: 'Over $95 is fine', value: 'over_95_ok' }
    ]
  },
  {
    id: 'credit',
    title: 'How would you describe your credit profile?',
    options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Building', value: 'building' }
    ]
  },
  {
    id: 'pace',
    title: 'How aggressive should your 12-month plan be?',
    options: [
      { label: 'Conservative (2 cards)', value: 'conservative' },
      { label: 'Balanced (3 cards)', value: 'balanced' },
      { label: 'Aggressive (4 cards)', value: 'aggressive' }
    ]
  }
];

export function CardsOnlyPlanPath() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<CardOnlyAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStep = cardOnlySteps[stepIndex];
  const selectedValue = answers[currentStep.id];
  const isLastStep = stepIndex === cardOnlySteps.length - 1;
  const canContinue = Boolean(selectedValue);
  const isComplete = cardOnlySteps.every((step) => answers[step.id]);
  const progress = useMemo(
    () => ((stepIndex + 1) / cardOnlySteps.length) * 100,
    [stepIndex]
  );

  function selectCurrentOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
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
      goal: answers.goal,
      spend: answers.spend,
      monthlySpend: answers.monthlySpend,
      fee: answers.fee,
      credit: answers.credit,
      directDeposit: 'no',
      openingCash: 'lt_2000',
      state: 'OT',
      pace: answers.pace
    });

    if (!parsedAnswers.success) {
      setLoading(false);
      setError('Please answer all questions before continuing.');
      return;
    }

    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: parsedAnswers.data,
          options: {
            maxBanking: 0
          }
        })
      });
      if (!planRes.ok) throw new Error('Failed to build card plan');

      const data = (await planRes.json()) as PlanApiResponse;

      savePlanResults(
        buildPlanResultsPayload({
          savedAt: data.generatedAt,
          answers: parsedAnswers.data,
          recommendations: data.recommendations,
          exclusions: data.exclusions,
          schedule: data.schedule
        })
      );

      trackFunnelEvent('quiz_completed', {
        source: 'cards_page',
        tool: 'cards_only_path',
        path: '/cards'
      });
      router.push('/plan/results?mode=cards_only');
    } catch {
      setError('Could not build your card plan right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="card-plan" className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Card-Only Path</p>
          <h2 className="mt-2 font-heading text-3xl text-text-primary">Build My 12-Month Card Plan</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Answer six quick questions and get a focused roadmap based only on credit card bonuses.
          </p>
        </div>
        <Link href="#cards-directory" className="text-sm text-text-secondary transition hover:text-text-primary">
          Skip and browse cards
        </Link>
      </div>

      <div className="mt-8">
        <CardFinderProgress
          stepIndex={stepIndex}
          totalSteps={cardOnlySteps.length}
          progress={progress}
        />
      </div>

      <CardFinderQuestion
        step={currentStep}
        selectedValue={selectedValue}
        onSelect={selectCurrentOption}
      />

      <CardFinderActions
        canGoBack={stepIndex > 0}
        canContinue={canContinue}
        isLastStep={isLastStep}
        isComplete={isComplete}
        loading={loading}
        submitLabel="See my 12-month card plan"
        submittingLabel="Building plan..."
        onBack={goBack}
        onContinue={goForward}
        onSubmit={buildCardPlan}
      />

      {error && <p className="mt-4 text-sm text-brand-coral">{error}</p>}
      <p className="mt-4 text-xs text-text-muted">
        Need card + bank bonus strategy instead?{' '}
        <Link href="/tools/card-finder" className="text-brand-teal transition hover:underline">
          Use the full payout planner.
        </Link>
      </p>
    </section>
  );
}
