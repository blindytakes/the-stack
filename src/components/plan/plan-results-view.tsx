'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import {
  CardSelectionQuestion,
  type FinderCardSelectionStep
} from '@/components/tools/card-finder-sections';
import type { CardRecord } from '@/lib/cards';
import { useCardsDirectory } from '@/lib/cards-client';
import {
  buildPlanResultsPayload,
  clearPlanResults,
  loadPlanResults,
  savePlanResults,
  type PlanResultsLoadResult,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import { quizRequestSchema, type QuizRequest } from '@/lib/quiz-engine';
import {
  rankPlannerRecommendationsByPriority,
  type PlannerRecommendation,
  type PlannerExcludedOffer,
  type PlannerExclusionReason
} from '@/lib/planner-recommendations';

type LoadState = { status: 'loading' } | PlanResultsLoadResult;
type TimelineEntry = {
  id: string;
  lane: 'cards' | 'banking';
  title: string;
  startDate: Date;
  completeDate: Date;
  payoutDate: Date;
};
type EligibilityDraft = Pick<
  QuizRequest,
  'ownedCardSlugs' | 'amexLifetimeBlockedSlugs' | 'chase524Status'
>;
type PlanApiResponse = {
  generatedAt: number;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanResultsStoragePayload['schedule'];
};
const TIMELINE_DAYS = 365;
const MIN_VISIBLE_BENEFIT_ADJUSTMENT = 25;
const ownedCardsEditorStep: FinderCardSelectionStep = {
  id: 'ownedCardSlugs',
  type: 'card_selection',
  title: 'Which cards do you already have?',
  description: 'We will keep current cards out of new-card recommendations.'
};
const amexHistoryEditorStep: FinderCardSelectionStep = {
  id: 'amexLifetimeBlockedSlugs',
  type: 'card_selection',
  title: 'Any other Amex cards you have had before?',
  description:
    'Skip Amex cards you already marked as open. We use this only for additional Amex cards you have opened in the past and closed.'
};
const chase524Options: Array<{
  label: string;
  value: QuizRequest['chase524Status'];
  description: string;
}> = [
  {
    label: 'Under 5/24',
    value: 'under_5_24',
    description: 'Keep Chase cards eligible.'
  },
  {
    label: 'At or over 5/24',
    value: 'at_or_over_5_24',
    description: 'Hide Chase cards until you drop below the rule.'
  },
  {
    label: 'Not sure',
    value: 'not_sure',
    description: 'Leave Chase cards in the mix for now.'
  }
];

function sameSlugSelections(left: string[], right: string[]) {
  const normalizedLeft = Array.from(new Set(left)).sort();
  const normalizedRight = Array.from(new Set(right)).sort();

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((slug, index) => slug === normalizedRight[index])
  );
}

