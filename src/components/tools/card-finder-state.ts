'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  quizRequestSchema,
  type PlannerAudience,
  type QuizRequest
} from '@/lib/quiz-engine';
import { submitPlanQuiz } from '@/lib/plan-client';
import type { SelectedOfferIntent } from '@/lib/plan-contract';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { buildCardFinderSteps } from '@/components/tools/card-finder-config';
import type {
  BankSelectionQuestionId,
  CardSelectionQuestionId,
  FinderQuestionStep
} from '@/components/tools/card-finder-sections';

type QuizAnswers = Partial<QuizRequest>;

export function useCardFinderState(
  initialSelectedOfferIntent: SelectedOfferIntent | null = null,
  audience: PlannerAudience = 'consumer'
) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selectedOfferIntent, setSelectedOfferIntent] = useState<SelectedOfferIntent | null>(
    initialSelectedOfferIntent
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = useMemo(
    () =>
      buildCardFinderSteps({
        directDeposit: answers.directDeposit,
        audience
      }),
    [answers.directDeposit, audience]
  );

  useEffect(() => {
    setStepIndex((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];

  function isOptionalStep(step: FinderQuestionStep) {
    return (
      step.type === 'card_selection' ||
      step.type === 'bank_selection' ||
      ('optional' in step && step.optional === true)
    );
  }

  const isLastStep = stepIndex === steps.length - 1;
  const canContinue = isOptionalStep(currentStep)
    ? true
    : Boolean(answers[currentStep.id]);
  const progress = useMemo(
    () => (stepIndex / steps.length) * 100,
    [stepIndex, steps.length]
  );
  const isComplete = steps.every((step) => isOptionalStep(step) || Boolean(answers[step.id]));

  function selectCurrentOption(value: string) {
    if (currentStep.type === 'card_selection' || currentStep.type === 'bank_selection') {
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

  function updateBankSelection(selectionId: BankSelectionQuestionId, nextValues: string[]) {
    setAnswers((prev) => ({
      ...prev,
      [selectionId]: nextValues
    }));
  }

  function toggleBankSelection(name: string) {
    if (currentStep.type !== 'bank_selection') {
      return;
    }

    const selectionId = currentStep.id;
    const currentValues = answers[selectionId] ?? [];
    const next = new Set(currentValues);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }

    updateBankSelection(selectionId, Array.from(next));
  }

  function clearBankSelection() {
    if (currentStep.type !== 'bank_selection') {
      return;
    }

    updateBankSelection(currentStep.id, []);
  }

  function goBack() {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  function goForward() {
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  }

  function resetFinder() {
    setAnswers({});
    setError('');
    setStepIndex(0);
  }

  function clearSelectedOfferIntent() {
    setSelectedOfferIntent(null);
  }

  async function submitQuiz() {
    setLoading(true);
    setError('');

    const parsedAnswers = quizRequestSchema.safeParse({
      ...answers,
      audience,
      amexLifetimeBlockedSlugs: [],
      goal: 'flexibility',
      spend: 'all',
      fee: 'over_95_ok',
      credit: 'good',
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
        selectedOfferIntent: selectedOfferIntent ?? undefined
      });

      trackFunnelEvent('quiz_completed', {
        source: audience === 'business' ? 'business_path' : 'card_finder',
        tool: audience === 'business' ? 'business_plan' : 'card_finder'
      });
      router.push(audience === 'business' ? '/plan/results?audience=business' : '/plan/results');
    } catch {
      setError('Could not load recommendations.');
    } finally {
      setLoading(false);
    }
  }

  return {
    steps,
    stepIndex,
    currentStep,
    answers,
    selectedOfferIntent,
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
    submitQuiz,
    resetFinder
  };
}
