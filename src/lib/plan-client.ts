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

async function getPlanRequestErrorMessage(res: Response): Promise<string | null> {
  const contentType = res.headers?.get?.('content-type') ?? '';

  if (contentType.includes('application/json') && typeof res.json === 'function') {
    const body = await res.json().catch(() => null);
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error.trim().length > 0
    ) {
      return body.error.trim();
    }
    return null;
  }

  if (typeof res.text === 'function') {
    const text = await res.text().catch(() => '');
    return text.trim().length > 0 ? text.trim() : null;
  }

  return null;
}

export async function submitPlanQuiz(input: PlanBuildRequest): Promise<PlanResultsStoragePayload> {
  const request = planRequestSchema.parse(input);
  let res: Response;

  try {
    res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  } catch {
    throw new Error('Could not reach the plan service. Please try again.');
  }

  if (!res.ok) {
    throw new Error(
      (await getPlanRequestErrorMessage(res)) ?? 'Could not build your plan right now. Please try again.'
    );
  }

  const responseBody = await res.json().catch(() => null);
  const parsedResponse = planResponseSchema.safeParse(responseBody);
  if (!parsedResponse.success) {
    throw new Error('Plan generation returned an unexpected response.');
  }

  const data = parsedResponse.data;
  const payload = buildPlanResultsPayload({
    savedAt: data.generatedAt,
    answers: request.answers,
    selectedOfferIntent: request.selectedOfferIntent,
    recommendations: data.recommendations,
    consideredRecommendations: data.consideredRecommendations,
    exclusions: data.exclusions,
    schedule: data.schedule,
    scheduleIssues: data.scheduleIssues
  });

  savePlanResults(payload);
  return payload;
}
