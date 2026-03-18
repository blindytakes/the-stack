import type { PlanResultsStoragePayload } from '@/lib/plan-results-storage';
import type { SelectedOfferIntent } from '@/lib/plan-contract';

export type SelectedOfferIntentStatus =
  | {
      status: 'included';
      intent: SelectedOfferIntent;
      recommendationId: string;
    }
  | {
      status: 'excluded';
      intent: SelectedOfferIntent;
      recommendationId: string;
      reasons: PlanResultsStoragePayload['exclusions'][number]['reasons'];
    }
  | {
      status: 'deferred';
      intent: SelectedOfferIntent;
      recommendationId: string;
      reason: PlanResultsStoragePayload['scheduleIssues'][number]['reason'];
    }
  | {
      status: 'missing';
      intent: SelectedOfferIntent;
      recommendationId: string;
    };

export function buildSelectedOfferIntentHref(input: Pick<SelectedOfferIntent, 'lane' | 'slug'>) {
  const params = new URLSearchParams({
    mode: 'full',
    selectedLane: input.lane,
    selectedSlug: input.slug
  });

  return `/tools/card-finder?${params.toString()}`;
}

export function getSelectedOfferIntentRecommendationId(intent: Pick<SelectedOfferIntent, 'lane' | 'slug'>) {
  return `${intent.lane === 'cards' ? 'card' : 'bank'}:${intent.slug}`;
}

export function getSelectedOfferIntentStatus(
  payload: Pick<
    PlanResultsStoragePayload,
    'selectedOfferIntent' | 'recommendations' | 'exclusions' | 'scheduleIssues'
  >
): SelectedOfferIntentStatus | null {
  if (!payload.selectedOfferIntent) return null;

  const recommendationId = getSelectedOfferIntentRecommendationId(payload.selectedOfferIntent);

  if (payload.recommendations.some((item) => item.id === recommendationId)) {
    return {
      status: 'included',
      intent: payload.selectedOfferIntent,
      recommendationId
    };
  }

  const exclusion = payload.exclusions.find((item) => item.id === recommendationId);
  if (exclusion) {
    return {
      status: 'excluded',
      intent: payload.selectedOfferIntent,
      recommendationId,
      reasons: exclusion.reasons
    };
  }

  const scheduleIssue = payload.scheduleIssues.find((item) => item.recommendationId === recommendationId);
  if (scheduleIssue) {
    return {
      status: 'deferred',
      intent: payload.selectedOfferIntent,
      recommendationId,
      reason: scheduleIssue.reason
    };
  }

  return {
    status: 'missing',
    intent: payload.selectedOfferIntent,
    recommendationId
  };
}
