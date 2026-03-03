'use client';

import { useMemo, useState } from 'react';
import type { QuizRequest, QuizResult } from '@/lib/quiz-engine';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { cardFinderSteps } from '@/components/tools/card-finder-config';

type QuizAnswers = Partial<QuizRequest>;

export function useCardFinderState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [results, setResults] = useState<QuizResult[] | null>(null);
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
    setResults(null);
    setError('');
    setStepIndex(0);
  }

  async function submitQuiz() {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      if (!res.ok) throw new Error('Failed to fetch results');

      const data = (await res.json()) as { results: QuizResult[] };
      setResults(data.results);
      trackFunnelEvent('quiz_completed', {
        source: 'card_finder',
        tool: 'card_finder'
      });
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
    results,
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
