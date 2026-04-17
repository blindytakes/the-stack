import { z } from 'zod';
import {
  calculatePremiumCardScenario,
  premiumCardProfiles,
  type PremiumCardCalculation,
  type PremiumCardId,
  type PremiumCardProfile,
  type PremiumCardScenario,
  type PremiumCardValueInput
} from '@/lib/premium-card-calculator';

const SITE_URL = 'https://thestackhq.com';
const TOOL_URL = `${SITE_URL}/tools/premium-card-calculator`;

const premiumCardIdValues = premiumCardProfiles.map((profile) => profile.id) as [
  PremiumCardId,
  ...PremiumCardId[]
];

const moneyValueSchema = z.number().finite().min(0).max(1_000_000);

const moneyRecordSchema = z.record(z.string().trim().min(1).max(200), moneyValueSchema);

export const premiumCardScenarioSchema = z.object({
  eligibleForBonus: z.boolean(),
  canMeetSpend: z.boolean(),
  offerPoints: moneyValueSchema,
  annualFee: moneyValueSchema,
  selectedRedemptionId: z.string().trim().min(1).max(120),
  centsPerPoint: z.number().finite().min(0).max(20),
  spend: moneyRecordSchema,
  credits: moneyRecordSchema,
  benefits: moneyRecordSchema,
  firstYearExtraValue: moneyValueSchema,
  renewalOnlyValue: moneyValueSchema
});

export const sendPremiumCardCalculatorEmailRequestSchema = z.object({
  to: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  profileId: z.enum(premiumCardIdValues),
  scenario: premiumCardScenarioSchema,
  turnstileToken: z.string().trim().min(1).max(2048).optional()
});

export type SendPremiumCardCalculatorEmailRequest = z.infer<
  typeof sendPremiumCardCalculatorEmailRequestSchema
>;

type PremiumCardEmailValueRow = {
  label: string;
  value: number;
};

type PremiumCardEmailTableSection = {
  title: string;
  headers?: string[];
  rows: string[][];
  emptyMessage?: string;
  rightAlignColumns?: number[];
};

export type PremiumCardEmailContent = {
  profile: PremiumCardProfile;
  scenario: PremiumCardScenario;
  calculation: PremiumCardCalculation;
  selectedRedemptionLabel: string;
  spendRows: Array<{ label: string; spend: number; pointsEarned: number }>;
  creditRows: PremiumCardEmailValueRow[];
  benefitRows: PremiumCardEmailValueRow[];
};

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatPoints(value: number) {
  return Math.round(value).toLocaleString();
}

function formatCpp(value: number) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value);
  return `${formatted} CPP`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function collectNonZeroValueRows(
  inputs: ReadonlyArray<PremiumCardValueInput>,
  values: Record<string, number>
) {
  return inputs
    .map((input) => ({
      label: input.label,
      value: Math.round(values[input.id] ?? 0)
    }))
    .filter((row) => row.value > 0);
}

function renderValueLines(
  rows: PremiumCardEmailValueRow[],
  emptyMessage: string
) {
  if (rows.length === 0) {
    return [emptyMessage];
  }

  return rows.map((row) => `- ${row.label}: ${formatCurrency(row.value)}`);
}

