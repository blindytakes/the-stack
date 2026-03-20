import { describe, expect, it } from 'vitest';
import {
  buildPlanEmailBody,
  buildPlanEmailHtml,
  buildSavedPlanUrl,
  type PlanEmailContent,
  planSnapshotDataSchema
} from '@/lib/plan-email';

function makeContent(): PlanEmailContent {
  return {
    totalValue: 2745,
    cardsOnlyMode: false,
    referenceDate: new Date('2026-03-19T12:00:00Z'),
    recommendations: [
      {
        lane: 'cards',
        provider: 'Chase',
        title: 'Sapphire Preferred',
        estimatedNetValue: 845,
        effort: 'medium',
        detailPath: '/cards/chase-sapphire-preferred',
        keyRequirements: ['Spend $4,000 within 3 months'],
        valueBreakdown: { annualFee: 95 },
        scheduleConstraints: {}
      },
      {
        lane: 'banking',
        provider: 'Wells Fargo',
        title: 'Everyday Checking',
        estimatedNetValue: 325,
        effort: 'low',
        detailPath: '/banking/wells-fargo-everyday-checking',
        keyRequirements: ['Set up a qualifying direct deposit'],
        scheduleConstraints: {
          requiresDirectDeposit: true
        }
      }
    ],
    milestones: [
      {
        label: 'Apply/open by',
        title: 'Chase Sapphire Preferred',
        date: new Date('2026-03-24T12:00:00Z')
      },
      {
        label: 'Bonus expected',
        title: 'Wells Fargo Everyday Checking',
        date: new Date('2026-04-11T12:00:00Z')
      }
    ]
  };
}

describe('plan email renderers', () => {
  it('builds the text summary body', () => {
    const body = buildPlanEmailBody(makeContent());

    expect(body).toContain('6-month estimate: $2,745');
    expect(body).toContain('- Mar 24: Apply/open by - Chase Sapphire Preferred');
    expect(body).toContain('1. Chase - Sapphire Preferred ($845 est; Annual fee)');
  });

  it('builds a branded html email with absolute links', () => {
    const savedPlanUrl = buildSavedPlanUrl('plan_123');
    const html = buildPlanEmailHtml(makeContent(), { savedPlanUrl });

    expect(html).toContain('https://thestackhq.com/icon.png');
    expect(html).toContain('https://thestackhq.com/opengraph-image.png');
    expect(html).toContain('https://thestackhq.com/cards/chase-sapphire-preferred');
    expect(html).toContain(savedPlanUrl);
    expect(html).toContain('Open full plan');
    expect(html).toContain('Spend $4,000 within 3 months');
    expect(html).toContain('Top moves');
    expect(html).toContain('Next actions');
  });

  it('adds the saved plan link to the text fallback when available', () => {
    const savedPlanUrl = buildSavedPlanUrl('plan_123');
    const body = buildPlanEmailBody(makeContent(), { savedPlanUrl });

    expect(body).toContain(`View full plan: ${savedPlanUrl}`);
  });

  it('keeps new snapshot fields optional for older stored plans', () => {
    const parsed = planSnapshotDataSchema.safeParse({
      totalValue: 400,
      cardsOnlyMode: true,
      recommendations: [
        {
          provider: 'Chase',
          title: 'Freedom Unlimited',
          estimatedNetValue: 400,
          effort: 'low',
          scheduleConstraints: {}
        }
      ],
      milestones: []
    });

    expect(parsed.success).toBe(true);
  });
});
