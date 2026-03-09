import type { PlanResultsStoragePayload } from '@/lib/plan-results-storage';
import type { PlannerRecommendation } from '@/lib/planner-recommendations';

export type TimelineEntry = {
  id: string;
  lane: 'cards' | 'banking';
  title: string;
  startDate: Date;
  completeDate: Date;
  payoutDate: Date;
};

export const TIMELINE_DAYS = 365;
export const MIN_VISIBLE_BENEFIT_ADJUSTMENT = 25;

export function sameSlugSelections(left: string[], right: string[]) {
  const normalizedLeft = Array.from(new Set(left)).sort();
  const normalizedRight = Array.from(new Set(right)).sort();

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((slug, index) => slug === normalizedRight[index])
  );
}

export function formatValue(value: number) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString()}`;
}

export function formatSignedValue(value: number, tone: 'positive' | 'negative') {
  return `${tone === 'positive' ? '+' : '-'}${formatValue(value)}`;
}

export function whyThisIsFirst(item: PlannerRecommendation) {
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

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function toTimelinePercent(planStart: Date, date: Date) {
  const day = diffDays(planStart, date);
  return Math.max(0, Math.min(100, (day / TIMELINE_DAYS) * 100));
}

export function monthLabels(planStart: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const d = new Date(planStart);
    d.setMonth(d.getMonth() + index);
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  });
}

export function scheduleLane(
  items: PlannerRecommendation[],
  planStart: Date,
  lane: TimelineEntry['lane']
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

export function buildScheduledTimelineEntries(
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

export function buildTimelineEntriesFallback(
  recommendations: PlannerRecommendation[],
  planStart: Date
): TimelineEntry[] {
  const cards = recommendations.filter((item) => item.lane === 'cards');
  const banking = recommendations.filter((item) => item.lane === 'banking');
  return [...scheduleLane(cards, planStart, 'cards'), ...scheduleLane(banking, planStart, 'banking')].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

export function toIcsDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildTimelineIcs(entries: TimelineEntry[]) {
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

export function downloadTimelineCalendar(entries: TimelineEntry[]) {
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
