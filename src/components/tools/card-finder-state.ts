'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizRequestSchema, type QuizRequest } from '@/lib/quiz-engine';
import { buildPlanResultsPayload, savePlanResults } from '@/lib/plan-results-storage';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { cardFinderSteps } from '@/components/tools/card-finder-config';
import type { CardSelectionQuestionId } from '@/components/tools/card-finder-sections';
import type { PlanScheduleItem } from '@/lib/plan-engine';
import type {
  PlannerExcludedOffer,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

type QuizAnswers = Partial<QuizRequest>;
type PlanApiResponse = {
  generatedAt: number;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanScheduleItem[];
};

export function useCardFinderState() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStep = cardFinderSteps[stepIndex];
  const isLastStep = stepIndex === cardFinderSteps.length - 1;
  const canContinue =
    currentStep.type === 'card_selection' ? true : Boolean(answers[currentStep.id]);
  const progress = useMemo(
    () => ((stepIndex + 1) / cardFinderSteps.length) * 100,
    [stepIndex]
  );
  const isComplete = cardFinderSteps.every((step) =>
    step.type === 'card_selection' ? true : Boolean(answers[step.id])
  );

  function selectCurrentOption(value: string) {
    if (currentStep.type === 'card_selection') {
      return;
    }

    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  }

  function updateCardSelection(selectionId: CardSelectionQuestionId, nextValues: string[]) {
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
    const currentValues = answers[selectionId] ?? [];
    const next = new Set(currentValues);
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
  }

  function goForward() {
    setStepIndex((prev) => Math.min(cardFinderSteps.length - 1, prev + 1));
  }

  function resetFinder() {
    setAnswers({});
    setError('');
    setStepIndex(0);
  }

  async function submitQuiz() {
    setLoading(true);
    setError('');

    const parsedAnswers = quizRequestSchema.safeParse({
      ...answers,
      amexLifetimeBlockedSlugs: [],
      goal: 'flexibility',
      spend: 'all',
      fee: 'over_95_ok',
      pace: 'balanced'
    });
    if (!parsedAnswers.success) {
      setLoading(false);
      setError('Please answer all questions before continuing.');
      return;
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: parsedAnswers.data
        })
      });
      if (!res.ok) throw new Error('Failed to build plan');

      const data = (await res.json()) as PlanApiResponse;
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
        source: 'card_finder',
        tool: 'card_finder'
      });
      router.push('/plan/results');
    } catch {
      setError('Could not load recommendations.');
    } finally {
      setLoading(false);
    }
  }

  return {
    steps: cardFinderSteps,
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
    submitQuiz,
    resetFinder
  };
}
