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

export type TimelineMilestoneKind = 'open' | 'complete' | 'payout';

export type TimelineMilestone = {
  id: string;
  recommendationId: string;
  lane: TimelineEntry['lane'];
  title: string;
  date: Date;
  kind: TimelineMilestoneKind;
  label: string;
};

export type TimelineMonthBucket = {
  key: string;
  label: string;
  monthStart: Date;
  items: TimelineMilestone[];
};

export type TimelineCalendarDay = {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
  items: TimelineMilestone[];
};

export const TIMELINE_DAYS = 180;
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

export function recommendationRationale(item: PlannerRecommendation) {
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

export function formatDetailedDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfMonth(date: Date) {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toTimelineDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function formatDaysUntil(date: Date, referenceDate: Date) {
  const days = diffDays(referenceDate, date);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
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

const milestoneOrder: Record<TimelineMilestoneKind, number> = {
  open: 0,
  complete: 1,
  payout: 2
};

export function buildTimelineMilestones(entries: TimelineEntry[]): TimelineMilestone[] {
  return entries
    .flatMap((entry) => [
      {
        id: `${entry.id}:open`,
        recommendationId: entry.id,
        lane: entry.lane,
        title: entry.title,
        date: new Date(entry.startDate),
        kind: 'open' as const,
        label: 'Apply/open by'
      },
      {
        id: `${entry.id}:complete`,
        recommendationId: entry.id,
        lane: entry.lane,
        title: entry.title,
        date: new Date(entry.completeDate),
        kind: 'complete' as const,
        label: 'Complete by'
      },
      {
        id: `${entry.id}:payout`,
        recommendationId: entry.id,
        lane: entry.lane,
        title: entry.title,
        date: new Date(entry.payoutDate),
        kind: 'payout' as const,
        label: 'Bonus expected'
      }
    ])
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() || milestoneOrder[a.kind] - milestoneOrder[b.kind]
    );
}

export function getUpcomingTimelineMilestones(
  milestones: TimelineMilestone[],
  referenceDate: Date,
  daysAhead = 30,
  limit = 4
) {
  const windowStart = startOfDay(referenceDate);
  const windowEnd = addDays(windowStart, daysAhead);
  const futureMilestones = milestones.filter((item) => item.date.getTime() >= windowStart.getTime());
  const inWindow = futureMilestones.filter((item) => item.date.getTime() <= windowEnd.getTime());

  return (inWindow.length > 0 ? inWindow : futureMilestones).slice(0, limit);
}

export function buildTimelineMonthBuckets(
  milestones: TimelineMilestone[],
  planStart: Date,
  monthWindow = 6
): TimelineMonthBucket[] {
  const normalizedPlanStart = startOfMonth(planStart);
  const totalMonths = Math.max(1, monthWindow);

  return Array.from({ length: totalMonths }, (_, index) => {
    const monthStart = new Date(normalizedPlanStart);
    monthStart.setMonth(monthStart.getMonth() + index);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
      label: formatMonthYear(monthStart),
      monthStart,
      items: milestones.filter(
        (item) => item.date.getTime() >= monthStart.getTime() && item.date.getTime() < nextMonth.getTime()
      )
    };
  });
}

export function findTimelineMonthIndex(
  monthBuckets: TimelineMonthBucket[],
  referenceDate: Date
) {
  if (monthBuckets.length === 0) return 0;

  const currentMonthIndex = monthBuckets.findIndex(
    (bucket) =>
      bucket.monthStart.getFullYear() === referenceDate.getFullYear() &&
      bucket.monthStart.getMonth() === referenceDate.getMonth()
  );
  if (currentMonthIndex >= 0) return currentMonthIndex;

  const firstFutureMonthIndex = monthBuckets.findIndex(
    (bucket) => bucket.items.some((item) => item.date.getTime() >= referenceDate.getTime())
  );

  return firstFutureMonthIndex >= 0 ? firstFutureMonthIndex : 0;
}

export function buildTimelineCalendarDays(
  milestones: TimelineMilestone[],
  monthStart: Date
): TimelineCalendarDay[] {
  const normalizedMonthStart = startOfMonth(monthStart);
  const gridStart = addDays(normalizedMonthStart, -normalizedMonthStart.getDay());
  const itemsByDay = new Map<string, TimelineMilestone[]>();

  for (const milestone of milestones) {
    const key = toTimelineDayKey(milestone.date);
    const current = itemsByDay.get(key) ?? [];
    current.push(milestone);
    itemsByDay.set(key, current);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      key: toTimelineDayKey(date),
      date,
      inCurrentMonth: isSameMonth(date, normalizedMonthStart),
      items: itemsByDay.get(toTimelineDayKey(date)) ?? []
    };
  });
}

