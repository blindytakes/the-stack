import { z } from 'zod';
import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import { quizRequestSchema, rankQuizResults } from '@/lib/quiz-engine';
import { getPlanPaceConfig } from '@/lib/plan-engine';
import { buildPlanRecommendationsFromQuiz } from '@/lib/planner-recommendations';

const planRequestOptionsSchema = z
  .object({
    maxCards: z.number().int().min(0).max(6).optional(),
    maxBanking: z.number().int().min(0).max(6).optional()
  })
  .optional();

export const planRequestSchema = z.object({
  answers: quizRequestSchema,
  options: planRequestOptionsSchema
});

export type PlanBuildRequest = z.infer<typeof planRequestSchema>;

export type BuildPlanResult =
  | {
      ok: true;
      data: {
        generatedAt: number;
        recommendations: ReturnType<typeof buildPlanRecommendationsFromQuiz>['recommendations'];
        exclusions: ReturnType<typeof buildPlanRecommendationsFromQuiz>['exclusions'];
        schedule: ReturnType<typeof buildPlanRecommendationsFromQuiz>['schedule'];
        scheduleIssues: ReturnType<typeof buildPlanRecommendationsFromQuiz>['scheduleIssues'];
      };
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

    return {
      ok: true,
      data: {
        generatedAt,
        recommendations: planBundle.recommendations,
        exclusions: planBundle.exclusions,
        schedule: planBundle.schedule,
        scheduleIssues: planBundle.scheduleIssues
      }
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
