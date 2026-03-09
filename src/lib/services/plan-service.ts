import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import {
  planRequestSchema,
  planResponseSchema,
  type PlanApiResponse
} from '@/lib/plan-contract';
import { rankQuizResults } from '@/lib/quiz-engine';
import { getPlanPaceConfig } from '@/lib/plan-engine';
import { buildPlanRecommendationsFromQuiz } from '@/lib/planner-recommendations';

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
    const paceConfig = getPlanPaceConfig(parsed.data.answers.pace);
    const maxCards = parsed.data.options?.maxCards ?? paceConfig.maxCards;
    const maxBanking = parsed.data.options?.maxBanking ?? paceConfig.maxBanking;
    const [{ cards }, { bonuses }] = await Promise.all([
      getCardsData(),
      getBankingBonusesData()
    ]);
    const rankedCards = rankQuizResults(cards, parsed.data.answers);
    const planBundle = buildPlanRecommendationsFromQuiz(
      rankedCards,
      bonuses,
      parsed.data.answers,
      {
        startAt: generatedAt,
        maxCards,
        maxBanking
      }
    );
    const responsePayload = planResponseSchema.safeParse({
      generatedAt,
      recommendations: planBundle.recommendations,
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