function renderDataTable({
  title,
  headers,
  rows,
  emptyMessage,
  rightAlignColumns = []
}: PremiumCardEmailTableSection) {
  const columnCount = headers?.length ?? rows[0]?.length ?? 1;
  const headerRow = headers
    ? `
      <tr>
        ${headers
          .map(
            (header, index) => `
              <th style="padding:10px 14px;border:1px solid #dbe3ea;background:#f8fafc;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;text-align:${
                rightAlignColumns.includes(index) ? 'right' : 'left'
              };">
                ${escapeHtml(header)}
              </th>
            `
          )
          .join('')}
      </tr>
    `
    : '';

  const bodyRows =
    rows.length > 0
      ? rows
          .map(
            (row) => `
              <tr>
                ${row
                  .map((cell, index) => {
                    const rightAligned = rightAlignColumns.includes(index);
                    return `
                      <td style="padding:12px 14px;border:1px solid #dbe3ea;font-size:14px;line-height:1.5;color:#0f172a;text-align:${
                        rightAligned ? 'right' : 'left'
                      };${rightAligned ? 'white-space:nowrap;font-variant-numeric:tabular-nums;' : ''}">
                        ${escapeHtml(cell)}
                      </td>
                    `;
                  })
                  .join('')}
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td colspan="${columnCount}" style="padding:12px 14px;border:1px solid #dbe3ea;font-size:14px;line-height:1.6;color:#64748b;">
              ${escapeHtml(emptyMessage ?? 'No values entered yet.')}
            </td>
          </tr>
        `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td colspan="${columnCount}" style="padding:12px 14px;border:1px solid #dbe3ea;background:#eff6ff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1e3a5f;">
          ${escapeHtml(title)}
        </td>
      </tr>
      ${headerRow}
      ${bodyRows}
    </table>
  `;
}

export function buildPremiumCardEmailContent(
  profile: PremiumCardProfile,
  scenario: PremiumCardScenario
): PremiumCardEmailContent {
  const calculation = calculatePremiumCardScenario(profile, scenario);
  const selectedRedemptionLabel =
    profile.redemptionOptions.find((option) => option.id === scenario.selectedRedemptionId)
      ?.label ?? 'Custom';

  return {
    profile,
    scenario,
    calculation,
    selectedRedemptionLabel,
    spendRows: calculation.spendBreakdown
      .filter((row) => row.spend > 0)
      .map((row) => ({
        label: row.label,
        spend: row.spend,
        pointsEarned: row.pointsEarned
      })),
    creditRows: collectNonZeroValueRows(profile.credits, scenario.credits),
    benefitRows: collectNonZeroValueRows(profile.benefits, scenario.benefits)
  };
}

export function buildPremiumCardCalculatorEmailSubject(
  content: PremiumCardEmailContent
) {
  return `My ${content.profile.shortName} calculator results (${formatCurrency(
    content.calculation.expectedValueYear1
  )})`;
}

export function buildPremiumCardCalculatorEmailBody(
  content: PremiumCardEmailContent
) {
  const bonusCounted =
    content.scenario.eligibleForBonus && content.scenario.canMeetSpend ? 'Yes' : 'No';

  return [
    `Here is my The Stack premium card calculator report for ${content.profile.shortName}.`,
    '',
    'Report summary:',
    `- Modeled card: ${content.profile.name}`,
    `- Year 1 expected value: ${formatCurrency(content.calculation.expectedValueYear1)}`,
    `- Year 2 expected value: ${formatCurrency(content.calculation.expectedValueYear2)}`,
    `- Annual fee modeled: ${formatCurrency(content.scenario.annualFee)}`,
    `- Redemption assumption: ${content.selectedRedemptionLabel} (${formatCpp(
      content.scenario.centsPerPoint
    )})`,
    `- Welcome-offer eligible: ${content.scenario.eligibleForBonus ? 'Yes' : 'No'}`,
    `- Can clear required spend: ${content.scenario.canMeetSpend ? 'Yes' : 'No'}`,
    `- Welcome bonus counted in year 1: ${bonusCounted}`,
    '',
    'Value summary:',
    `- Points value (year 1): ${formatCurrency(content.calculation.pointsValueYear1)}`,
    `- Points value (year 2): ${formatCurrency(content.calculation.pointsValueYear2)}`,
    `- Included credit values: ${formatCurrency(content.calculation.recurringCreditsValue)}`,
    `- Included perk values: ${formatCurrency(content.calculation.benefitsValue)}`,
    ...(content.calculation.firstYearExtraValue > 0
      ? [`- Year 1-only extras: ${formatCurrency(content.calculation.firstYearExtraValue)}`]
      : []),
    ...(content.calculation.renewalOnlyValue > 0
      ? [`- Renewal-only extras: ${formatCurrency(content.calculation.renewalOnlyValue)}`]
      : []),
    '',
    'Spend assumptions:',
    ...(content.spendRows.length > 0
      ? content.spendRows.map(
          (row) =>
            `- ${row.label}: ${formatCurrency(row.spend)} -> ${formatPoints(row.pointsEarned)} pts`
        )
      : ['- No spend inputs entered yet.']),
    '',
    'Included credit values:',
    ...renderValueLines(content.creditRows, '- No credit value entered yet.'),
    '',
    'Included perk values:',
    ...renderValueLines(content.benefitRows, '- No soft-perk value entered yet.'),
    '',
    `Open the calculator: ${TOOL_URL}`
  ].join('\n');
}

export function buildPremiumCardCalculatorEmailHtml(
  content: PremiumCardEmailContent
) {
  const bonusCounted =
    content.scenario.eligibleForBonus && content.scenario.canMeetSpend ? 'Yes' : 'No';
  const reportSummaryRows = [
    ['Modeled card', content.profile.name],
    ['Year 1 expected value', formatCurrency(content.calculation.expectedValueYear1)],
    ['Year 2 expected value', formatCurrency(content.calculation.expectedValueYear2)],
    ['Annual fee modeled', formatCurrency(content.scenario.annualFee)],
    [
      'Redemption assumption',
      `${content.selectedRedemptionLabel} (${formatCpp(content.scenario.centsPerPoint)})`
    ],
    ['Welcome-offer eligible', content.scenario.eligibleForBonus ? 'Yes' : 'No'],
    ['Can clear required spend', content.scenario.canMeetSpend ? 'Yes' : 'No'],
    ['Welcome bonus counted in year 1', bonusCounted]
  ];
  const valueSummaryRows = [
    ['Points value (year 1)', formatCurrency(content.calculation.pointsValueYear1)],
    ['Points value (year 2)', formatCurrency(content.calculation.pointsValueYear2)],
    ['Included credit values', formatCurrency(content.calculation.recurringCreditsValue)],
    ['Included perk values', formatCurrency(content.calculation.benefitsValue)],
    ...(content.calculation.firstYearExtraValue > 0
      ? [['Year 1-only extras', formatCurrency(content.calculation.firstYearExtraValue)]]
      : []),
    ...(content.calculation.renewalOnlyValue > 0
      ? [['Renewal-only extras', formatCurrency(content.calculation.renewalOnlyValue)]]
      : [])
  ];
  const spendRows = content.spendRows.map((row) => [
    row.label,
    formatCurrency(row.spend),
    `${formatPoints(row.pointsEarned)} pts`
  ]);
  const creditRows = content.creditRows.map((row) => [row.label, formatCurrency(row.value)]);
  const benefitRows = content.benefitRows.map((row) => [row.label, formatCurrency(row.value)]);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(buildPremiumCardCalculatorEmailSubject(content))}</title>
      </head>
      <body style="margin:0;background:#f1f5f9;padding:24px 12px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;border-collapse:separate;background:#ffffff;border:1px solid #dbe3ea;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #dbe3ea;background:#f8fbff;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#475569;">The Stack</div>
              <h1 style="margin:12px 0 0 0;font-size:30px;line-height:1.15;font-weight:700;color:#0f172a;">Premium card calculator report</h1>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(
                content.profile.shortName
              )} modeled results, including the value assumptions driving the current outcome.</p>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#64748b;">${escapeHtml(
                content.profile.headline
              )}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px 28px;">
              ${renderDataTable({
                title: 'Report summary',
                rows: reportSummaryRows,
                rightAlignColumns: [1]
              })}
              <div style="margin-top:16px;">
                ${renderDataTable({
                  title: 'Value summary',
                  rows: valueSummaryRows,
                  rightAlignColumns: [1]
                })}
              </div>
              <div style="margin-top:16px;">
                ${renderDataTable({
                  title: 'Spend assumptions',
                  headers: ['Category', 'Spend', 'Points earned'],
                  rows: spendRows,
                  emptyMessage: 'No spend inputs entered yet.',
                  rightAlignColumns: [1, 2]
                })}
              </div>
              <div style="margin-top:16px;">
                ${renderDataTable({
                  title: 'Included credit values',
                  headers: ['Item', 'Value'],
                  rows: creditRows,
                  emptyMessage: 'No credit value entered yet.',
                  rightAlignColumns: [1]
                })}
              </div>
              <div style="margin-top:16px;">
                ${renderDataTable({
                  title: 'Included perk values',
                  headers: ['Item', 'Value'],
                  rows: benefitRows,
                  emptyMessage: 'No soft-perk value entered yet.',
                  rightAlignColumns: [1]
                })}
              </div>
              <div style="margin-top:18px;font-size:13px;line-height:1.6;color:#475569;">
                Re-run or adjust inputs here:
                <a href="${escapeHtml(
                  TOOL_URL
                )}" style="color:#0f4c81;font-weight:700;text-decoration:underline;">Open the calculator</a>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
