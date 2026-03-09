import { z } from 'zod';
import {
  plannerExcludedOfferSchema,
  plannerRecommendationSchema,
  planScheduleItemSchema
} from '@/lib/plan-contract';
import { quizRequestSchema, type QuizRequest } from '@/lib/quiz-engine';
import type { PlanScheduleItem } from '@/lib/plan-engine';
import type {
  PlannerExcludedOffer,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

const PLAN_RESULTS_VERSION = 1 as const;
const SESSION_KEY = 'thestack.plan.results.v1';
const LOCAL_KEY = 'thestack.plan.results.backup.v1';
const PLAN_RESULTS_MAX_AGE_MS = 1000 * 60 * 60 * 24;

const planResultsStorageSchema = z.object({
  version: z.literal(PLAN_RESULTS_VERSION),
  savedAt: z.number().int().positive(),
  answers: quizRequestSchema,
  recommendations: z.array(plannerRecommendationSchema),
  exclusions: z.array(plannerExcludedOfferSchema).default([]),
  schedule: z.array(planScheduleItemSchema).default([])
});

export type PlanResultsStoragePayload = z.infer<typeof planResultsStorageSchema>;

export type PlanResultsLoadResult =
  | { status: 'fresh'; payload: PlanResultsStoragePayload; source: 'session' | 'local' }
  | { status: 'recovered'; payload: PlanResultsStoragePayload }
  | { status: 'stale' }
  | { status: 'missing' };

export function buildPlanResultsPayload(input: {
  answers: QuizRequest;
  recommendations: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule?: PlanScheduleItem[];
  savedAt?: number;
}): PlanResultsStoragePayload {
  return {
    version: PLAN_RESULTS_VERSION,
    savedAt: input.savedAt ?? Date.now(),
    answers: input.answers,
    recommendations: input.recommendations,
    exclusions: input.exclusions,
    schedule: input.schedule ?? []
  };
}

function parseStoredPayload(raw: string | null): PlanResultsStoragePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = planResultsStorageSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function isFresh(payload: PlanResultsStoragePayload): boolean {
  return Date.now() - payload.savedAt <= PLAN_RESULTS_MAX_AGE_MS;
}

export function savePlanResults(payload: PlanResultsStoragePayload) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(payload);
  window.sessionStorage.setItem(SESSION_KEY, serialized);
  window.localStorage.setItem(LOCAL_KEY, serialized);
}

export function clearPlanResults() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LOCAL_KEY);
}

export function loadPlanResults(): PlanResultsLoadResult {
  if (typeof window === 'undefined') {
    return { status: 'missing' };
  }

  const sessionPayload = parseStoredPayload(window.sessionStorage.getItem(SESSION_KEY));
  if (sessionPayload && isFresh(sessionPayload)) {
    return { status: 'fresh', payload: sessionPayload, source: 'session' };
  }

  const localPayload = parseStoredPayload(window.localStorage.getItem(LOCAL_KEY));
  if (localPayload && isFresh(localPayload)) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(localPayload));
    if (sessionPayload) {
      return { status: 'fresh', payload: localPayload, source: 'local' };
    }
    return { status: 'recovered', payload: localPayload };
  }

  if (sessionPayload || localPayload) {
    return { status: 'stale' };
  }

  return { status: 'missing' };
}
