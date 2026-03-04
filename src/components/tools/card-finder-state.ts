'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizRequestSchema, type QuizRequest, type QuizResult } from '@/lib/quiz-engine';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import { buildPlanRecommendationsFromQuiz } from '@/lib/planner-recommendations';
import { buildPlanResultsPayload, savePlanResults } from '@/lib/plan-results-storage';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { cardFinderSteps } from '@/components/tools/card-finder-config';

type QuizAnswers = Partial<QuizRequest>;

export function useCardFinderState() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStep = cardFinderSteps[stepIndex];
  const isLastStep = stepIndex === cardFinderSteps.length - 1;
  const canContinue = Boolean(answers[currentStep.id]);
  const progress = useMemo(
    () => ((stepIndex + 1) / cardFinderSteps.length) * 100,
    [stepIndex]
  );
  const isComplete = cardFinderSteps.every((step) => answers[step.id]);

  function selectCurrentOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
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

    const parsedAnswers = quizRequestSchema.safeParse(answers);
    if (!parsedAnswers.success) {
      setLoading(false);
      setError('Please answer all questions before continuing.');
      return;
    }

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedAnswers.data)
      });
      if (!res.ok) throw new Error('Failed to fetch results');

      const data = (await res.json()) as { results: QuizResult[] };
      const bankingBonuses = getBankingBonusesData().bonuses;
      const planBundle = buildPlanRecommendationsFromQuiz(
        data.results,
        bankingBonuses,
        parsedAnswers.data,
        {
          maxCards: 3,
          maxBanking: 3
        }
      );
      savePlanResults(
        buildPlanResultsPayload({
          answers: parsedAnswers.data,
          recommendations: planBundle.recommendations,
          exclusions: planBundle.exclusions
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
    goBack,
    goForward,
    submitQuiz,
    resetFinder
  };
}