function formatValue(value: number) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString()}`;
}

function formatSignedValue(value: number, tone: 'positive' | 'negative') {
  return `${tone === 'positive' ? '+' : '-'}${formatValue(value)}`;
}

function whyThisIsFirst(item: PlannerRecommendation) {
  const breakdown = item.valueBreakdown;

  if (item.kind === 'bank_bonus') {
    if ((breakdown?.headlineValue ?? 0) >= 1000) {
      return 'Large cash bonus that meaningfully lifts total payout.';
    }
    if ((breakdown?.estimatedFees ?? 0) === 0) {
      return 'Cash bonus with minimal fee drag and a clear payout path.';
    }
    return 'Cash bonus with requirements that fit the current plan pace.';
  }

  if ((breakdown?.headlineValue ?? 0) >= 750) {
    return 'Large welcome bonus with a manageable spend window.';
  }
  if ((breakdown?.annualFee ?? 0) === 0) {
    return 'No annual fee and an easy bonus move to stack early.';
  }
  if ((breakdown?.benefitAdjustment ?? 0) >= 75) {
    return 'Strong welcome bonus with useful perks that help offset the fee.';
  }

  return 'Solid welcome bonus that fits the current spend pace.';
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function toTimelinePercent(planStart: Date, date: Date) {
  const day = diffDays(planStart, date);
  return Math.max(0, Math.min(100, (day / TIMELINE_DAYS) * 100));
}

function monthLabels(planStart: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const d = new Date(planStart);
    d.setMonth(d.getMonth() + index);
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  });
}

function scheduleLane(
  items: PlannerRecommendation[],
  planStart: Date,
  lane: 'cards' | 'banking'
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let cursor = new Date(planStart);

  for (const item of items) {
    const requirementDays = item.timelineDays ?? 90;
    const payoutLagDays = lane === 'cards' ? 30 : 21;
    const completeDate = addDays(cursor, requirementDays);
    const payoutDate = addDays(completeDate, payoutLagDays);

    entries.push({
      id: item.id,
      lane,
      title: item.title,
      startDate: new Date(cursor),
      completeDate,
      payoutDate
    });

    cursor = completeDate;
  }

  return entries;
}

function buildScheduledTimelineEntries(
  recommendations: PlannerRecommendation[],
  schedule: PlanResultsStoragePayload['schedule']
): TimelineEntry[] {
  const recommendationsById = new Map(recommendations.map((item) => [item.id, item]));
  return schedule
    .map((item) => {
      const recommendation = recommendationsById.get(item.recommendationId);
      if (!recommendation) return null;
      return {
        id: recommendation.id,
        lane: recommendation.lane,
        title: recommendation.title,
        startDate: new Date(item.startAt),
        completeDate: new Date(item.completeAt),
        payoutDate: new Date(item.payoutAt)
      };
    })
    .filter((entry): entry is TimelineEntry => Boolean(entry))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

function buildTimelineEntriesFallback(recommendations: PlannerRecommendation[], planStart: Date): TimelineEntry[] {
  const cards = recommendations.filter((item) => item.lane === 'cards');
  const banking = recommendations.filter((item) => item.lane === 'banking');
  return [...scheduleLane(cards, planStart, 'cards'), ...scheduleLane(banking, planStart, 'banking')].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

function toIcsDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildTimelineIcs(entries: TimelineEntry[]) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Stack//Bonus Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const entry of entries) {
    const milestones = [
      { label: 'Open account/card', date: entry.startDate },
      { label: 'Complete requirements', date: entry.completeDate },
      { label: 'Bonus expected', date: entry.payoutDate }
    ];

    for (const milestone of milestones) {
      const start = toIcsDate(milestone.date);
      const end = toIcsDate(addDays(milestone.date, 1));
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${escapeIcsText(`${entry.id}-${milestone.label}@thestackhq.com`)}`);
      lines.push(`DTSTAMP:${toIcsDate(new Date())}T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${escapeIcsText(`${milestone.label}: ${entry.title}`)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(`Lane: ${entry.lane}`)}`);
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadTimelineCalendar(entries: TimelineEntry[]) {
  if (entries.length === 0) return;
  const ics = buildTimelineIcs(entries);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'the-stack-bonus-plan.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const exclusionActions: Record<PlannerExclusionReason, string> = {
  no_signup_bonus: 'Focus on offers with active welcome bonuses only.',
  fee_preference: 'Loosen your annual-fee preference to see more high-upside card options.',
  credit_tier: 'Raise approval odds first with utilization and on-time payment improvements.',
  amex_lifetime_rule: 'Amex bonuses are usually once per lifetime per card, so prior Amex holdings can block those offers.',
  chase_5_24: 'Chase cards are hidden when you mark yourself at or above 5/24.',
  direct_deposit_required: 'Routing payroll direct deposit unlocks most checking bonuses.',
  state_restricted: 'Some bank bonuses are limited by state eligibility rules.'
};

