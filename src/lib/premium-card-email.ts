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

function renderValueCards(
  rows: PremiumCardEmailValueRow[],
  emptyMessage: string
) {
  if (rows.length === 0) {
    return `<div style="font-size:14px;line-height:1.6;color:#94a3b8;">${escapeHtml(
      emptyMessage
    )}</div>`;
  }

  return rows
    .map(
      (row) => `
        <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid rgba(148,163,184,0.14);">
          <span style="font-size:14px;line-height:1.5;color:#e2e8f0;">${escapeHtml(row.label)}</span>
          <span style="font-size:14px;font-weight:700;color:#f8fafc;white-space:nowrap;">${escapeHtml(
            formatCurrency(row.value)
          )}</span>
        </div>
      `
    )
    .join('');
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
    `Here is my The Stack premium card calculator snapshot for ${content.profile.shortName}.`,
    '',
    `Modeled card: ${content.profile.name}`,
    `Year 1 expected value: ${formatCurrency(content.calculation.expectedValueYear1)}`,
    `Year 2 expected value: ${formatCurrency(content.calculation.expectedValueYear2)}`,
    `Annual fee modeled: ${formatCurrency(content.scenario.annualFee)}`,
    `Redemption assumption: ${content.selectedRedemptionLabel} (${formatCpp(
      content.scenario.centsPerPoint
    )})`,
    `Welcome-offer eligible: ${content.scenario.eligibleForBonus ? 'Yes' : 'No'}`,
    `Can clear required spend: ${content.scenario.canMeetSpend ? 'Yes' : 'No'}`,
    `Welcome bonus counted in year 1: ${bonusCounted}`,
    '',
    'Value summary:',
    `- Points value (year 1): ${formatCurrency(content.calculation.pointsValueYear1)}`,
    `- Points value (year 2): ${formatCurrency(content.calculation.pointsValueYear2)}`,
    `- Usable credits kept: ${formatCurrency(content.calculation.recurringCreditsValue)}`,
    `- Soft perks kept: ${formatCurrency(content.calculation.benefitsValue)}`,
    ...(content.calculation.firstYearExtraValue > 0
      ? [`- Year 1-only extras: ${formatCurrency(content.calculation.firstYearExtraValue)}`]
      : []),
    ...(content.calculation.renewalOnlyValue > 0
      ? [`- Renewal-only extras: ${formatCurrency(content.calculation.renewalOnlyValue)}`]
      : []),
    '',
    'Spend inputs:',
    ...(content.spendRows.length > 0
      ? content.spendRows.map(
          (row) =>
            `- ${row.label}: ${formatCurrency(row.spend)} -> ${formatPoints(row.pointsEarned)} pts`
        )
      : ['- No spend inputs entered yet.']),
    '',
    'Hard-value credits kept:',
    ...renderValueLines(content.creditRows, '- No credit value entered yet.'),
    '',
    'Soft-value perks kept:',
    ...renderValueLines(content.benefitRows, '- No soft-perk value entered yet.'),
    '',
    `Re-run the calculator: ${TOOL_URL}`
  ].join('\n');
}

