import { z } from 'zod';

const planEmailRecommendationSchema = z.object({
  provider: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  estimatedNetValue: z.number().finite().min(0).max(1_000_000),
  effort: z.enum(['low', 'medium', 'high']),
  valueBreakdown: z
    .object({
      annualFee: z.number().nonnegative().max(10_000).optional()
    })
    .optional(),
  scheduleConstraints: z.object({
    requiredDeposit: z.number().nonnegative().max(1_000_000).optional(),
    requiresDirectDeposit: z.boolean().optional()
  })
});

const planEmailMilestoneSchema = z.object({
  label: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(200),
  date: z.coerce.date()
});

export const planSnapshotDataSchema = z.object({
  totalValue: z.number().finite().min(0).max(1_000_000),
  cardsOnlyMode: z.boolean(),
  recommendations: z.array(planEmailRecommendationSchema).max(12),
  milestones: z.array(planEmailMilestoneSchema).max(60)
});

export const planEmailContentSchema = planSnapshotDataSchema.extend({
  referenceDate: z.coerce.date()
});

export const savePlanSnapshotRequestSchema = planSnapshotDataSchema;

export const sendPlanEmailRequestSchema = z.object({
  to: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  planId: z.string().trim().min(1).max(120),
  turnstileToken: z.string().trim().min(1).max(2048).optional()
});

export type PlanEmailRecommendation = z.infer<typeof planEmailRecommendationSchema>;
export type PlanEmailMilestone = z.infer<typeof planEmailMilestoneSchema>;
export type PlanSnapshotData = z.infer<typeof planSnapshotDataSchema>;
export type PlanEmailContent = z.infer<typeof planEmailContentSchema>;
export type SavePlanSnapshotRequest = z.infer<typeof savePlanSnapshotRequestSchema>;
export type SendPlanEmailRequest = z.infer<typeof sendPlanEmailRequestSchema>;

function formatValue(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function recommendationWarningFlags(recommendation: PlanEmailRecommendation) {
  const warnings: string[] = [];

  if ((recommendation.scheduleConstraints.requiredDeposit ?? 0) >= 100_000) {
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

function getUpcomingTimelineMilestones(
  milestones: PlanEmailMilestone[],
  referenceDate: Date,
  daysAhead = 45,
  limit = 5
) {
  const windowStart = startOfDay(referenceDate);
  const windowEnd = addDays(windowStart, daysAhead);
  const futureMilestones = milestones
    .filter((milestone) => milestone.date.getTime() >= windowStart.getTime())
    .sort((left, right) => left.date.getTime() - right.date.getTime());
  const inWindow = futureMilestones.filter(
    (milestone) => milestone.date.getTime() <= windowEnd.getTime()
  );

  return (inWindow.length > 0 ? inWindow : futureMilestones).slice(0, limit);
}

export function buildPlanEmailSubject(totalValue: number, cardsOnlyMode: boolean) {
  return cardsOnlyMode
    ? `My The Stack card plan (${formatValue(totalValue)})`
    : `My The Stack bonus plan (${formatValue(totalValue)})`;
}

export function buildPlanEmailBody(input: PlanEmailContent) {
  const upcomingMilestones = getUpcomingTimelineMilestones(
    input.milestones,
    input.referenceDate
  );
  const moveLines = input.recommendations.slice(0, 5).map((recommendation, index) => {
    const warnings = recommendationWarningFlags(recommendation);
    const warningSuffix = warnings[0] ? `; ${warnings[0]}` : '';

    return `${index + 1}. ${recommendation.provider} - ${recommendation.title} (${formatValue(
      recommendation.estimatedNetValue
    )} est${warningSuffix})`;
  });

  return [
    `Here is my ${input.cardsOnlyMode ? 'card-only' : 'bonus'} plan from The Stack.`,
    '',
    `6-month estimate: ${formatValue(input.totalValue)}`,
    '',
    'Next actions:',
    ...(upcomingMilestones.length > 0
      ? upcomingMilestones.map(
          (milestone) =>
            `- ${formatShortDate(milestone.date)}: ${milestone.label} - ${milestone.title}`
        )
      : ['- No scheduled actions yet.']),
    '',
    'Planned moves:',
    ...(moveLines.length > 0 ? moveLines : ['No recommendations yet.']),
    '',
    'Reminder:',
    'Download the .ics calendar from the plan page if I want these dates in my calendar.'
  ].join('\n');
}

export function toPlanEmailContent(
  snapshot: PlanSnapshotData,
  referenceDate: Date
): PlanEmailContent {
  return {
    ...snapshot,
    referenceDate
  };
}
