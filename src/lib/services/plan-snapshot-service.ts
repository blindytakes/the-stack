import { Prisma } from '@prisma/client';
import { db, isDatabaseConfigured } from '@/lib/db';
import { planSnapshotDataSchema } from '@/lib/plan-email';

export type SavePlanSnapshotResult =
  | { ok: true; status: 201; body: { planId: string } }
  | { ok: false; status: 400 | 503; error: string };

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
