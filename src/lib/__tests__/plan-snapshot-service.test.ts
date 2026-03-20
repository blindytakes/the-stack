import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUniqueMock = vi.fn();
const isDatabaseConfiguredMock = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    planSnapshot: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args)
    }
  },
  isDatabaseConfigured: () => isDatabaseConfiguredMock()
}));

import { getSavedPlanSnapshot } from '@/lib/services/plan-snapshot-service';

describe('getSavedPlanSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
  });

  it('returns 503 when plan storage is not configured', async () => {
    isDatabaseConfiguredMock.mockReturnValue(false);

    const result = await getSavedPlanSnapshot('plan_123');

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Plan storage is not configured yet.'
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the snapshot is missing', async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getSavedPlanSnapshot('plan_123');

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: 'Plan not found'
    });
  });

  it('returns a parsed saved snapshot when found', async () => {
    const createdAt = new Date('2026-03-19T12:00:00Z');
    findUniqueMock.mockResolvedValue({
      id: 'plan_123',
      createdAt,
      totalValue: 2400,
      cardsOnlyMode: false,
      recommendations: [
        {
          lane: 'cards',
          provider: 'Chase',
          title: 'Sapphire Preferred',
          estimatedNetValue: 845,
          effort: 'medium',
          detailPath: '/cards/chase-sapphire-preferred',
          keyRequirements: ['Spend $4,000 within 3 months'],
          scheduleConstraints: {}
        }
      ],
      milestones: [
        {
          label: 'Apply/open by',
          title: 'Chase Sapphire Preferred',
          date: '2026-03-24T12:00:00.000Z'
        }
      ]
    });

    const result = await getSavedPlanSnapshot('plan_123');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.body.planId).toBe('plan_123');
    expect(result.body.createdAt).toEqual(createdAt);
    expect(result.body.snapshot.recommendations[0]?.detailPath).toBe(
      '/cards/chase-sapphire-preferred'
    );
    expect(result.body.snapshot.milestones[0]?.date).toBeInstanceOf(Date);
  });
});
