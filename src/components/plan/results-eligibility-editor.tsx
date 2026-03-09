'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CardSelectionQuestion
} from '@/components/tools/card-finder-sections';
import {
  amexHistoryEditorStep,
  chase524Options,
  ownedCardsEditorStep,
  type EligibilityDraft
} from '@/components/plan/plan-results-config';
import { sameSlugSelections } from '@/components/plan/plan-results-utils';
import type { CardRecord } from '@/lib/cards';
import type { PlanResultsStoragePayload } from '@/lib/plan-results-storage';

type ResultsEligibilityEditorProps = {
  payload: PlanResultsStoragePayload;
  cards: CardRecord[];
  cardsLoading: boolean;
  cardsError: string;
  onUpdateEligibility: (draft: EligibilityDraft) => Promise<string | null>;
};

export function ResultsEligibilityEditor({
  payload,
  cards,
  cardsLoading,
  cardsError,
  onUpdateEligibility
}: ResultsEligibilityEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ownedCardSlugs, setOwnedCardSlugs] = useState(payload.answers.ownedCardSlugs);
  const [amexLifetimeBlockedSlugs, setAmexLifetimeBlockedSlugs] = useState(
    payload.answers.amexLifetimeBlockedSlugs
  );
  const [chase524Status, setChase524Status] = useState(payload.answers.chase524Status);
  const amexCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.issuer === 'American Express' &&
          (!ownedCardSlugs.includes(card.slug) || amexLifetimeBlockedSlugs.includes(card.slug))
      ),
    [amexLifetimeBlockedSlugs, cards, ownedCardSlugs]
  );
  const hasChanges =
    !sameSlugSelections(ownedCardSlugs, payload.answers.ownedCardSlugs) ||
    !sameSlugSelections(amexLifetimeBlockedSlugs, payload.answers.amexLifetimeBlockedSlugs) ||
    chase524Status !== payload.answers.chase524Status;

  useEffect(() => {
    setOwnedCardSlugs(payload.answers.ownedCardSlugs);
    setAmexLifetimeBlockedSlugs(payload.answers.amexLifetimeBlockedSlugs);
    setChase524Status(payload.answers.chase524Status);
    setError('');
    setLoading(false);
  }, [
    payload.answers.amexLifetimeBlockedSlugs,
    payload.answers.chase524Status,
    payload.answers.ownedCardSlugs
  ]);

  function closeEditor() {
    setOwnedCardSlugs(payload.answers.ownedCardSlugs);
    setAmexLifetimeBlockedSlugs(payload.answers.amexLifetimeBlockedSlugs);
    setChase524Status(payload.answers.chase524Status);
    setError('');
    setLoading(false);
    setIsOpen(false);
  }

  function toggleCardSelection(selectionId: 'ownedCardSlugs' | 'amexLifetimeBlockedSlugs', slug: string) {
    const updateSelection =
      selectionId === 'ownedCardSlugs' ? setOwnedCardSlugs : setAmexLifetimeBlockedSlugs;

    updateSelection((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return Array.from(next);
    });
  }

  async function handleUpdate() {
    setLoading(true);
    setError('');

    const result = await onUpdateEligibility({
      ownedCardSlugs,
      amexLifetimeBlockedSlugs,
      chase524Status
    });

    if (result) {
      setError(result);
      setLoading(false);
      return;
    }

    setIsOpen(false);
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Eligibility controls</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">
            Update current cards and issuer rules
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-secondary">
            Change these high-impact inputs here and rerank without restarting the planner.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (isOpen) {
              closeEditor();
              return;
            }
            setIsOpen(true);
          }}
          disabled={loading}
        >
          {isOpen ? 'Close editor' : 'Edit eligibility'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-6 border-t border-white/10 pt-2">
          <CardSelectionQuestion
            step={ownedCardsEditorStep}
            cards={cards}
            selectedSlugs={ownedCardSlugs}
            onToggle={(slug) => toggleCardSelection('ownedCardSlugs', slug)}
            onClear={() => setOwnedCardSlugs([])}
            searchId="results-owned-card-search"
            searchLabel="Search cards"
            searchPlaceholder="Search by card name or issuer"
            selectedHeading="Already open"
            selectedSummary={(count) =>
              `We’ll exclude ${count} current card${count === 1 ? '' : 's'} from new-card recommendations.`
            }
            emptySelectionText="Search for cards you already have open, or leave this blank if none apply."
            loading={cardsLoading}
            error={cardsError}
            errorMessage="Card search is unavailable right now. You can still update Chase 5/24 below."
          />

          <CardSelectionQuestion
            step={amexHistoryEditorStep}
            cards={amexCards}
            selectedSlugs={amexLifetimeBlockedSlugs}
            onToggle={(slug) => toggleCardSelection('amexLifetimeBlockedSlugs', slug)}
            onClear={() => setAmexLifetimeBlockedSlugs([])}
            searchId="results-amex-history-search"
            searchLabel="Search Amex cards"
            searchPlaceholder="Search other Amex card names"
            selectedHeading="Other Amex history"
            selectedSummary={(count) =>
              `We’ll avoid ${count} additional Amex card${count === 1 ? '' : 's'} you marked as previously held when ranking Amex bonuses.`
            }
            emptySelectionText="Search for other Amex cards you had before and closed, or leave this blank if none apply."
            loading={cardsLoading}
            error={cardsError}
            errorMessage="Amex card search is unavailable right now. You can still update Chase 5/24 below."
          />

          <div className="mt-8 rounded-2xl border border-white/10 bg-bg/40 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold text-text-primary">What is your Chase 5/24 status?</h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                High impact
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
              If you are at or over 5/24, Chase cards stay out of the pool. If you are not sure,
              we leave them in for now.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {chase524Options.map((option) => {
                const active = chase524Status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChase524Status(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-brand-teal bg-brand-teal/10 text-text-primary'
                        : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
                    }`}
                  >
                    <span className="block text-base font-semibold">{option.label}</span>
                    <span className="mt-2 block text-base leading-7 text-current/80">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="mt-6 text-sm text-brand-coral">{error}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={closeEditor} disabled={loading}>
              Cancel
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              {!hasChanges && (
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">No changes yet</p>
              )}
              <Button onClick={handleUpdate} disabled={loading || !hasChanges}>
                {loading ? 'Updating results...' : 'Rerank results'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