export function timelineMilestoneActionCopy(
  milestone: TimelineMilestone,
  recommendation?: PlannerRecommendation
) {
  if (milestone.kind === 'open') {
    return milestone.lane === 'cards'
      ? 'Apply for this card and start the spend window.'
      : 'Open the account and start the setup steps.';
  }

  if (milestone.kind === 'complete') {
    return recommendation?.keyRequirements[0] ?? 'Finish the requirement window for this offer.';
  }

  return 'Check that the bonus posted and save the confirmation details.';
}

export function recommendationWarningFlags(recommendation?: PlannerRecommendation) {
  if (!recommendation) return [];

  const warnings: string[] = [];
  if ((recommendation.scheduleConstraints.requiredDeposit ?? 0) >= 100000) {
    warnings.push('High cash requirement');
  }
  if (recommendation.scheduleConstraints.requiresDirectDeposit) {
    warnings.push('Direct deposit needed');
  }
  if ((recommendation.valueBreakdown?.annualFee ?? 0) > 0) {
    warnings.push('Annual fee');
  }
  if (recommendation.effort === 'high') {
    warnings.push('High effort');
  }

  return warnings;
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

type IcsMilestone = {
  label: string;
  date: Date;
  description: string;
  reminderDays: number;
};

function buildEntryMilestones(
  entry: TimelineEntry,
  recommendation?: PlannerRecommendation
): IcsMilestone[] {
  const spend = recommendation?.scheduleConstraints.requiredSpend;
  const deposit = recommendation?.scheduleConstraints.requiredDeposit;
  const needsDD = recommendation?.scheduleConstraints.requiresDirectDeposit;
  const netValue = recommendation ? formatValue(recommendation.estimatedNetValue) : '';

  // -- Open event --
  let openDesc: string;
  if (entry.lane === 'cards') {
    openDesc = `Apply for ${entry.title}.`;
    if (spend) openDesc += ` You'll need to spend $${spend.toLocaleString()} before your deadline.`;
  } else {
    openDesc = `Open ${entry.title}.`;
    if (deposit) openDesc += ` Deposit $${deposit.toLocaleString()}.`;
    if (needsDD) openDesc += ' Set up direct deposit.';
  }

  // -- Complete/deadline event --
  let completeLabel: string;
  let completeDesc: string;
  if (entry.lane === 'cards') {
    completeLabel = `DEADLINE: ${entry.title} spend`;
    completeDesc = spend
      ? `Last day to hit $${spend.toLocaleString()} in spending on ${entry.title}.`
      : `Last day to meet the spending requirement for ${entry.title}.`;
  } else {
    completeLabel = `DEADLINE: ${entry.title} requirements`;
    completeDesc = `Last day to meet the bonus requirements for ${entry.title}.`;
  }

  // -- Payout event --
  const payoutDesc = netValue
    ? `${netValue} bonus from ${entry.title} should post around this date. Check your account.`
    : `Bonus from ${entry.title} should post around this date. Check your account.`;

  return [
    {
      label: `Apply/open: ${entry.title}`,
      date: entry.startDate,
      description: openDesc,
      reminderDays: 0
    },
    {
      label: completeLabel,
      date: entry.completeDate,
      description: completeDesc,
      reminderDays: 3
    },
    {
      label: `Bonus expected: ${entry.title}`,
      date: entry.payoutDate,
      description: payoutDesc,
      reminderDays: 0
    }
  ];
}

export function buildTimelineIcs(
  entries: TimelineEntry[],
  recommendations?: PlannerRecommendation[]
) {
  const recommendationsById = new Map(
    (recommendations ?? []).map((item) => [item.id, item])
  );

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Stack//Bonus Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const entry of entries) {
    const recommendation = recommendationsById.get(entry.id);
    const milestones = buildEntryMilestones(entry, recommendation);

    for (const milestone of milestones) {
      const start = toIcsDate(milestone.date);
      const end = toIcsDate(addDays(milestone.date, 1));
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${escapeIcsText(`${entry.id}-${milestone.label}@thestackhq.com`)}`);
      lines.push(`DTSTAMP:${toIcsDate(new Date())}T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${escapeIcsText(milestone.label)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(milestone.description)}`);

      // Add reminder alarm for deadlines
      if (milestone.reminderDays > 0) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(milestone.label)} — ${milestone.reminderDays} days left`);
        lines.push(`TRIGGER:-P${milestone.reminderDays}D`);
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadTimelineCalendar(
  entries: TimelineEntry[],
  recommendations?: PlannerRecommendation[]
) {
  if (entries.length === 0) return;
  const ics = buildTimelineIcs(entries, recommendations);
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
