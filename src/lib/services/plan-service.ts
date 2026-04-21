import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import {
  planRequestSchema,
  planResponseSchema,
  type PlanApiResponse
} from '@/lib/plan-contract';
import {
  normalizePlannerContext
} from '@/lib/planner/normalize-context';
import { rankPlannerResults } from '@/lib/planner/ranking-engine';
import { getPlanPaceConfig } from '@/lib/plan-engine';
import { buildPlanRecommendations } from '@/lib/planner-recommendations';

export type BuildPlanResult =
  | {
      ok: true;
      data: PlanApiResponse;
    }
  | { ok: false; status: 400 | 500; error: string };

export async function buildPlan(rawBody: unknown | null): Promise<BuildPlanResult> {
  if (rawBody === null) {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }

  const parsed = planRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid payload' };
  }

  try {
    const generatedAt = Date.now();
    const paceConfig = getPlanPaceConfig();
    const mode = parsed.data.mode;
    const maxCards = parsed.data.options?.maxCards ?? paceConfig.maxCards;
    const maxBanking = parsed.data.options?.maxBanking ?? (mode === 'cards_only' ? 0 : paceConfig.maxBanking);
    const plannerContext = normalizePlannerContext({
      mode,
      answers: parsed.data.answers,
      overrides: parsed.data.overrides
    });
    const [{ cards }, { bonuses }] = await Promise.all([
      getCardsData(),
      getBankingBonusesData()
    ]);
    const rankedCards = rankPlannerResults(cards, plannerContext);
    const planBundle = buildPlanRecommendations(
      rankedCards,
      bonuses,
      plannerContext,
      {
        startAt: generatedAt,
        maxCards,
        maxBanking,
        selectedOfferIntent: parsed.data.selectedOfferIntent
      }
    );
    if (
      planBundle.diagnostics.poolExpansionRounds > 0 ||
      planBundle.diagnostics.topRejected.some(
        (item) => item.reason === 'candidate_pool_limit' || item.reason === 'dominated_offer'
      )
    ) {
      console.info('[plan-service] scheduler diagnostics', planBundle.diagnostics);
    }
    const responsePayload = planResponseSchema.safeParse({
      generatedAt,
      recommendations: planBundle.recommendations,
      consideredRecommendations: planBundle.consideredRecommendations,
      exclusions: planBundle.exclusions,
      schedule: planBundle.schedule,
      scheduleIssues: planBundle.scheduleIssues
    });
    if (!responsePayload.success) {
      console.error('[plan-service] invalid plan response payload', {
        issues: responsePayload.error.issues
      });
      return {
        ok: false,
        status: 500,
        error: 'Plan generation is temporarily unavailable'
      };
    }

    return {
      ok: true,
      data: responsePayload.data
    };
  } catch (error) {
    console.error('[plan-service] failed to build plan', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 500,
      error: 'Plan generation is temporarily unavailable'
    };
  }
}
