'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { CardRecord } from '@/lib/cards';
import type { QuizRequest, QuizResult } from '@/lib/quiz-engine';

const popularOwnedCardSlugs = [
  'amex-gold-card',
  'amex-platinum-card',
  'capital-one-venture-x',
  'chase-sapphire-preferred',
  'chase-sapphire-reserve',
  'chase-freedom-unlimited',
  'amex-blue-cash-preferred',
  'bilt-mastercard'
] as const;
const commonCardLimit = popularOwnedCardSlugs.length;

export type CardSelectionQuestionId = 'ownedCardSlugs' | 'amexLifetimeBlockedSlugs';

export type FinderOptionStep = {
  id: Exclude<keyof QuizRequest, CardSelectionQuestionId>;
  type?: 'options';
  title: string;
  options: Array<{ label: string; value: string }>;
};

export type FinderCardSelectionStep = {
  id: CardSelectionQuestionId;
  type: 'card_selection';
  title: string;
  description: string;
};

export type FinderQuestionStep = FinderOptionStep | FinderCardSelectionStep;

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
  step: FinderOptionStep;
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

export function CardSelectionQuestion({
  step,
  cards,
  selectedSlugs,
  onToggle,
  onClear,
  searchId,
  searchLabel = 'Search cards',
  searchPlaceholder = 'Search by card name or issuer',
  selectedHeading,
  selectedSummary,
  emptySelectionText,
  loading = false,
  error = '',
  errorMessage = 'Card search is unavailable right now. You can skip this step and still build a plan.'
}: {
  step: FinderCardSelectionStep;
  cards: CardRecord[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  searchId: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  selectedHeading: string;
  selectedSummary: (count: number) => string;
  emptySelectionText: string;
  loading?: boolean;
  error?: string;
  errorMessage?: string;
}) {
  const [query, setQuery] = useState('');
  const [showAllCards, setShowAllCards] = useState(false);
  const [allCardsQuery, setAllCardsQuery] = useState('');
  useEffect(() => {
    setQuery('');
    setShowAllCards(false);
    setAllCardsQuery('');
  }, [step.id]);
  const trimmedQuery = query.trim().toLowerCase();
  const trimmedAllCardsQuery = allCardsQuery.trim().toLowerCase();
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  const selectedCardSet = new Set(selectedSlugs);
  const selectedCards = selectedSlugs
    .map((slug) => cardsBySlug.get(slug))
    .filter((card): card is CardRecord => Boolean(card));
  const sortedCards = [...cards].sort(
    (a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name)
  );
  const availableCards = sortedCards.filter((card) => !selectedCardSet.has(card.slug));
  const matchingCards = trimmedQuery
    ? availableCards
        .filter((card) => `${card.name} ${card.issuer}`.toLowerCase().includes(trimmedQuery))
        .slice(0, 8)
    : [];
  const popularCardSlugSet = new Set<string>(popularOwnedCardSlugs);
  const prioritizedCommonCards = popularOwnedCardSlugs
    .map((slug) => cardsBySlug.get(slug))
    .filter((card): card is CardRecord => Boolean(card))
    .filter((card) => !selectedCardSet.has(card.slug));
  const fallbackCommonCards = availableCards.filter((card) => !popularCardSlugSet.has(card.slug));
  const commonCards = [...prioritizedCommonCards, ...fallbackCommonCards].slice(0, commonCardLimit);
  const fullListCards = trimmedAllCardsQuery
    ? availableCards.filter((card) =>
        `${card.name} ${card.issuer}`.toLowerCase().includes(trimmedAllCardsQuery)
      )
    : availableCards;
  const allCardGroups = fullListCards.reduce<Array<{ issuer: string; cards: CardRecord[] }>>(
    (groups, card) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.issuer === card.issuer) {
        lastGroup.cards.push(card);
        return groups;
      }

      groups.push({ issuer: card.issuer, cards: [card] });
      return groups;
    },
    []
  );

  return (
    <div className="mt-8">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-text-primary">{step.title}</h2>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Optional
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">{step.description}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <label
            htmlFor={searchId}
            className="text-xs uppercase tracking-[0.22em] text-text-muted"
          >
            {searchLabel}
          </label>
          <input
            id={searchId}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
          />

          {loading ? (
            <p className="mt-4 text-sm text-text-muted">Loading the active card catalog…</p>
          ) : error ? (
            <p className="mt-4 text-sm text-brand-coral">{errorMessage}</p>
          ) : trimmedQuery ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Matches</p>
              {matchingCards.length > 0 ? (
                matchingCards.map((card) => (
                  <button
                    key={card.slug}
                    type="button"
                    onClick={() => {
                      onToggle(card.slug);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-bg px-4 py-3 text-left transition hover:border-brand-teal/40 hover:bg-brand-teal/5"
                  >
                    <span>
                      <span className="block text-xs uppercase tracking-[0.2em] text-text-muted">
                        {card.issuer}
                      </span>
                      <span className="mt-1 block text-sm text-text-primary">{card.name}</span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-teal">
                      Add
                    </span>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-text-muted">
                  No cards matched that search. Try an issuer name like Chase or Amex.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Common cards</p>
                {availableCards.length > commonCards.length && (
                  <button
                    type="button"
                    onClick={() => setShowAllCards(true)}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-teal transition hover:opacity-80"
                  >
                    {`Browse all ${availableCards.length} cards`}
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {commonCards.map((card) => (
                  <button
                    key={card.slug}
                    type="button"
                    onClick={() => onToggle(card.slug)}
                    className="rounded-full border border-white/10 bg-bg px-3 py-2 text-sm text-text-secondary transition hover:border-brand-teal/40 hover:bg-brand-teal/5 hover:text-text-primary"
                  >
                    {card.name}
                  </button>
                ))}
                {commonCards.length === 0 && (
                  <p className="text-sm text-text-muted">Start typing to search the full card list.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">{selectedHeading}</p>
              <p className="mt-2 text-sm text-text-secondary">
                {selectedCards.length > 0
                  ? selectedSummary(selectedCards.length)
                  : 'No cards selected yet. You can skip this for now.'}
              </p>
            </div>
            {selectedCards.length > 0 && (
              <Button variant="ghost" onClick={onClear}>
                Clear all
              </Button>
            )}
          </div>

          {selectedCards.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCards.map((card) => (
                <button
                  key={card.slug}
                  type="button"
                  onClick={() => onToggle(card.slug)}
                  className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-sm text-text-primary transition hover:border-brand-teal/50"
                >
                  {card.name}
                  <span className="ml-2 text-text-muted">Remove</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-text-muted">
              {emptySelectionText}
            </p>
          )}
        </div>
      </div>

      {showAllCards && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowAllCards(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl border border-white/10 bg-bg-elevated p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Full card list</p>
                <h3 className="mt-2 text-2xl font-semibold text-text-primary">
                  Browse every active card
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Add any cards you already have. Selected cards disappear from this list automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCards(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <label
                htmlFor={`${searchId}-all-cards`}
                className="text-xs uppercase tracking-[0.22em] text-text-muted"
              >
                Search full list
              </label>
              <input
                id={`${searchId}-all-cards`}
                type="text"
                value={allCardsQuery}
                onChange={(event) => setAllCardsQuery(event.target.value)}
                placeholder="Search by card name or issuer"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
              />
            </div>

            <div className="mt-6 max-h-[60vh] space-y-5 overflow-y-auto pr-2">
              {allCardGroups.length > 0 ? (
                allCardGroups.map((group) => (
                  <div key={group.issuer}>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
                      {group.issuer}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.cards.map((card) => (
                        <button
                          key={card.slug}
                          type="button"
                          onClick={() => onToggle(card.slug)}
                          className="rounded-full border border-white/10 bg-bg px-3 py-2 text-sm text-text-secondary transition hover:border-brand-teal/40 hover:bg-brand-teal/5 hover:text-text-primary"
                        >
                          {card.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-text-muted">
                  No cards matched that search.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CardFinderActions({
  canGoBack,
  canContinue,
  isLastStep,
  isComplete,
  loading,
  continueLabel,
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
  continueLabel?: string;
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
          {loading ? (submittingLabel ?? 'Scoring...') : (submitLabel ?? 'See my bonus plan')}
        </Button>
      ) : (
        <Button onClick={onContinue} disabled={!canContinue || isLastStep}>
          {continueLabel ?? 'Continue'}
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
