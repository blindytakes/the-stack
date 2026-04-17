import { z } from 'zod';
import {
  plannerExcludedOfferSchema,
  plannerRecommendationSchema,
  planScheduleIssueSchema,
  planScheduleItemSchema
} from '@/lib/plan-contract';
import {
  quizRequestSchema,
  type QuizRequest
} from '@/lib/quiz-engine';
import { type SelectedOfferIntent, selectedOfferIntentSchema } from '@/lib/plan-contract';
import type { PlanScheduleItem } from '@/lib/plan-engine';
import type {
  PlannerExcludedOffer,
  PlannerRecommendation
} from '@/lib/planner-recommendations';

const PLAN_RESULTS_VERSION = 1 as const;
const SESSION_KEY = 'thestack.plan.results.v1';
const LOCAL_KEY = 'thestack.plan.results.backup.v1';
const PLAN_RESULTS_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const STORAGE_ERROR_MESSAGE =
  'Could not save your plan in this browser. Please allow site storage and try again.';

const planResultsStorageSchema = z.object({
  version: z.literal(PLAN_RESULTS_VERSION),
  savedAt: z.number().int().positive(),
  answers: quizRequestSchema,
  selectedOfferIntent: selectedOfferIntentSchema.optional(),
  recommendations: z.array(plannerRecommendationSchema),
  consideredRecommendations: z.array(plannerRecommendationSchema).default([]),
  exclusions: z.array(plannerExcludedOfferSchema).default([]),
  schedule: z.array(planScheduleItemSchema).default([]),
  scheduleIssues: z.array(planScheduleIssueSchema).default([])
});

export type PlanResultsStoragePayload = z.infer<typeof planResultsStorageSchema>;

export type PlanResultsLoadResult =
  | { status: 'fresh'; payload: PlanResultsStoragePayload; source: 'session' | 'local' }
  | { status: 'recovered'; payload: PlanResultsStoragePayload }
  | { status: 'stale' }
  | { status: 'missing' };

export function buildPlanResultsPayload(input: {
  answers: QuizRequest;
  selectedOfferIntent?: SelectedOfferIntent;
  recommendations: PlannerRecommendation[];
  consideredRecommendations?: PlannerRecommendation[];
  exclusions: PlannerExcludedOffer[];
  schedule?: PlanScheduleItem[];
  scheduleIssues?: Array<z.infer<typeof planScheduleIssueSchema>>;
  savedAt?: number;
}): PlanResultsStoragePayload {
  return {
    version: PLAN_RESULTS_VERSION,
    savedAt: input.savedAt ?? Date.now(),
    answers: input.answers,
    selectedOfferIntent: input.selectedOfferIntent,
    recommendations: input.recommendations,
    consideredRecommendations: input.consideredRecommendations ?? [],
    exclusions: input.exclusions,
    schedule: input.schedule ?? [],
    scheduleIssues: input.scheduleIssues ?? []
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

type BrowserStorageName = 'sessionStorage' | 'localStorage';
type BrowserStorageAction = 'getItem' | 'setItem' | 'removeItem';

function logStorageFailure(
  storage: BrowserStorageName,
  action: BrowserStorageAction,
  error: unknown
) {
  console.warn('[plan-results-storage] browser storage access failed', {
    storage,
    action,
    error: error instanceof Error ? error.message : String(error)
  });
}

function getBrowserStorage(storage: BrowserStorageName) {
  return storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
}

function safeGetStoredPayload(
  storage: BrowserStorageName,
  key: string
): PlanResultsStoragePayload | null {
  try {
    return parseStoredPayload(getBrowserStorage(storage).getItem(key));
  } catch (error) {
    logStorageFailure(storage, 'getItem', error);
    return null;
  }
}

function safeSetStoredPayload(storage: BrowserStorageName, key: string, value: string): boolean {
  try {
    getBrowserStorage(storage).setItem(key, value);
    return true;
  } catch (error) {
    logStorageFailure(storage, 'setItem', error);
    return false;
  }
}

function safeRemoveStoredPayload(storage: BrowserStorageName, key: string) {
  try {
    getBrowserStorage(storage).removeItem(key);
  } catch (error) {
    logStorageFailure(storage, 'removeItem', error);
  }
}

export function savePlanResults(payload: PlanResultsStoragePayload) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(payload);
  const savedToSession = safeSetStoredPayload('sessionStorage', SESSION_KEY, serialized);
  const savedToLocal = safeSetStoredPayload('localStorage', LOCAL_KEY, serialized);

  if (!savedToSession && !savedToLocal) {
    throw new Error(STORAGE_ERROR_MESSAGE);
  }
}

export function clearPlanResults() {
  if (typeof window === 'undefined') return;
  safeRemoveStoredPayload('sessionStorage', SESSION_KEY);
  safeRemoveStoredPayload('localStorage', LOCAL_KEY);
}

export function loadPlanResults(): PlanResultsLoadResult {
  if (typeof window === 'undefined') {
    return { status: 'missing' };
  }

  const sessionPayload = safeGetStoredPayload('sessionStorage', SESSION_KEY);
  if (sessionPayload && isFresh(sessionPayload)) {
    return { status: 'fresh', payload: sessionPayload, source: 'session' };
  }

  const localPayload = safeGetStoredPayload('localStorage', LOCAL_KEY);
  if (localPayload && isFresh(localPayload)) {
    safeSetStoredPayload('sessionStorage', SESSION_KEY, JSON.stringify(localPayload));
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