function SummaryStatCard({
  label,
  value,
  description,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'teal' | 'gold';
}) {
  const toneClass =
    tone === 'teal'
      ? 'border-brand-teal/25 bg-brand-teal/10'
      : tone === 'gold'
        ? 'border-brand-gold/20 bg-brand-gold/10'
        : 'border-white/10 bg-bg/40';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 font-heading text-4xl text-text-primary">{value}</p>
      <p className="mt-2 text-base leading-7 text-text-secondary">{description}</p>
    </div>
  );
}

function RecommendationCard({
  item,
  variant = 'default'
}: {
  item: PlannerRecommendation;
  variant?: 'default' | 'featured';
}) {
  const breakdown = item.valueBreakdown;
  const cardBenefitAdjustment = breakdown?.benefitAdjustment ?? 0;
  const cardAnnualFee = breakdown?.annualFee ?? 0;
  const bankEstimatedFees = breakdown?.estimatedFees ?? 0;
  const isFeatured = variant === 'featured';
  const headlineValue = breakdown?.headlineValue ?? item.estimatedNetValue;
  const laneBadgeClass =
    item.lane === 'cards'
      ? 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
      : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal';
  const valuePanelClass =
    item.lane === 'cards'
      ? 'border-brand-gold/20 bg-brand-gold/10'
      : 'border-brand-teal/20 bg-brand-teal/10';
  const articleClass = isFeatured
    ? 'rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6'
    : 'rounded-2xl border border-white/10 bg-bg/40 p-5';

  return (
    <article className={articleClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] uppercase tracking-[0.25em] text-text-muted">{item.provider}</p>
          <h3 className={`mt-2 font-semibold text-text-primary ${isFeatured ? 'text-2xl' : 'text-xl'}`}>
            {item.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${laneBadgeClass}`}>
            {item.kind === 'card_bonus' ? 'Card bonus' : 'Bank bonus'}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {item.effort} effort
          </span>
        </div>
      </div>

      <div className={`mt-5 grid gap-3 ${isFeatured ? 'md:grid-cols-[minmax(0,1fr)_auto]' : 'sm:grid-cols-[minmax(0,1fr)_auto]'}`}>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {breakdown?.headlineLabel ?? 'Bonus value'}
          </p>
          <p className={`mt-2 font-heading text-text-primary ${isFeatured ? 'text-6xl' : 'text-5xl'}`}>
            {formatValue(headlineValue)}
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${valuePanelClass}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {item.kind === 'card_bonus' ? 'Open value est.' : 'Net value est.'}
          </p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {formatValue(item.estimatedNetValue)}
          </p>
        </div>
      </div>

      {item.kind === 'card_bonus' && breakdown ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {cardBenefitAdjustment >= MIN_VISIBLE_BENEFIT_ADJUSTMENT && (
            <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-brand-teal">
              Benefits {formatSignedValue(cardBenefitAdjustment, 'positive')}
            </span>
          )}
          {cardAnnualFee > 0 && (
            <span className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-brand-coral">
              Fee {formatSignedValue(cardAnnualFee, 'negative')}
            </span>
          )}
        </div>
      ) : item.kind === 'bank_bonus' && breakdown ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {bankEstimatedFees > 0 && (
            <span className="rounded-full border border-brand-coral/20 bg-brand-coral/10 px-3 py-1 text-brand-coral">
              Fees {formatSignedValue(bankEstimatedFees, 'negative')}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-muted">
          Estimated value: <span className="font-semibold text-text-primary">{formatValue(item.estimatedNetValue)}</span>
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-bg/50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Why this is first</p>
        <p className="mt-1 text-base leading-7 text-text-secondary">{whyThisIsFirst(item)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-muted">
        <span>Effort: {item.effort}</span>
        {item.timelineDays ? <span>Timeline: {item.timelineDays} days</span> : null}
      </div>

      <div className="mt-4 space-y-2">
        {item.keyRequirements.slice(0, 3).map((requirement) => (
          <div
            key={requirement}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg/30 px-3 py-2"
          >
            <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
            <p className="text-base leading-7 text-text-secondary">{requirement}</p>
          </div>
        ))}
      </div>

      <Link
        href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
        className="mt-5 inline-flex items-center text-base font-semibold text-brand-teal transition hover:underline"
      >
        {item.kind === 'card_bonus' ? 'View card details' : 'View bank details'}
      </Link>
    </article>
  );
}

function EmptyLaneCard({
  lane,
  exclusions,
  ownedCardsCount = 0,
  amexLifetimeBlockedCount = 0,
  chase524Blocked = false
}: {
  lane: 'cards' | 'banking';
  exclusions: PlannerExcludedOffer[];
  ownedCardsCount?: number;
  amexLifetimeBlockedCount?: number;
  chase524Blocked?: boolean;
}) {
  const label = lane === 'cards' ? 'Card Bonuses' : 'Banking Bonuses';
  const fallback =
    lane === 'cards'
      ? chase524Blocked
        ? 'Drop below Chase 5/24 if you want Chase cards back in the recommendation pool.'
        : amexLifetimeBlockedCount > 0
          ? 'Remove prior Amex cards only if you are confident the lifetime rule does not apply.'
          : ownedCardsCount > 0
            ? 'Remove cards you already have if you want to explore more open-card options.'
            : 'Adjust fee and credit filters to unlock more card bonus paths.'
      : 'Adjust direct deposit and state filters to unlock more bank bonus paths.';
  const emptyMessage =
    lane === 'cards' && chase524Blocked
      ? 'Chase cards were removed because you marked yourself at or over 5/24.'
      : lane === 'cards' && amexLifetimeBlockedCount > 0
        ? `We removed ${amexLifetimeBlockedCount} Amex card${amexLifetimeBlockedCount === 1 ? '' : 's'} you marked as previously held.`
        : lane === 'cards' && ownedCardsCount > 0
          ? `We excluded ${ownedCardsCount} card${ownedCardsCount === 1 ? '' : 's'} you already have from new-card recommendations.`
          : 'No matching offers were found for this lane yet.';
  const reasonActions = Array.from(
    new Set(
      exclusions.flatMap((offer) => offer.reasons.map((reason) => exclusionActions[reason]))
    )
  ).slice(0, 3);
  const unlockActions = reasonActions.length > 0 ? reasonActions : [fallback];

  return (
    <article className="rounded-2xl border border-dashed border-white/20 bg-bg-surface p-5">
      <h3 className="text-xl font-semibold text-text-primary">{label}: Not a fit right now</h3>
      <p className="mt-2 text-base leading-7 text-text-secondary">
        {exclusions.length > 0
          ? `${exclusions.length} offers were filtered out by your current inputs.`
          : emptyMessage}
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-text-secondary">
        {unlockActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </article>
  );
}

function ResultsEligibilityEditor({
  payload,
  cards,
  cardsLoading,
  cardsError,
  onUpdateEligibility
}: {
  payload: PlanResultsStoragePayload;
  cards: CardRecord[];
  cardsLoading: boolean;
  cardsError: string;
  onUpdateEligibility: (draft: EligibilityDraft) => Promise<string | null>;
}) {
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
                    <span className="mt-2 block text-base leading-7 text-current/80">{option.description}</span>
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
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  No changes yet
                </p>
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

function PlanSummary({
  payload,
  onClear,
  cardsOnlyMode,
  onUpdateEligibility
}: {
  payload: PlanResultsStoragePayload;
  onClear: () => void;
  cardsOnlyMode: boolean;
  onUpdateEligibility: (draft: EligibilityDraft) => Promise<string | null>;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const { cards: availableCards, loading: cardsLoading, error: cardsError } = useCardsDirectory(100);
  const labels = useMemo(() => monthLabels(planStart), [planStart]);
  const prioritizedRecommendations = useMemo(
    () => rankPlannerRecommendationsByPriority(payload.recommendations),
    [payload.recommendations]
  );
  const scopedRecommendations = useMemo(
    () =>
      cardsOnlyMode
        ? prioritizedRecommendations.filter((item) => item.lane === 'cards')
        : prioritizedRecommendations,
    [cardsOnlyMode, prioritizedRecommendations]
  );
  const cardExclusions = payload.exclusions.filter((item) => item.lane === 'cards');
  const bankingExclusions = cardsOnlyMode
    ? []
    : payload.exclusions.filter((item) => item.lane === 'banking');
  const timelineEntries = useMemo(
    () =>
      payload.schedule.length > 0
        ? buildScheduledTimelineEntries(scopedRecommendations, payload.schedule)
        : buildTimelineEntriesFallback(scopedRecommendations, planStart),
    [payload.schedule, planStart, scopedRecommendations]
  );
  const scopedRecommendationsById = useMemo(
    () => new Map(scopedRecommendations.map((item) => [item.id, item])),
    [scopedRecommendations]
  );
  const orderedRecommendations = useMemo(() => {
    if (timelineEntries.length === 0) return scopedRecommendations;
    const recommendationsById = new Map(scopedRecommendations.map((item) => [item.id, item]));
    const scheduled = timelineEntries
      .map((entry) => recommendationsById.get(entry.id))
      .filter((item): item is PlannerRecommendation => Boolean(item));
    const scheduledIds = new Set(scheduled.map((item) => item.id));
    const unscheduled = scopedRecommendations.filter((item) => !scheduledIds.has(item.id));
    return [...scheduled, ...unscheduled];
  }, [scopedRecommendations, timelineEntries]);
  const cardLane = orderedRecommendations.filter((item) => item.lane === 'cards');
  const bankingLane = orderedRecommendations.filter((item) => item.lane === 'banking');
  const totalValue = orderedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const cardValue = cardLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const bankingValue = bankingLane.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const ownedCardsCount = payload.answers.ownedCardSlugs.length;
  const amexLifetimeBlockedCount = payload.answers.amexLifetimeBlockedSlugs.length;
  const chase524Blocked = payload.answers.chase524Status === 'at_or_over_5_24';
  const doNowLimit = 2;
  const doNow = orderedRecommendations.slice(0, doNowLimit);
  const doNext = orderedRecommendations.slice(doNowLimit);
  const summaryFlags = [
    ownedCardsCount > 0
      ? `${ownedCardsCount} current card${ownedCardsCount === 1 ? '' : 's'} excluded`
      : null,
    amexLifetimeBlockedCount > 0
      ? `${amexLifetimeBlockedCount} prior Amex card${amexLifetimeBlockedCount === 1 ? '' : 's'} blocked`
      : null,
    chase524Blocked ? 'Chase 5/24 applied' : null
  ].filter((value): value is string => Boolean(value));

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(212,168,83,0.1),transparent_40%),rgba(255,255,255,0.03)] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">12-Month Bonus-First Estimate</p>
            <p className="mt-3 font-heading text-5xl text-text-primary md:text-6xl">
              {formatValue(totalValue)}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary md:text-lg">
              {cardsOnlyMode
                ? 'This draft ranks the strongest card bonuses first, then applies conservative fee and perk adjustments so the headline stays grounded.'
                : 'This draft combines your strongest card and bank bonus moves into one 12-month plan, with conservative net-value assumptions and a sequence you can actually follow.'}
            </p>
            {summaryFlags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {summaryFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full border border-white/10 bg-bg/40 px-3 py-1.5 text-sm text-text-secondary"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`grid gap-3 ${cardsOnlyMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3 xl:grid-cols-1'}`}>
            <SummaryStatCard
              label="Card open-value est."
              value={formatValue(cardValue)}
              description={`${cardLane.length} card move${cardLane.length === 1 ? '' : 's'} in this draft`}
              tone="gold"
            />
            {!cardsOnlyMode && (
              <SummaryStatCard
                label="Banking net est."
                value={formatValue(bankingValue)}
                description={`${bankingLane.length} bank move${bankingLane.length === 1 ? '' : 's'} in this draft`}
                tone="teal"
              />
            )}
            <SummaryStatCard
              label="Start now"
              value={String(doNow.length)}
              description={doNow[0] ? `${doNow[0].title} leads the plan.` : 'No immediate moves yet.'}
              tone="neutral"
            />
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">Start Today</h2>
        <p className="mt-2 text-base leading-7 text-text-secondary">
          Open these highest-priority bonus moves first.
        </p>
        <div className={`mt-4 grid gap-4 ${doNow.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {doNow.length > 0 ? (
            doNow.map((item) => <RecommendationCard key={item.id} item={item} variant="featured" />)
          ) : (
            <p className="text-sm text-text-muted">No do-now recommendations are available yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-text-primary">Execution Timeline</h2>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              Work this plan in order. Open each move by the first date, finish the requirement window by the second, and look for the payout around the third.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => downloadTimelineCalendar(timelineEntries)}
            disabled={timelineEntries.length === 0}
          >
            Add to Calendar
          </Button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">1. Open</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">Start the offer</p>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              Use the <span className="font-semibold text-text-primary">Open by</span> date as your target apply or account-opening date.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">2. Complete</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">Finish the requirement window</p>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              Hit the spend, funding, or direct-deposit requirement before the <span className="font-semibold text-text-primary">Complete by</span> date.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">3. Get paid</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">Watch for the bonus</p>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              The <span className="font-semibold text-text-primary">Bonus expected</span> date is your rough payout target, not a guaranteed posting day.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-bg/40 p-4">
          <div className="grid min-w-[640px] grid-cols-12 gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            {labels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {timelineEntries.map((entry, index) => {
              const recommendation = scopedRecommendationsById.get(entry.id);
              const timelineRequirements = recommendation?.keyRequirements.slice(0, 2) ?? [];
              const startPct = toTimelinePercent(planStart, entry.startDate);
              const completePct = toTimelinePercent(planStart, entry.completeDate);
              const payoutPct = toTimelinePercent(planStart, entry.payoutDate);
              const barWidth = Math.max(3, completePct - startPct);
              const laneAccentClass =
                entry.lane === 'cards'
                  ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
                  : 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal';
              const actionLabel =
                entry.lane === 'cards'
                  ? 'Apply for the card first, then work the spend requirement during this window.'
                  : 'Open the account first, then complete the funding or direct-deposit steps during this window.';

              return (
                <div key={entry.id} className="rounded-[1.5rem] border border-white/10 bg-bg/50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-base font-semibold ${laneAccentClass}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                          {entry.lane === 'cards' ? 'Card move' : 'Bank move'}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-text-primary">{entry.title}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-text-muted">
                      {diffDays(entry.startDate, entry.completeDate)} days to complete
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="rounded-2xl border border-white/10 bg-bg/30 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Open by</p>
                          <p className="mt-2 text-lg font-semibold text-text-primary">
                            {formatShortDate(entry.startDate)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-bg/50 px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Complete by</p>
                          <p className="mt-2 text-lg font-semibold text-text-primary">
                            {formatShortDate(entry.completeDate)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/10 px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Bonus expected</p>
                          <p className="mt-2 text-lg font-semibold text-text-primary">
                            {formatShortDate(entry.payoutDate)}
                          </p>
                        </div>
                      </div>

                      <div className="relative mt-5 h-3 rounded-full bg-bg-elevated/80">
                        <div
                          className={`absolute top-0 h-3 rounded-full ${entry.lane === 'cards' ? 'bg-brand-gold/70' : 'bg-brand-teal/70'}`}
                          style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                        />
                        <span
                          className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-brand-gold"
                          style={{ left: `${startPct}%`, transform: 'translate(-50%, -50%)' }}
                          aria-hidden
                        />
                        <span
                          className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-white"
                          style={{ left: `${completePct}%`, transform: 'translate(-50%, -50%)' }}
                          aria-hidden
                        />
                        <span
                          className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-bg bg-brand-teal"
                          style={{ left: `${payoutPct}%`, transform: 'translate(-50%, -50%)' }}
                          aria-hidden
                        />
                      </div>
                      <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.18em] text-text-muted sm:grid-cols-3">
                        <span>Open</span>
                        <span className="sm:text-center">Complete</span>
                        <span className="sm:text-right">Payout</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-bg/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                        What to do now
                      </p>
                      <p className="mt-2 text-base leading-7 text-text-secondary">{actionLabel}</p>
                      <div className="mt-4 space-y-2">
                        {timelineRequirements.length > 0 ? (
                          timelineRequirements.map((requirement) => (
                            <div
                              key={requirement}
                              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg/40 px-3 py-2"
                            >
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-teal" aria-hidden />
                              <p className="text-base leading-7 text-text-secondary">{requirement}</p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-white/10 px-3 py-2 text-base leading-7 text-text-muted">
                            No extra requirement details available for this step.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {timelineEntries.length === 0 && (
              <p className="text-sm text-text-muted">No timeline items yet. Build recommendations first.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">
          {cardsOnlyMode ? 'Card Bonus Track' : 'Lane Breakdown'}
        </h2>
        {cardsOnlyMode ? (
          <div className="mt-4 space-y-4">
            {cardLane.length === 0 ? (
              <EmptyLaneCard
                lane="cards"
                exclusions={cardExclusions}
                ownedCardsCount={ownedCardsCount}
                amexLifetimeBlockedCount={amexLifetimeBlockedCount}
                chase524Blocked={chase524Blocked}
              />
            ) : (
              cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-bg/40 p-5">
              <h3 className="text-lg font-semibold text-text-primary">Card Bonus Track</h3>
              <div className="mt-4 space-y-4">
                {cardLane.length === 0 ? (
                  <EmptyLaneCard
                    lane="cards"
                    exclusions={cardExclusions}
                    ownedCardsCount={ownedCardsCount}
                    amexLifetimeBlockedCount={amexLifetimeBlockedCount}
                    chase524Blocked={chase524Blocked}
                  />
                ) : (
                  cardLane.map((item) => <RecommendationCard key={item.id} item={item} />)
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg/40 p-5">
              <h3 className="text-lg font-semibold text-text-primary">Bank Bonus Track</h3>
              <div className="mt-4 space-y-4">
                {bankingLane.length === 0 ? (
                  <EmptyLaneCard lane="banking" exclusions={bankingExclusions} />
                ) : (
                  bankingLane.map((item) => <RecommendationCard key={item.id} item={item} />)
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-2xl text-text-primary">Do Next</h2>
        <p className="mt-2 text-base leading-7 text-text-secondary">
          Queue these after you complete the do-now steps and timeline requirements.
        </p>
        <div className={`mt-4 grid gap-4 ${doNext.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {doNext.length > 0 ? (
            doNext.map((item) => <RecommendationCard key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-text-muted">No follow-up actions yet.</p>
          )}
        </div>
      </section>

      <ResultsEligibilityEditor
        payload={payload}
        cards={availableCards}
        cardsLoading={cardsLoading}
        cardsError={cardsError}
        onUpdateEligibility={onUpdateEligibility}
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={cardsOnlyMode ? '/cards/plan' : '/tools/card-finder?mode=full'}>
          <Button variant="ghost">
            {cardsOnlyMode ? 'Edit Full Card Intake' : 'Edit Full Planner'}
          </Button>
        </Link>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          Clear Saved Plan
        </button>
      </div>
    </div>
  );
}

export function PlanResultsView() {
  const searchParams = useSearchParams();
  const cardsOnlyMode = searchParams.get('mode') === 'cards_only';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function handleClearPlan() {
    clearPlanResults();
    setState({ status: 'missing' });
  }

  async function handleUpdateEligibility(draft: EligibilityDraft) {
    if (state.status !== 'fresh' && state.status !== 'recovered') {
      return 'Your saved plan is not available right now.';
    }

    const parsedAnswers = quizRequestSchema.safeParse({
      ...state.payload.answers,
      ...draft
    });
    if (!parsedAnswers.success) {
      return 'Could not update your plan inputs.';
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: parsedAnswers.data,
          options: cardsOnlyMode
            ? {
                maxBanking: 0
              }
            : undefined
        })
      });
      if (!res.ok) {
        throw new Error('Failed to refresh plan');
      }

      const data = (await res.json()) as PlanApiResponse;
      const nextPayload = buildPlanResultsPayload({
        savedAt: data.generatedAt,
        answers: parsedAnswers.data,
        recommendations: data.recommendations,
        exclusions: data.exclusions,
        schedule: data.schedule
      });

      savePlanResults(nextPayload);
      setState({
        status: 'fresh',
        payload: nextPayload,
        source: 'session'
      });

      return null;
    } catch {
      return 'Could not refresh your recommendations right now.';
    }
  }

  useEffect(() => {
    const loaded = loadPlanResults();
    setState(loaded);

    if (loaded.status === 'fresh' || loaded.status === 'recovered') {
      trackFunnelEvent('plan_results_view', {
        source: cardsOnlyMode
          ? 'cards_only_path'
          : loaded.status === 'fresh'
            ? loaded.source
            : 'local_recovery',
        path: '/plan/results',
        tool: cardsOnlyMode ? 'cards_only_path' : 'card_finder'
      });
    }
  }, [cardsOnlyMode]);

  if (state.status === 'loading') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8">
        <p className="text-base text-text-secondary">Loading your plan…</p>
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'stale') {
    return (
      <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
        <h1 className="font-heading text-4xl text-text-primary">Your plan is not available</h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-text-secondary">
          {state.status === 'stale'
            ? cardsOnlyMode
              ? 'Your previous card-only plan expired. Build a fresh plan to get up-to-date recommendations.'
              : 'Your previous plan expired. Build a fresh plan to get up-to-date recommendations.'
            : cardsOnlyMode
              ? 'Build a plan first to view your personalized credit card bonus actions.'
              : 'Build a plan first to view your personalized card and banking bonus actions.'}
        </p>
        <div className="mt-6">
          <Link href={cardsOnlyMode ? '/cards/plan' : '/tools/card-finder?mode=full'}>
            <Button>{cardsOnlyMode ? 'Build My Card-Only Plan' : 'Start My Bonus Plan'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      <h1 className="font-heading text-5xl text-text-primary md:text-6xl">
        {cardsOnlyMode ? 'Your 12-Month Card Plan' : 'Your 12-Month Bonus Plan'}
      </h1>
      <p className="mt-4 text-base leading-8 text-text-secondary md:text-lg">
        {cardsOnlyMode
          ? 'We prioritize the biggest card bonuses you can realistically earn, then apply conservative perk and fee adjustments.'
          : 'We prioritize the biggest card and bank bonuses you can realistically earn, with conservative fee and perk adjustments.'}
      </p>
      {state.status === 'recovered' && (
        <p className="mt-3 text-base text-brand-gold">
          Recovered your latest saved plan from this browser.
        </p>
      )}
      <PlanSummary
        payload={state.payload}
        onClear={handleClearPlan}
        cardsOnlyMode={cardsOnlyMode}
        onUpdateEligibility={handleUpdateEligibility}
      />
    </div>
  );
}
