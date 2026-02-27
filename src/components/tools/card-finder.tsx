'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { QuizRequest, QuizResult } from '@/lib/quiz-engine';

const steps = [
  {
    id: 'goal',
    title: 'Your main goal',
    options: [
      { label: 'Cash back', value: 'cashback' },
      { label: 'Travel points', value: 'travel' },
      { label: 'Balance flexibility', value: 'flexibility' }
    ]
  },
  {
    id: 'spend',
    title: 'Biggest monthly spend',
    options: [
      { label: 'Groceries', value: 'groceries' },
      { label: 'Dining', value: 'dining' },
      { label: 'Travel', value: 'travel' },
      { label: 'Everything', value: 'all' }
    ]
  },
  {
    id: 'fee',
    title: 'Annual fee preference',
    options: [
      { label: 'No annual fee', value: 'no_fee' },
      { label: 'Up to $95', value: 'up_to_95' },
      { label: 'Over $95 is ok', value: 'over_95_ok' }
    ]
  },
  {
    id: 'credit',
    title: 'Credit tier',
    options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Building', value: 'building' }
    ]
  }
];

type QuizAnswers = Partial<QuizRequest>;

export function CardFinderTool() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const current = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const canContinue = Boolean(answers[current.id as keyof QuizAnswers]);

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);
  const isComplete = steps.every((step) => answers[step.id as keyof QuizAnswers]);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });

      if (!res.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = (await res.json()) as { results: QuizResult[] };
      setResults(data.results);
    } catch {
      setError('Could not load recommendations.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-text-muted">
          Step {stepIndex + 1} of {steps.length}
        </div>
        <div className="h-2 w-36 rounded-full bg-bg-surface">
          <div className="h-full rounded-full bg-brand-teal" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-8">
        <motion.h2
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-semibold"
        >
          {current.title}
        </motion.h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {current.options.map((option) => {
            const active = answers[current.id as keyof QuizAnswers] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.value }))}
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

      <div className="mt-8 flex flex-wrap justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={stepIndex === 0}
        >
          Back
        </Button>
        {isLastStep && isComplete ? (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Scoring…' : 'See my results'}
          </Button>
        ) : (
          <Button
            onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={!canContinue || isLastStep}
          >
            Continue
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-10">
          <p className="text-sm text-brand-coral">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 p-4">
            <p className="text-sm text-text-secondary">Top matches based on your inputs</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {results.map((card) => (
              <Link
                key={card.slug}
                href={`/cards/${card.slug}`}
                className="group rounded-2xl border border-white/10 bg-bg-surface p-4 transition hover:-translate-y-1 hover:border-white/20"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{card.issuer}</p>
                <h3 className="mt-3 text-lg font-semibold text-text-primary group-hover:text-brand-teal transition">{card.name}</h3>
                <p className="mt-2 text-sm text-text-secondary">{card.headline}</p>
                <div className="mt-3 text-xs text-text-muted">
                  Annual fee: {card.annualFee === 0 ? '$0' : `$${card.annualFee}`}
                </div>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setAnswers({});
                setResults(null);
                setError('');
                setStepIndex(0);
              }}
            >
              Restart quiz
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
