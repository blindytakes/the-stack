import { z } from 'zod';
import {
  formatDateKeyedShortDate,
  getUpcomingDateKeyedItems,
  toLocalDateKey
} from '@/lib/plan-date-utils';

const planEmailRecommendationSchema = z.object({
  lane: z.enum(['cards', 'banking']).optional(),
  provider: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  estimatedNetValue: z.number().finite().min(0).max(1_000_000),
  effort: z.enum(['low', 'medium', 'high']),
  detailPath: z.string().trim().min(1).max(400).optional(),
  keyRequirements: z.array(z.string().trim().min(1).max(200)).max(3).optional(),
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
  date: z.coerce.date(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
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
  referenceDateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  turnstileToken: z.string().trim().min(1).max(2048).optional()
});

export type PlanEmailRecommendation = z.infer<typeof planEmailRecommendationSchema>;
export type PlanEmailMilestone = z.infer<typeof planEmailMilestoneSchema>;
export type PlanSnapshotData = z.infer<typeof planSnapshotDataSchema>;
export type PlanEmailContent = z.infer<typeof planEmailContentSchema>;
export type SavePlanSnapshotRequest = z.infer<typeof savePlanSnapshotRequestSchema>;
export type SendPlanEmailRequest = z.infer<typeof sendPlanEmailRequestSchema>;

const SITE_URL = 'https://thestackhq.com';
const SITE_ICON_URL = `${SITE_URL}/icon.png`;

type PlanEmailRenderOptions = {
  savedPlanUrl?: string;
  referenceDateKey?: string;
};

function formatValue(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
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
  referenceDateKey?: string,
  daysAhead = 45,
  limit = 5
) {
  return getUpcomingDateKeyedItems(milestones, referenceDate, {
    referenceDateKey,
    daysAhead,
    limit
  });
}

export function buildPlanEmailSubject(totalValue: number, cardsOnlyMode: boolean) {
  return cardsOnlyMode
    ? `My The Stack card plan (${formatValue(totalValue)})`
    : `My The Stack bonus plan (${formatValue(totalValue)})`;
}

export function buildSavedPlanUrl(planId: string) {
  return `${SITE_URL}/plan/saved/${encodeURIComponent(planId)}`;
}

export function buildReferenceDateKey(date: Date) {
  return toLocalDateKey(date);
}

export function buildPlanEmailBody(
  input: PlanEmailContent,
  options: PlanEmailRenderOptions = {}
) {
  const upcomingMilestones = getUpcomingTimelineMilestones(
    input.milestones,
    input.referenceDate,
    options.referenceDateKey
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
            `- ${formatDateKeyedShortDate(milestone)}: ${milestone.label} - ${milestone.title}`
        )
      : ['- No scheduled actions yet.']),
    '',
    'Planned moves:',
    ...(moveLines.length > 0 ? moveLines : ['No recommendations yet.']),
    '',
    'Reminder:',
    'Download the .ics calendar from the plan page if I want these dates in my calendar.',
    ...(options.savedPlanUrl ? ['', `View full plan: ${options.savedPlanUrl}`] : [])
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(path: string | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? `${SITE_URL}${path}` : `${SITE_URL}/${path}`;
}

function laneLabel(lane: PlanEmailRecommendation['lane']) {
  return lane === 'banking' ? 'Bank bonus' : 'Card bonus';
}

function lanePillStyles(lane: PlanEmailRecommendation['lane']) {
  if (lane === 'banking') {
    return 'background:#16223c;color:#c7d7ff;border:1px solid #24365a;';
  }
  return 'background:#15312c;color:#9bf3d2;border:1px solid #225247;';
}

export function buildPlanEmailHtml(
  input: PlanEmailContent,
  options: PlanEmailRenderOptions = {}
) {
  const upcomingMilestones = getUpcomingTimelineMilestones(
    input.milestones,
    input.referenceDate,
    options.referenceDateKey
  );
  const primaryUrl = options.savedPlanUrl ?? SITE_URL;
  const moveCount = input.recommendations.length;
  const cardCount = input.recommendations.filter((item) => item.lane !== 'banking').length;
  const bankCount = input.recommendations.filter((item) => item.lane === 'banking').length;
  const statCards = [
    { label: 'Estimate', value: formatValue(input.totalValue) },
    { label: 'Moves', value: String(moveCount) },
    { label: 'Next actions', value: String(upcomingMilestones.length) }
  ];
  const summaryPills = [
    `${moveCount} move${moveCount === 1 ? '' : 's'}`,
    cardCount > 0 ? `${cardCount} card bonus${cardCount === 1 ? '' : 'es'}` : null,
    bankCount > 0 ? `${bankCount} bank bonus${bankCount === 1 ? '' : 'es'}` : null
  ].filter((value): value is string => Boolean(value));

  const moveCards = input.recommendations.slice(0, 5).map((recommendation, index) => {
    const warnings = recommendationWarningFlags(recommendation);
    const detailUrl = toAbsoluteUrl(recommendation.detailPath);
    const noteParts = [
      recommendation.keyRequirements?.[0],
      warnings[0]
    ].filter((value): value is string => Boolean(value));

    return `
      <tr>
        <td style="padding:0 0 14px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#111827;border:1px solid #1f2937;border-radius:18px;">
            <tr>
              <td style="padding:18px 18px 16px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f8fafc;">
                <div style="margin-bottom:10px;">
                  <span style="display:inline-block;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;${lanePillStyles(
                    recommendation.lane
                  )}">${escapeHtml(laneLabel(recommendation.lane))}</span>
                </div>
                <div style="font-size:13px;color:#94a3b8;letter-spacing:0.01em;">
                  Move ${index + 1} · ${escapeHtml(recommendation.provider)}
                </div>
                <div style="margin-top:6px;font-size:20px;line-height:1.35;font-weight:700;color:#f8fafc;">
                  ${escapeHtml(recommendation.title)}
                </div>
                <div style="margin-top:10px;font-size:16px;font-weight:700;color:#5eead4;">
                  ${escapeHtml(formatValue(recommendation.estimatedNetValue))} estimated value
                </div>
                ${
                  noteParts[0]
                    ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:#cbd5e1;">${escapeHtml(
                        noteParts[0]
                      )}</div>`
                    : ''
                }
                ${
                  detailUrl
                    ? `<div style="margin-top:16px;"><a href="${escapeHtml(
                        detailUrl
                      )}" style="display:inline-block;padding:10px 14px;border-radius:999px;background:#1d4ed8;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">View offer details</a></div>`
                    : ''
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  });

  const milestoneRows =
    upcomingMilestones.length > 0
      ? upcomingMilestones
          .map(
            (milestone) => `
              <tr>
                <td style="padding:0 0 12px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#0f172a;border:1px solid #1e293b;border-radius:16px;">
                    <tr>
                      <td style="padding:14px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                        <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5eead4;">
                          ${escapeHtml(formatDateKeyedShortDate(milestone))}
                        </div>
                        <div style="margin-top:6px;font-size:15px;font-weight:700;color:#f8fafc;">
                          ${escapeHtml(milestone.label)}
                        </div>
                        <div style="margin-top:4px;font-size:14px;line-height:1.5;color:#cbd5e1;">
                          ${escapeHtml(milestone.title)}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td style="padding:16px 18px;border:1px solid #1e293b;border-radius:16px;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#cbd5e1;">
              No scheduled actions yet.
            </td>
          </tr>
        `;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(buildPlanEmailSubject(input.totalValue, input.cardsOnlyMode))}</title>
      </head>
      <body style="margin:0;padding:0;background:#020617;color:#f8fafc;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#020617;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td width="44" style="padding-right:12px;">
                          <img src="${SITE_ICON_URL}" alt="The Stack" width="44" height="44" style="display:block;border:0;border-radius:12px;" />
                        </td>
                        <td style="font-size:18px;font-weight:800;letter-spacing:0.01em;color:#f8fafc;">
                          The Stack
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="overflow:hidden;border-radius:28px;background:#081521;border:1px solid #163348;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:26px 24px 18px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5eead4;">
                            ${input.cardsOnlyMode ? 'Card plan snapshot' : 'Bonus plan snapshot'}
                          </div>
                          <div style="margin-top:10px;font-size:38px;line-height:1.05;font-weight:800;color:#f8fafc;">
                            ${escapeHtml(formatValue(input.totalValue))}
                          </div>
                          <div style="margin-top:12px;font-size:16px;line-height:1.7;color:#cbd5e1;">
                            Your saved plan with next actions, top moves, and a full web version ready to reopen.
                          </div>
                          <div style="margin-top:16px;">
                            ${summaryPills
                              .map(
                                (pill) => `<span style="display:inline-block;margin:0 8px 8px 0;padding:7px 11px;border-radius:999px;border:1px solid #234057;background:#0f2335;color:#cbd5e1;font-size:12px;font-weight:700;">${escapeHtml(
                                  pill
                                )}</span>`
                              )
                              .join('')}
                          </div>
                          <div style="margin-top:18px;">
                            <a href="${escapeHtml(primaryUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#14b8a6;color:#04111a;font-size:14px;font-weight:800;text-decoration:none;">
                              ${options.savedPlanUrl ? 'Open full plan' : 'Open The Stack'}
                            </a>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
                            <tr>
                              ${statCards
                                .map(
                                  (card, index) => `
                                    <td width="33.33%" style="${
                                      index > 0 ? 'padding-left:8px;' : ''
                                    }">
                                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#0f1f2f;border:1px solid #1c3850;border-radius:18px;">
                                        <tr>
                                          <td style="padding:14px 14px 12px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                                            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8ea8be;">
                                              ${escapeHtml(card.label)}
                                            </div>
                                            <div style="margin-top:8px;font-size:22px;line-height:1.15;font-weight:800;color:#f8fafc;">
                                              ${escapeHtml(card.value)}
                                            </div>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  `
                                )
                                .join('')}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 0 10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    <div style="font-size:22px;font-weight:800;color:#f8fafc;">Next actions</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#94a3b8;">
                      The first dates to keep in front of you.
                    </div>
                  </td>
                </tr>
                ${milestoneRows}
                <tr>
                  <td style="padding:18px 0 10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    <div style="font-size:22px;font-weight:800;color:#f8fafc;">Top moves</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#94a3b8;">
                      The highest-priority recommendations from your current plan.
                    </div>
                  </td>
                </tr>
                ${moveCards.join('')}
                <tr>
                  <td style="padding:12px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#0f172a;border:1px solid #1e293b;border-radius:18px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <div style="font-size:14px;font-weight:700;color:#f8fafc;">Calendar reminder</div>
                          <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#cbd5e1;">
                            Download the .ics calendar from the plan page if you want these dates on your calendar.
                          </div>
                          ${
                            options.savedPlanUrl
                              ? `<div style="margin-top:14px;"><a href="${escapeHtml(
                                  options.savedPlanUrl
                                )}" style="color:#5eead4;font-size:14px;font-weight:700;text-decoration:none;">View the saved web version</a></div>`
                              : ''
                          }
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.7;color:#64748b;">
                    This email is a visual snapshot of your plan. Some email clients may block images until you choose to display them.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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
