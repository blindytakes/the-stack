import {
  buildPlanResultsPayload,
  savePlanResults,
  type PlanResultsStoragePayload
} from '@/lib/plan-results-storage';
import {
  planRequestSchema,
  planResponseSchema,
  type PlanBuildRequest
} from '@/lib/plan-contract';

export async function submitPlanQuiz(input: PlanBuildRequest): Promise<PlanResultsStoragePayload> {
  const request = planRequestSchema.parse(input);
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    throw new Error('Failed to build plan');
  }

  const parsedResponse = planResponseSchema.safeParse(await res.json());
  if (!parsedResponse.success) {
    throw new Error('Invalid plan response');
  }

  const data = parsedResponse.data;
  const payload = buildPlanResultsPayload({
    savedAt: data.generatedAt,
    answers: request.answers,
    selectedOfferIntent: request.selectedOfferIntent,
    recommendations: data.recommendations,
    exclusions: data.exclusions,
    schedule: data.schedule,
    scheduleIssues: data.scheduleIssues
  });

  savePlanResults(payload);
  return payload;
}
