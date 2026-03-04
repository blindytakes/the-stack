import { z } from 'zod';
import { quizRequestSchema, type QuizRequest } from '@/lib/quiz-engine';
import type {
  PlannerExcludedOffer,
  PlannerExclusionReason,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

const PLAN_RESULTS_VERSION = 1 as const;
const SESSION_KEY = 'thestack.plan.results.v1';
const LOCAL_KEY = 'thestack.plan.results.backup.v1';
const PLAN_RESULTS_MAX_AGE_MS = 1000 * 60 * 60 * 24;

const plannerRecommendationSchema = z.object({
  id: z.string().min(1),
  lane: z.enum(['cards', 'banking']),
  kind: z.enum(['card_bonus', 'bank_bonus']),
  title: z.string().min(1),
  provider: z.string().min(1),
  estimatedNetValue: z.number().finite(),
  priorityScore: z.number().finite().default(0),
  effort: z.enum(['low', 'medium', 'high']),
  detailPath: z.string().min(1),
  timelineDays: z.number().int().positive().optional(),
  keyRequirements: z.array(z.string()).min(1)
});

const plannerExclusionReasonSchema: z.ZodType<PlannerExclusionReason> = z.enum([
  'no_signup_bonus',
  'fee_preference',
  'credit_tier',
  'direct_deposit_required',
  'state_restricted',
  'opening_deposit_too_high'
]);

const plannerExcludedOfferSchema: z.ZodType<PlannerExcludedOffer> = z.object({
  id: z.string().min(1),
  lane: z.enum(['cards', 'banking']),
  title: z.string().min(1),
  provider: z.string().min(1),
  reasons: z.array(plannerExclusionReasonSchema).min(1)
});

const planResultsStorageSchema = z.object({
  version: z.literal(PLAN_RESULTS_VERSION),
  savedAt: z.number().int().positive(),
  answers: quizRequestSchema,
  recommendations: z.array(plannerRecommendationSchema),
  exclusions: z.array(plannerExcludedOfferSchema).default([])
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
}): PlanResultsStoragePayload {
  return {
    version: PLAN_RESULTS_VERSION,
    savedAt: Date.now(),
    answers: input.answers,
    recommendations: input.recommendations,
    exclusions: input.exclusions
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
