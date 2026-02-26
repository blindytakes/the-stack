'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 'goal',
    title: 'Your main goal',
    options: ['Cash back', 'Travel points', 'Balance flexibility']
  },
  {
    id: 'spend',
    title: 'Biggest monthly spend',
    options: ['Groceries', 'Dining', 'Travel', 'Everything']
  },
  {
    id: 'fee',
    title: 'Annual fee preference',
    options: ['No annual fee', 'Up to $95', 'Over $95 is ok']
  },
  {
    id: 'credit',
    title: 'Credit tier',
    options: ['Excellent', 'Good', 'Fair / Building']
  }
];

const mockResults = [
  {
    name: 'Apex Cash Plus',
    issuer: 'Apex Bank',
    headline: '2.5% on everything with no fee',
    fit: ['Flat-rate rewards', 'No annual fee', 'Simple redemption']
  },
  {
    name: 'Summit Travel Prime',
    issuer: 'Summit',
    headline: '3x points on travel + lounge credits',
    fit: ['Travel-heavy spend', 'Premium perks', 'Transfer partners']
  },
  {
    name: 'CityLine Rewards',
    issuer: 'CityLine',
    headline: '4% dining + 3% groceries',
    fit: ['Dining focus', 'Everyday earn', 'Quarterly boosts']
  }
];

export function CardFinderTool() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const canContinue = Boolean(answers[current.id]);

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

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
            const active = answers[current.id] === option;
            return (
              <button
                key={option}
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option }))}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'border-brand-teal bg-brand-teal/10 text-text-primary'
                    : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
                }`}
              >
                {option}
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
        <Button
          onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
          disabled={!canContinue || isLastStep}
        >
          Continue
        </Button>
      </div>

      {isLastStep && answers[current.id] && (
        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 p-4">
            <p className="text-sm text-text-secondary">Top matches based on your inputs</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mockResults.map((card) => (
              <div key={card.name} className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{card.issuer}</p>
                <h3 className="mt-3 text-lg font-semibold text-text-primary">{card.name}</h3>
                <p className="mt-2 text-sm text-text-secondary">{card.headline}</p>
                <ul className="mt-3 space-y-1 text-xs text-text-muted">
                  {card.fit.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Button>View full details</Button>
            <Button variant="ghost">Restart quiz</Button>
          </div>
        </div>
      )}
    </section>
  );
}
