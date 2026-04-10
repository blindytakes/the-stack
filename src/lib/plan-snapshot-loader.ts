import { db } from '@/lib/db';
import { planSnapshotDataSchema, type PlanSnapshotData } from '@/lib/plan-email';

const planSnapshotSelect = {
  id: true,
  createdAt: true,
  totalValue: true,
  cardsOnlyMode: true,
  recommendations: true,
  milestones: true
} as const;

export type LoadedPlanSnapshot = {
  planId: string;
  createdAt: Date;
  snapshot: PlanSnapshotData;
};

export type LoadStoredPlanSnapshotResult =
  | { ok: true; body: LoadedPlanSnapshot }
  | { ok: false; status: 404 | 503; reason: 'not_found' | 'unavailable' };

export async function loadStoredPlanSnapshot(
  planId: string
): Promise<LoadStoredPlanSnapshotResult> {
  try {
    const snapshot = await db.planSnapshot.findUnique({
      where: { id: planId },
      select: planSnapshotSelect
    });

    if (!snapshot) {
      return {
        ok: false,
        status: 404,
        reason: 'not_found'
      };
    }

    const parsed = planSnapshotDataSchema.safeParse({
      totalValue: snapshot.totalValue,
      cardsOnlyMode: snapshot.cardsOnlyMode,
      recommendations: snapshot.recommendations,
      milestones: snapshot.milestones
    });

    if (!parsed.success) {
      console.error('[plan-snapshot-loader] stored snapshot payload invalid', {
        planId,
        issues: parsed.error.issues
      });
      return {
        ok: false,
        status: 503,
        reason: 'unavailable'
      };
    }

    return {
      ok: true,
      body: {
        planId: snapshot.id,
        createdAt: snapshot.createdAt,
        snapshot: parsed.data
      }
    };
  } catch (error) {
    console.error('[plan-snapshot-loader] failed to load stored plan snapshot', {
      planId,
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 503,
      reason: 'unavailable'
    };
  }
}
