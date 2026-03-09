import {
  buildPlanResultsPayload,
  savePlanResults,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import type { QuizRequest } from '@/lib/quiz-engine';
import type { PlanScheduleItem } from '@/lib/plan-engine';
import type {
  PlannerExcludedOffer,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

export type PlanRequestOptions = {
  maxCards?: number;
  maxBanking?: number;
};

export type PlanApiResponse = {
  generatedAt: number;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule: PlanScheduleItem[];
};

export async function submitPlanQuiz(input: {
  answers: QuizRequest;
  options?: PlanRequestOptions;
}): Promise<PlanResultsStoragePayload> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: input.answers,
      options: input.options
    })
  });
  if (!res.ok) {
    throw new Error('Failed to build plan');
  }

  const data = (await res.json()) as PlanApiResponse;
  const payload = buildPlanResultsPayload({
    savedAt: data.generatedAt,
    answers: input.answers,
    recommendations: data.recommendations,
    exclusions: data.exclusions,
    schedule: data.schedule
  });

  savePlanResults(payload);
  return payload;
}
