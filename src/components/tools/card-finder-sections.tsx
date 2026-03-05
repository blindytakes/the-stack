'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { QuizResult } from '@/lib/quiz-engine';

export type FinderQuestionStep = {
  id: string;
  title: string;
  options: Array<{ label: string; value: string }>;
};

export function CardFinderProgress({
  stepIndex,
  totalSteps,
  progress
}: {
  stepIndex: number;
  totalSteps: number;
  progress: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-[0.3em] text-text-muted">
        Step {stepIndex + 1} of {totalSteps}
      </div>
      <div className="h-2 w-36 rounded-full bg-bg-surface">
        <div className="h-full rounded-full bg-brand-teal" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function CardFinderQuestion({
  step,
  selectedValue,
  onSelect
}: {
  step: FinderQuestionStep;
  selectedValue?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-8">
      <motion.h2
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-semibold"
      >
        {step.title}
      </motion.h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {step.options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? 'border-brand-teal bg-brand-teal/10 text-text-primary'
                  : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CardFinderActions({
  canGoBack,
  canContinue,
  isLastStep,
  isComplete,
  loading,
  submitLabel,
  submittingLabel,
  onBack,
  onContinue,
  onSubmit
}: {
  canGoBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  isComplete: boolean;
  loading: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap justify-between gap-4">
      <Button variant="ghost" onClick={onBack} disabled={!canGoBack}>
        Back
      </Button>
      {isLastStep && isComplete ? (
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? (submittingLabel ?? 'Scoring...') : (submitLabel ?? 'See my payout plan')}
        </Button>
      ) : (
        <Button onClick={onContinue} disabled={!canContinue || isLastStep}>
          Continue
        </Button>
      )}
    </div>
  );
}

export function CardFinderResults({
  results,
  onRestart
}: {
  results: QuizResult[];
  onRestart: () => void;
}) {
  return (
    <div className="mt-10 space-y-4">
      <div className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 p-4">
        <p className="text-sm text-text-secondary">Top payout matches based on your inputs</p>
        <p className="mt-1 text-xs text-text-muted">
          Estimated value only. Outcomes vary by approvals, spend, and redemption choices.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {results.map((card) => (
          <Link
            key={card.slug}
            href={`/cards/${card.slug}?src=card_finder`}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-4 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{card.issuer}</p>
            <h3 className="mt-3 text-lg font-semibold text-text-primary transition group-hover:text-brand-teal">
              {card.name}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">{card.headline}</p>
            <div className="mt-3 text-xs text-text-muted">
              Annual fee: {card.annualFee === 0 ? '$0' : `$${card.annualFee}`}
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <Button variant="ghost" onClick={onRestart}>
          Restart plan
        </Button>
      </div>
    </div>
  );
}
