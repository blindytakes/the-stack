'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EntityImage } from '@/components/ui/entity-image';
import {
  getFeaturedPlanRecommendations,
  buildScheduledTimelineEntries,
  buildTimelineEntriesFallback,
  buildTimelineMilestones,
  downloadTimelineCalendar,
  formatShortDate,
  formatValue,
  diffDays,
  type TimelineEntry
} from '@/components/plan/plan-results-utils';
import { PlanEmailPanel } from '@/components/plan/plan-email-panel';
import { exclusionActions, scheduleIssueActions } from '@/components/plan/plan-results-config';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';

import {
  getPlanResultsAudience,
  loadPlanResults,
  type PlanResultsLoadResult,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import { getDemoPlanPayload } from '@/lib/plan-demo-fixture';
import {
  rankPlannerRecommendationsByPriority,
  type PlannerRecommendation
} from '@/lib/planner-recommendations';
import {
  getSelectedOfferIntentStatus,
  type SelectedOfferIntentStatus
} from '@/lib/selected-offer-intent';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';

type LoadState = { status: 'loading' } | PlanResultsLoadResult;

function getRecommendationSlug(item: PlannerRecommendation): string | null {
  const match = item.detailPath.match(/^\/(?:cards|banking)\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function RecommendationArtwork({
  item,
  className,
  compact = false
}: {
  item: PlannerRecommendation;
  className: string;
  compact?: boolean;
}) {
  const slug = getRecommendationSlug(item);

  if (item.lane === 'cards') {
    const cardImage =
      slug != null
        ? getCardImageDisplay({
            slug,
            name: item.title,
            issuer: item.provider,
            imageUrl: item.imageUrl,
            imageAssetType: item.imageAssetType
          })
        : null;

    return (
      <EntityImage
        src={cardImage?.src}
        alt={cardImage?.alt ?? `${item.title} card art`}
        label={cardImage?.label ?? item.title}
        className={className}
        imgClassName={cardImage?.presentation.imgClassName}
        fallbackClassName="bg-black/10"
        fallbackVariant={cardImage?.fallbackVariant}
        fallbackTextClassName="text-xs sm:text-sm"
        fit={cardImage?.presentation.fit}
        position={cardImage?.presentation.position}
        scale={cardImage?.presentation.scale}
      />
    );
  }

  const presentation = getBankingImagePresentation(item.provider);
  const bankingScale = Math.min(
    (presentation?.scale ?? 1.04) * (compact ? 1.18 : 1.08),
    compact ? 1.36 : 1.24
  );
  const bankingImgClassName = compact
    ? presentation?.microImgClassName ?? 'bg-black/10 px-1.5 py-1.5'
    : presentation?.compactImgClassName ?? 'bg-black/10 px-3 py-2';
  const bankingImageUrl = resolveBankingBrandImageUrl(item.provider, item.imageUrl);

  return (
    <EntityImage
      src={bankingImageUrl}
      alt={`${item.provider} logo`}
      label={item.provider}
      className={className}
      imgClassName={bankingImgClassName}
      fallbackClassName="bg-black/10"
      fallbackVariant={compact ? 'initials' : 'wordmark'}
      fallbackTextClassName={compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}
      fit={presentation?.fit}
      position={presentation?.position}
      scale={bankingScale}
    />
  );
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* ─────────────────────────────────────────────────────────
 * Helper: plain-english "what to do" for any recommendation
 * ───────────────────────────────────────────────────────── */

function whatToDoText(item: PlannerRecommendation): string {
  if (item.kind === 'card_bonus') {
    const spend = item.scheduleConstraints.requiredSpend;
    const days = item.scheduleConstraints.activeDays;
    const months = days ? Math.round(days / 30) : 3;
    if (spend) {
      return `Apply → spend $${spend.toLocaleString()} in ${months} month${months === 1 ? '' : 's'} → earn your bonus`;
    }
    return `Apply → meet the spending requirement → earn your bonus`;
  }

  // Bank bonus
  const deposit = item.scheduleConstraints.requiredDeposit;
  const days = item.scheduleConstraints.activeDays;
  const months = days ? Math.round(days / 30) : 3;
  const needsDD = item.scheduleConstraints.requiresDirectDeposit;

  if (deposit && needsDD) {
    return `Open account → deposit $${deposit.toLocaleString()} → set up direct deposit → keep funds for ${months} month${months === 1 ? '' : 's'}`;
  }
  if (deposit) {
    return `Open account → deposit $${deposit.toLocaleString()} → keep funds for ${months} month${months === 1 ? '' : 's'}`;
  }
  if (needsDD) {
    return `Open account → set up direct deposit → meet requirements`;
  }
  return `Open account → meet the bonus requirements`;
}

function monthlySpendText(item: PlannerRecommendation): string | null {
  if (item.kind !== 'card_bonus') return null;
  const spend = item.scheduleConstraints.requiredSpend;
  const days = item.scheduleConstraints.activeDays;
  if (!spend || !days) return null;
  const months = Math.max(1, Math.round(days / 30));
  const monthly = Math.round(spend / months);
  return `$${monthly.toLocaleString()}/mo`;
}

type TimelineGeometry = {
  earliest: Date;
  latest: Date;
  totalDays: number;
  monthLabels: { label: string; left: number }[];
};

function buildTimelineGeometry(entries: TimelineEntry[]): TimelineGeometry | null {
  if (entries.length === 0) return null;

  const earliest = entries.reduce(
    (min, entry) => (entry.startDate < min ? entry.startDate : min),
    entries[0].startDate
  );
  const latest = entries.reduce(
    (max, entry) => (entry.payoutDate > max ? entry.payoutDate : max),
    entries[0].payoutDate
  );
  const totalDays = Math.max(1, diffDays(earliest, latest));
  const monthLabels: { label: string; left: number }[] = [];
  const cursor = new Date(earliest);

  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);

  while (cursor <= latest) {
    monthLabels.push({
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(cursor),
      left: (diffDays(earliest, cursor) / totalDays) * 100
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { earliest, latest, totalDays, monthLabels };
}

function TimelineTrack({
  entry,
  geometry
}: {
  entry: TimelineEntry | undefined;
  geometry: TimelineGeometry | null;
}) {
  if (!entry || !geometry) {
    return (
      <div className="flex h-12 items-center rounded-full border border-dashed border-white/[0.12] bg-white/[0.035] px-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">
        Needs manual scheduling
      </div>
    );
  }

  const startPct = (diffDays(geometry.earliest, entry.startDate) / geometry.totalDays) * 100;
  const widthPct = Math.max(2, (diffDays(entry.startDate, entry.completeDate) / geometry.totalDays) * 100);
  const barColor =
    entry.lane === 'cards'
      ? 'bg-[linear-gradient(90deg,rgba(133,99,34,0.92)_0%,rgba(196,154,61,0.98)_55%,rgba(242,205,110,1)_100%)] shadow-[0_0_22px_rgba(210,166,69,0.28)]'
      : 'bg-[linear-gradient(90deg,rgba(16,99,91,0.92)_0%,rgba(34,170,157,0.98)_55%,rgba(86,240,225,1)_100%)] shadow-[0_0_22px_rgba(45,212,191,0.26)]';

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0">
        {geometry.monthLabels.map((month) => (
          <span
            key={`${month.label}-${month.left}`}
            className="absolute inset-y-[-8px] w-px bg-white/[0.1]"
            style={{ left: `${month.left}%` }}
          />
        ))}
      </div>

      <div className="relative h-5 overflow-hidden rounded-full bg-white/[0.085] ring-1 ring-white/[0.06]">
        <div
          className={`absolute top-0 h-5 origin-left rounded-full ${barColor}`}
          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
        />
        <span
          className="absolute top-[4px] h-[2px] rounded-full bg-white/50 origin-left"
          style={{
            left: `calc(${startPct}% + 8px)`,
            width: `max(calc(${widthPct}% - 16px), 12px)`
          }}
        />
      </div>
    </div>
  );
}

type StartSequenceGroup = {
  key: string;
  label: string;
  items: Array<{
    id: string;
    action: 'Apply for' | 'Open';
    title: string;
  }>;
};

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildStartSequenceGroups(
  recommendations: PlannerRecommendation[],
  entriesById: Map<string, TimelineEntry>,
  referenceDate: Date
): StartSequenceGroup[] {
  const groups = new Map<string, StartSequenceGroup>();

  for (const recommendation of recommendations) {
    const entry = entriesById.get(recommendation.id);
    const startDate = entry?.startDate;
    const key = startDate
      ? `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`
      : `manual-${recommendation.id}`;
    const existing = groups.get(key);

    if (existing) {
      existing.items.push({
        id: recommendation.id,
        action: recommendation.kind === 'card_bonus' ? 'Apply for' : 'Open',
        title: recommendation.title
      });
      continue;
    }

    groups.set(key, {
      key,
      label: startDate
        ? isSameCalendarDay(startDate, referenceDate)
          ? 'Start now'
          : formatShortDate(startDate)
        : 'Manual timing',
      items: [
        {
          id: recommendation.id,
          action: recommendation.kind === 'card_bonus' ? 'Apply for' : 'Open',
          title: recommendation.title
        }
      ]
    });
  }

  return [...groups.values()];
}

function PlanStartSequence({ groups }: { groups: StartSequenceGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-brand-teal">Sequence of events</p>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            This is the execution order for the opening moves, not a one-size-fits-all ranking.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {groups.length} start window{groups.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {groups.map((group, index) => (
          <div
            key={group.key}
            className={`rounded-[1.35rem] border px-4 py-4 ${
              index === 0
                ? 'border-brand-teal/20 bg-brand-teal/10'
                : 'border-white/[0.08] bg-white/[0.03]'
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">{group.label}</p>
            <div className="mt-3 space-y-2.5">
              {group.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{item.action}</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Plan schedule board — timeline and details in one surface
 * ───────────────────────────────────────────────────────── */

function PlanScheduleRow({
  item,
  entry,
  stepNumber,
  geometry,
  desktopGridClass,
  isSelectedOffer = false
}: {
  item: PlannerRecommendation;
  entry: TimelineEntry | undefined;
  stepNumber: number;
  geometry: TimelineGeometry | null;
  desktopGridClass: string;
  isSelectedOffer?: boolean;
}) {
  const isFirstStep = stepNumber === 1;
  const [expanded, setExpanded] = useState(false);
  const detailsId = `plan-schedule-step-${item.id}`;
  const breakdown = item.valueBreakdown;
  const headlineValue = breakdown?.headlineValue ?? item.estimatedNetValue;
  const netValue = item.estimatedNetValue;
  const fee = breakdown?.annualFee ?? breakdown?.estimatedFees ?? 0;
  const monthly = monthlySpendText(item);
  const stepBg = item.lane === 'cards' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-brand-teal/15 text-brand-teal';
  const netValueClass = item.lane === 'cards' ? 'text-brand-gold' : 'text-brand-teal';
  const actionDotClass = item.lane === 'cards' ? 'bg-brand-gold' : 'bg-brand-teal';
  const laneLabel = item.lane === 'cards' ? 'Card' : 'Bank';
  const laneTextClass = item.lane === 'cards' ? 'text-brand-gold/80' : 'text-brand-teal/80';
  const detailsPillClass = expanded
    ? 'border-brand-teal/35 bg-brand-teal/10 text-brand-teal'
    : 'border-white/[0.12] bg-white/[0.03] text-text-secondary';
  const detailsLabel = expanded ? 'Hide details' : 'View details';
  const artworkClass =
    item.lane === 'cards'
      ? 'h-[4.75rem] w-[7.15rem] shrink-0 rounded-[1.2rem] border border-brand-gold/16 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(242,205,110,0.06)]'
      : 'h-[4.2rem] w-[7.5rem] shrink-0 rounded-[1.15rem] border border-brand-teal/16 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(45,212,191,0.06)] lg:w-full';
  const dateRangeText = entry
    ? `${formatShortDate(entry.startDate)} – ${formatShortDate(entry.completeDate)}`
    : 'Not scheduled';

  return (
    <div
      className={`overflow-hidden rounded-[1.5rem] border transition-colors hover:bg-white/[0.04] ${
        isFirstStep
          ? 'border-brand-teal/22 bg-[linear-gradient(180deg,rgba(45,212,191,0.075),rgba(255,255,255,0.04))]'
          : 'border-white/[0.07] bg-white/[0.026]'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="w-full px-4 py-4 text-left sm:px-5 lg:px-5"
      >
        <div className="lg:hidden">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex w-9 shrink-0 flex-col items-center">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${stepBg}`}>
                {stepNumber}
              </span>
              <span className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${laneTextClass}`}>
                {laneLabel}
              </span>
            </div>

            <RecommendationArtwork
              item={item}
              className={artworkClass}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-semibold leading-6 text-text-primary">{item.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-text-secondary">{item.provider}</p>
                    {isFirstStep ? (
                      <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
                        Start here
                      </span>
                    ) : null}
                    {isSelectedOffer ? (
                      <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
                        Selected offer
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-[2.1rem] font-semibold leading-none text-text-primary">{formatValue(netValue)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${detailsPillClass}`}
                  >
                    {detailsLabel}
                    <span
                      className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3.5">
                <TimelineTrack entry={entry} geometry={geometry} />
                <div className="mt-2.5 text-[11px] text-text-secondary">
                  <span>{dateRangeText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`hidden lg:grid ${desktopGridClass} items-center gap-x-3`}>
          <div className="flex flex-col items-center">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${stepBg}`}>
              {stepNumber}
            </span>
            <span className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${laneTextClass}`}>
              {laneLabel}
            </span>
          </div>

          <RecommendationArtwork
            item={item}
            className={artworkClass}
          />

          <div className="min-w-0 pr-3">
            <p className="truncate text-[17px] font-semibold leading-6 text-text-primary">{item.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-sm text-text-secondary">{item.provider}</p>
              {isFirstStep ? (
                <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
                  Start here
                </span>
              ) : null}
              {isSelectedOffer ? (
                <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
                  Selected offer
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] px-5 py-4">
            <TimelineTrack entry={entry} geometry={geometry} />
          </div>

          <div className="text-right">
            <p className="text-[2.1rem] font-semibold leading-none text-text-primary">{formatValue(netValue)}</p>
          </div>

          <span
            className={`inline-flex items-center justify-self-end gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${detailsPillClass}`}
          >
            {detailsLabel}
            <span
              className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              ▾
            </span>
          </span>
        </div>
      </button>

      {expanded ? (
        <div id={detailsId} className="border-t border-white/[0.06] px-5 pb-6 pt-5 sm:px-6">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                {breakdown?.headlineLabel ?? 'Bonus value'}
              </p>
              <p className="mt-1 font-heading text-4xl text-text-primary">{formatValue(headlineValue)}</p>
            </div>

            {fee > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  {item.kind === 'card_bonus' ? 'Annual fee' : 'Est. fees'}
                </p>
                <p className="mt-1 text-xl font-semibold text-brand-coral">−{formatValue(fee)}</p>
              </div>
            ) : null}

            {headlineValue !== netValue ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net value</p>
                <p className={`mt-1 text-xl font-semibold ${netValueClass}`}>{formatValue(netValue)}</p>
              </div>
            ) : null}

            {monthly ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Monthly spend</p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{monthly}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex items-start gap-3 border-t border-white/[0.06] pt-4">
            <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${actionDotClass}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Next action</p>
              <p className="mt-2 text-base leading-7 text-text-secondary">{whatToDoText(item)}</p>
            </div>
          </div>

          {entry ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Start</p>
                <p className="mt-1 text-base font-semibold text-text-primary">{formatShortDate(entry.startDate)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Deadline</p>
                <p className="mt-1 text-base font-semibold text-text-primary">{formatShortDate(entry.completeDate)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Bonus expected</p>
                <p className="mt-1 text-base font-semibold text-text-primary">{formatShortDate(entry.payoutDate)}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Scheduling note</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                This recommendation made the plan, but it does not have a scheduled window yet. Use the offer details to place it when you are ready.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {item.effort} effort
              </span>
              {monthly ? <span className="text-sm text-text-muted">{monthly} pace</span> : null}
            </div>

            <Link
              href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
              className="inline-flex items-center text-sm font-semibold text-brand-teal transition hover:underline"
            >
              View details →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlanScheduleBoard({
  recommendations,
  entriesById,
  selectedRecommendationId
}: {
  recommendations: PlannerRecommendation[];
  entriesById: Map<string, TimelineEntry>;
  selectedRecommendationId?: string | null;
}) {
  const visibleRecommendations = recommendations;
  const scheduledEntries = useMemo(
    () =>
      visibleRecommendations
        .map((item) => entriesById.get(item.id))
        .filter((entry): entry is TimelineEntry => Boolean(entry)),
    [entriesById, visibleRecommendations]
  );
  const geometry = useMemo(() => buildTimelineGeometry(scheduledEntries), [scheduledEntries]);
  const desktopGridClass =
    'lg:grid-cols-[40px_124px_minmax(225px,320px)_minmax(430px,1fr)_92px_132px]';
  const summaryEyebrow = `Featured ${visibleRecommendations.length} move${visibleRecommendations.length === 1 ? '' : 's'}`;
  const summaryText =
    'These are the first moves to work through. Expand any row to see the exact requirement window and bonus-posting timing.';

  return (
    <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 pb-4 pt-5 lg:px-10 lg:pt-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-brand-teal">{summaryEyebrow}</p>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">{summaryText}</p>
        </div>
      </div>

      {geometry ? (
        <div className={`hidden lg:grid ${desktopGridClass} items-end gap-x-3 px-10 pb-2 pt-4`}>
          <div className="col-span-3 h-5" />
          <div className="px-5">
            <div className="relative h-5">
              {geometry.monthLabels.map((month) => (
                <span
                  key={`${month.label}-axis-${month.left}`}
                  className="absolute text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary"
                  style={{ left: `${month.left}%`, transform: 'translateX(-50%)' }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-2 h-5" />
        </div>
      ) : (
        <div className="px-5 pt-4 lg:px-10">
          <p className="text-sm text-text-muted">
            Timing will appear once schedule windows are available for these moves.
          </p>
        </div>
      )}

      <div className="space-y-3 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
        {visibleRecommendations.map((item, index) => (
          <div key={item.id}>
            <PlanScheduleRow
              item={item}
              entry={entriesById.get(item.id)}
              stepNumber={index + 1}
              geometry={geometry}
              desktopGridClass={desktopGridClass}
              isSelectedOffer={selectedRecommendationId === item.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Save & Act bar
 * ───────────────────────────────────────────────────────── */

function SaveActBar({
  recommendations,
  milestones,
  totalValue,
  cardsOnlyMode,
  timelineEntries,
  referenceDate
}: {
  recommendations: PlannerRecommendation[];
  milestones: ReturnType<typeof buildTimelineMilestones>;
  totalValue: number;
  cardsOnlyMode: boolean;
  timelineEntries: TimelineEntry[];
  referenceDate: Date;
}) {
  return (
    <section className="mt-8">
      <PlanEmailPanel
        recommendations={recommendations}
        milestones={milestones}
        totalValue={totalValue}
        cardsOnlyMode={cardsOnlyMode}
        referenceDate={referenceDate}
        secondaryAction={
          <Button
            type="button"
            variant="ghost"
            onClick={() => downloadTimelineCalendar(timelineEntries, recommendations)}
            disabled={timelineEntries.length === 0}
            className="px-5 py-3"
          >
            Add to calendar
          </Button>
        }
      />
    </section>
  );
}

function ConsideredMoveCard({
  item,
  includedInPlan
}: {
  item: PlannerRecommendation;
  includedInPlan: boolean;
}) {
  const badgeClass = includedInPlan
    ? 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal'
    : 'border-white/10 bg-white/[0.03] text-text-secondary';
  const badgeLabel = includedInPlan ? 'Later in plan' : 'Alternative';
  const artworkClass =
    item.lane === 'cards'
      ? 'h-[3.9rem] w-[5.9rem] shrink-0 rounded-[1rem] border border-brand-gold/16 bg-white/[0.025]'
      : 'flex h-[3.9rem] w-[5.9rem] shrink-0 rounded-[1rem] border border-brand-teal/16 bg-white/[0.025]';

  return (
    <Link
      href={`${item.detailPath}${item.detailPath.includes('?') ? '&' : '?'}src=plan_results`}
      className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 transition hover:bg-white/[0.05]"
    >
      <RecommendationArtwork
        item={item}
        className={artworkClass}
        compact
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{item.provider}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-text-primary">{item.title}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-text-primary">{formatValue(item.estimatedNetValue)}</span>
    </Link>
  );
}

function ConsideredMoves({
  cardRecommendations,
  bankingRecommendations,
  plannedRecommendationIds
}: {
  cardRecommendations: PlannerRecommendation[];
  bankingRecommendations: PlannerRecommendation[];
  plannedRecommendationIds: Set<string>;
}) {
  if (cardRecommendations.length === 0 && bankingRecommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-6 py-6 md:px-8">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-brand-teal">Also considered</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Strong alternatives worth comparing</h2>
        <p className="mt-2 text-sm leading-7 text-text-secondary">
          The sequence above is the opening plan. These offers also fit your profile and are useful comparison points when you want more than the first scheduled moves.
        </p>
      </div>

      {cardRecommendations.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Top cards considered</p>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {cardRecommendations.map((item) => (
              <ConsideredMoveCard
                key={item.id}
                item={item}
                includedInPlan={plannedRecommendationIds.has(item.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {bankingRecommendations.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Top bank offers considered</p>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {bankingRecommendations.map((item) => (
              <ConsideredMoveCard
                key={item.id}
                item={item}
                includedInPlan={plannedRecommendationIds.has(item.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SelectedOfferSummary({ selectedOfferStatus }: { selectedOfferStatus: SelectedOfferIntentStatus }) {
  const sourceLabel = selectedOfferStatus.intent.sourcePath?.startsWith('/cards/compare')
    ? 'Back to compare'
    : selectedOfferStatus.intent.sourcePath?.startsWith('/cards/')
      ? 'Back to this card'
      : selectedOfferStatus.intent.sourcePath?.startsWith('/banking/')
        ? 'Back to this offer'
        : `Back to ${selectedOfferStatus.intent.lane === 'cards' ? 'cards' : 'banking'}`;

  const bannerTone =
    selectedOfferStatus.status === 'included'
      ? 'border-brand-teal/20 bg-brand-teal/10'
      : selectedOfferStatus.status === 'excluded'
        ? 'border-brand-coral/20 bg-brand-coral/10'
        : selectedOfferStatus.status === 'deferred'
          ? 'border-brand-gold/20 bg-brand-gold/10'
          : 'border-white/10 bg-white/[0.03]';
  const eyebrowTone =
    selectedOfferStatus.status === 'included'
      ? 'text-brand-teal'
      : selectedOfferStatus.status === 'excluded'
        ? 'text-brand-coral'
        : selectedOfferStatus.status === 'deferred'
          ? 'text-brand-gold'
          : 'text-text-muted';

  let headline = `Selected offer reviewed: ${selectedOfferStatus.intent.title}`;
  let detail = `${selectedOfferStatus.intent.provider} stayed in view while we built the plan.`;
  let support: string | null = null;

  if (selectedOfferStatus.status === 'included') {
    headline = `Included your selected offer: ${selectedOfferStatus.intent.title}`;
    detail = `${selectedOfferStatus.intent.provider} made the final plan and is marked in your move list below.`;
  } else if (selectedOfferStatus.status === 'excluded') {
    headline = `Left out your selected offer: ${selectedOfferStatus.intent.title}`;
    detail = `${selectedOfferStatus.intent.provider} did not fit your current profile or hard constraints.`;
    support = exclusionActions[selectedOfferStatus.reasons[0]];
  } else if (selectedOfferStatus.status === 'deferred') {
    headline = `Deferred your selected offer: ${selectedOfferStatus.intent.title}`;
    detail = `${selectedOfferStatus.intent.provider} stayed eligible, but it did not fit the final sequence.`;
    support = scheduleIssueActions[selectedOfferStatus.reason];
  } else {
    detail = `${selectedOfferStatus.intent.provider} was considered, but it did not land in the final result set.`;
  }

  return (
    <section className={`rounded-2xl border px-5 py-5 ${bannerTone}`}>
      <p className={`text-xs uppercase tracking-[0.22em] ${eyebrowTone}`}>Selected offer</p>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">{headline}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary md:text-base">
        {detail}
      </p>
      {support ? (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary">
          {support}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href={selectedOfferStatus.intent.detailPath}
          className="font-semibold text-brand-teal transition hover:underline"
        >
          View offer
        </Link>
        {selectedOfferStatus.intent.sourcePath ? (
          <Link
            href={selectedOfferStatus.intent.sourcePath}
            className="text-text-muted transition hover:text-text-primary"
          >
            {sourceLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
 * Main plan summary — the 3-section layout
 * ───────────────────────────────────────────────────────── */

function PlanSummary({
  payload,
  cardsOnlyMode,
  plannerAudience,
  isDemo
}: {
  payload: PlanResultsStoragePayload;
  cardsOnlyMode: boolean;
  plannerAudience: 'consumer' | 'business';
  isDemo: boolean;
}) {
  const planStart = useMemo(() => {
    const d = new Date(payload.savedAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [payload.savedAt]);
  const referenceDate = useMemo(() => new Date(), []);

  const prioritizedRecommendations = useMemo(
    () => rankPlannerRecommendationsByPriority(payload.recommendations),
    [payload.recommendations]
  );
  const prioritizedConsideredRecommendations = useMemo(
    () =>
      rankPlannerRecommendationsByPriority(
        payload.consideredRecommendations.length > 0
          ? payload.consideredRecommendations
          : payload.recommendations
      ),
    [payload.consideredRecommendations, payload.recommendations]
  );
  const scopedRecommendations = useMemo(
    () =>
      cardsOnlyMode
        ? prioritizedRecommendations.filter((item) => item.lane === 'cards')
        : prioritizedRecommendations,
    [cardsOnlyMode, prioritizedRecommendations]
  );
  const scopedConsideredRecommendations = useMemo(
    () =>
      cardsOnlyMode
        ? prioritizedConsideredRecommendations.filter((item) => item.lane === 'cards')
        : prioritizedConsideredRecommendations,
    [cardsOnlyMode, prioritizedConsideredRecommendations]
  );
  const timelineEntries = useMemo(
    () =>
      payload.schedule.length > 0
        ? buildScheduledTimelineEntries(scopedRecommendations, payload.schedule)
        : buildTimelineEntriesFallback(scopedRecommendations, planStart),
    [payload.schedule, planStart, scopedRecommendations]
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
  const selectedOfferStatus = useMemo(() => getSelectedOfferIntentStatus(payload), [payload]);
  const featuredRecommendations = useMemo(() => {
    return getFeaturedPlanRecommendations(orderedRecommendations, {
      maxRecommendations: 5,
      selectedRecommendationId:
        selectedOfferStatus?.status === 'included' ? selectedOfferStatus.recommendationId : null
    });
  }, [orderedRecommendations, selectedOfferStatus]);
  const plannedRecommendationIds = useMemo(
    () => new Set(orderedRecommendations.map((item) => item.id)),
    [orderedRecommendations]
  );
  const featuredRecommendationIds = useMemo(
    () => new Set(featuredRecommendations.map((item) => item.id)),
    [featuredRecommendations]
  );
  const featuredTimelineEntries = useMemo(
    () => timelineEntries.filter((entry) => featuredRecommendationIds.has(entry.id)),
    [featuredRecommendationIds, timelineEntries]
  );
  const fullPlanValue = orderedRecommendations.reduce((sum, item) => sum + item.estimatedNetValue, 0);
  const milestones = useMemo(() => buildTimelineMilestones(timelineEntries), [timelineEntries]);
  const featuredEntriesById = useMemo(
    () => new Map(featuredTimelineEntries.map((entry) => [entry.id, entry])),
    [featuredTimelineEntries]
  );
  const featuredStartSequenceGroups = useMemo(
    () => buildStartSequenceGroups(featuredRecommendations, featuredEntriesById, referenceDate),
    [featuredEntriesById, featuredRecommendations, referenceDate]
  );
  const cardAlternatives = useMemo(
    () =>
      scopedConsideredRecommendations
        .filter((item) => item.lane === 'cards' && !featuredRecommendationIds.has(item.id))
        .slice(0, 4),
    [featuredRecommendationIds, scopedConsideredRecommendations]
  );
  const bankingAlternatives = useMemo(
    () =>
      cardsOnlyMode
        ? []
        : scopedConsideredRecommendations
            .filter((item) => item.lane === 'banking' && !featuredRecommendationIds.has(item.id))
            .slice(0, 4),
    [cardsOnlyMode, featuredRecommendationIds, scopedConsideredRecommendations]
  );

  const animatedTotal = useCountUp(fullPlanValue);

  return (
    <div>
      {selectedOfferStatus ? <SelectedOfferSummary selectedOfferStatus={selectedOfferStatus} /> : null}

      {/* ── ① Hero ── */}
      <section
        className="mt-2 rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-6 py-6 md:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-end">
          <div className="max-w-3xl">
            {isDemo ? (
              <span className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-teal">
                Demo fixture
              </span>
            ) : null}
            <h1
              className={`font-heading text-5xl leading-none text-text-primary md:text-6xl ${
                isDemo ? 'mt-5' : 'mt-3'
              }`}
            >
              {cardsOnlyMode
                ? 'Your Card Plan'
                : plannerAudience === 'business'
                  ? 'Your Business Bonus Plan'
                  : 'Your Bonus Plan'}
            </h1>
          </div>

          <div className="lg:justify-self-end lg:text-right">
            <p className="font-heading text-6xl text-text-primary md:text-7xl">
              {formatValue(animatedTotal)}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Across {orderedRecommendations.length} planned move{orderedRecommendations.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <PlanStartSequence groups={featuredStartSequenceGroups} />
          <div>
            <PlanScheduleBoard
              recommendations={featuredRecommendations}
              entriesById={featuredEntriesById}
              selectedRecommendationId={
                selectedOfferStatus?.status === 'included' ? selectedOfferStatus.recommendationId : null
              }
            />
          </div>
        </div>
      </section>

      {/* ── ② Save & Act ── */}
      <SaveActBar
        recommendations={orderedRecommendations}
        milestones={milestones}
        totalValue={fullPlanValue}
        cardsOnlyMode={cardsOnlyMode}
        timelineEntries={timelineEntries}
        referenceDate={referenceDate}
      />

      <ConsideredMoves
        cardRecommendations={cardAlternatives}
        bankingRecommendations={bankingAlternatives}
        plannedRecommendationIds={plannedRecommendationIds}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Page-level wrapper (loading / missing / results)
 * ───────────────────────────────────────────────────────── */

export function PlanResultsView() {
  const searchParams = useSearchParams();
  const cardsOnlyMode = searchParams.get('mode') === 'cards_only';
  const businessModeParam = searchParams.get('audience') === 'business';
  const demoMode = searchParams.get('demo') === 'true';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (demoMode) {
      setState({
        status: 'fresh',
        payload: getDemoPlanPayload({ cardsOnlyMode }),
        source: 'session'
      });
      return;
    }

    const loaded = loadPlanResults();
    setState(loaded);

    if (loaded.status === 'fresh' || loaded.status === 'recovered') {
      const plannerAudience = getPlanResultsAudience(loaded.payload);
      const businessMode = plannerAudience === 'business';
      trackFunnelEvent('plan_results_view', {
        source: cardsOnlyMode
          ? 'cards_only_path'
          : businessMode
            ? 'business_path'
          : loaded.status === 'fresh'
            ? loaded.source
            : 'local_recovery',
        path: '/plan/results',
        tool: cardsOnlyMode ? 'cards_only_path' : businessMode ? 'business_plan' : 'card_finder'
      });
    }
  }, [cardsOnlyMode, demoMode]);

  const plannerAudience =
    state.status === 'fresh' || state.status === 'recovered'
      ? getPlanResultsAudience(state.payload)
      : businessModeParam
        ? 'business'
        : 'consumer';

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
              : plannerAudience === 'business'
                ? 'Your previous business bonus plan expired. Build a fresh plan to get up-to-date recommendations.'
              : 'Your previous plan expired. Build a fresh plan to get up-to-date recommendations.'
            : cardsOnlyMode
              ? 'Build a plan first to view your personalized credit card bonus actions.'
              : plannerAudience === 'business'
                ? 'Build a plan first to view your personalized business-card and business-banking actions.'
              : 'Build a plan first to view your personalized card and banking bonus actions.'}
        </p>
        <div className="mt-6">
          <Link
            href={
              cardsOnlyMode
                ? '/cards/plan'
                : plannerAudience === 'business'
                  ? '/tools/card-finder?mode=full&audience=business'
                  : '/tools/card-finder?mode=full'
            }
          >
            <Button>
              {cardsOnlyMode
                ? 'Build My Card-Only Plan'
                : plannerAudience === 'business'
                  ? 'Build My Business Plan'
                  : 'Start My Bonus Plan'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {state.status === 'recovered' && (
        <p className="text-base text-brand-gold">
          Recovered your latest saved plan from this browser.
        </p>
      )}
      <PlanSummary
        payload={state.payload}
        cardsOnlyMode={cardsOnlyMode}
        plannerAudience={plannerAudience}
        isDemo={demoMode}
      />
    </div>
  );
}
