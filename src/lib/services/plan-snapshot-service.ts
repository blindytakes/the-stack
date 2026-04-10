import { Prisma } from '@prisma/client';
import { db, isDatabaseConfigured } from '@/lib/db';
import { loadStoredPlanSnapshot } from '@/lib/plan-snapshot-loader';
import { planSnapshotDataSchema, type PlanSnapshotData } from '@/lib/plan-email';

export type SavePlanSnapshotResult =
  | { ok: true; status: 201; body: { planId: string } }
  | { ok: false; status: 400 | 503; error: string };

export type GetSavedPlanSnapshotResult =
  | {
      ok: true;
      status: 200;
      body: {
        planId: string;
        createdAt: Date;
        snapshot: PlanSnapshotData;
      };
    }
  | { ok: false; status: 404 | 503; error: string };

export async function savePlanSnapshot(
  rawBody: unknown | null
): Promise<SavePlanSnapshotResult> {
  if (rawBody === null) {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }

  const parsed = planSnapshotDataSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid payload' };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Plan storage is not configured yet.'
    };
  }

  try {
    const snapshot = await db.planSnapshot.create({
      data: {
        totalValue: parsed.data.totalValue,
        cardsOnlyMode: parsed.data.cardsOnlyMode,
        recommendations: parsed.data.recommendations as Prisma.InputJsonValue,
        milestones: parsed.data.milestones.map((milestone) => ({
          ...milestone,
          date: milestone.date.toISOString()
        })) as Prisma.InputJsonValue
      },
      select: { id: true }
    });

    return {
      ok: true,
      status: 201,
      body: { planId: snapshot.id }
    };
  } catch (error) {
    console.error('[plan-snapshot] failed to save plan snapshot', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 503,
      error: 'Could not save the plan right now.'
    };
  }
}

export async function getSavedPlanSnapshot(
  planId: string
): Promise<GetSavedPlanSnapshotResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Plan storage is not configured yet.'
    };
  }

  const result = await loadStoredPlanSnapshot(planId);
  if (!result.ok) {
    if (result.reason === 'not_found') {
      return {
        ok: false,
        status: 404,
        error: 'Plan not found'
      };
    }

    return {
      ok: false,
      status: 503,
      error: 'Saved plan is temporarily unavailable.'
    };
  }

  return {
    ok: true,
    status: 200,
    body: result.body
  };
}