export function buildPremiumCardCalculatorEmailHtml(
  content: PremiumCardEmailContent
) {
  const bonusCounted =
    content.scenario.eligibleForBonus && content.scenario.canMeetSpend ? 'Yes' : 'No';
  const spendRows =
    content.spendRows.length > 0
      ? content.spendRows
          .map(
            (row) => `
              <div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid rgba(148,163,184,0.14);">
                <div style="min-width:0;">
                  <div style="font-size:14px;line-height:1.5;color:#f8fafc;">${escapeHtml(
                    row.label
                  )}</div>
                  <div style="font-size:13px;line-height:1.5;color:#94a3b8;">${escapeHtml(
                    formatCurrency(row.spend)
                  )} spend</div>
                </div>
                <div style="font-size:14px;font-weight:700;color:#d5f5dc;white-space:nowrap;">${escapeHtml(
                  `${formatPoints(row.pointsEarned)} pts`
                )}</div>
              </div>
            `
          )
          .join('')
      : '<div style="font-size:14px;line-height:1.6;color:#94a3b8;">No spend inputs entered yet.</div>';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(buildPremiumCardCalculatorEmailSubject(content))}</title>
      </head>
      <body style="margin:0;background:#050816;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f8fafc;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;border-collapse:separate;background:linear-gradient(180deg,#0b1220,#101827);border:1px solid rgba(148,163,184,0.16);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 22px 28px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#94a3b8;">The Stack Lab</div>
              <h1 style="margin:14px 0 0 0;font-size:34px;line-height:1.05;font-weight:700;color:#f8fafc;">${escapeHtml(
                content.profile.shortName
              )} calculator snapshot</h1>
              <p style="margin:14px 0 0 0;font-size:15px;line-height:1.7;color:#cbd5e1;">Your current calculator run, with the exact value assumptions carrying the card.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:linear-gradient(180deg,rgba(213,245,220,0.14),rgba(12,18,32,0.94));border:1px solid rgba(205,241,213,0.34);border-radius:20px;">
                <tr>
                  <td style="padding:22px 22px 18px 22px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#cbd5e1;">Modeled card</div>
                    <div style="margin-top:8px;font-size:24px;font-weight:700;color:#f8fafc;">${escapeHtml(
                      content.profile.name
                    )}</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#cbd5e1;">${escapeHtml(
                      content.profile.headline
                    )}</div>
                    <div style="margin-top:18px;display:flex;flex-wrap:wrap;gap:10px;">
                      <span style="display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid rgba(205,241,213,0.4);background:rgba(205,241,213,0.12);font-size:12px;font-weight:700;color:#d5f5dc;">Year 1 ${escapeHtml(
                        formatCurrency(content.calculation.expectedValueYear1)
                      )}</span>
                      <span style="display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid rgba(205,241,213,0.28);background:rgba(205,241,213,0.08);font-size:12px;font-weight:700;color:#d5f5dc;">Year 2 ${escapeHtml(
                        formatCurrency(content.calculation.expectedValueYear2)
                      )}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate;background:#101827;border:1px solid rgba(148,163,184,0.16);border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Snapshot</div>
                    <div style="margin-top:12px;display:grid;gap:10px;">
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Annual fee modeled</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        formatCurrency(content.scenario.annualFee)
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Redemption assumption</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        `${content.selectedRedemptionLabel} (${formatCpp(content.scenario.centsPerPoint)})`
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Welcome-offer eligible</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        content.scenario.eligibleForBonus ? 'Yes' : 'No'
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Can clear required spend</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        content.scenario.canMeetSpend ? 'Yes' : 'No'
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Welcome bonus counted</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        bonusCounted
                      )}</span></div>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate;background:#101827;border:1px solid rgba(148,163,184,0.16);border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Value summary</div>
                    <div style="margin-top:12px;display:grid;gap:10px;">
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Points value, year 1</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        formatCurrency(content.calculation.pointsValueYear1)
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Points value, year 2</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        formatCurrency(content.calculation.pointsValueYear2)
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Usable credits kept</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        formatCurrency(content.calculation.recurringCreditsValue)
                      )}</span></div>
                      <div style="display:flex;justify-content:space-between;gap:16px;"><span style="font-size:14px;color:#cbd5e1;">Soft perks kept</span><span style="font-size:14px;font-weight:700;color:#f8fafc;">${escapeHtml(
                        formatCurrency(content.calculation.benefitsValue)
                      )}</span></div>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate;background:#101827;border:1px solid rgba(148,163,184,0.16);border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Spend inputs</div>
                    <div style="margin-top:12px;">${spendRows}</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate;background:#101827;border:1px solid rgba(148,163,184,0.16);border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Hard-value credits kept</div>
                    <div style="margin-top:12px;">${renderValueCards(
                      content.creditRows,
                      'No credit value entered yet.'
                    )}</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate;background:#101827;border:1px solid rgba(148,163,184,0.16);border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Soft-value perks kept</div>
                    <div style="margin-top:12px;">${renderValueCards(
                      content.benefitRows,
                      'No soft-perk value entered yet.'
                    )}</div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:20px;text-align:center;">
                <a href="${escapeHtml(
                  TOOL_URL
                )}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#d5f5dc;color:#08111f;font-size:14px;font-weight:700;text-decoration:none;">Open the calculator</a>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
