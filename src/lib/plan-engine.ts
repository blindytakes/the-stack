import type { QuizRequest } from '@/lib/quiz-engine';

export type PlanScheduleLane = 'cards' | 'banking';

export type PlannerRecommendationScheduleConstraints = {
  activeDays: number;
  payoutLagDays: number;
  requiredSpend?: number;
  requiredDeposit?: number;
  requiresDirectDeposit?: boolean;
};

export type SchedulablePlanRecommendation = {
  id: string;
  lane: PlanScheduleLane;
  priorityScore: number;
  estimatedNetValue: number;
  scheduleConstraints: PlannerRecommendationScheduleConstraints;
};

export type PlanScheduleItem = {
  recommendationId: string;
  lane: PlanScheduleLane;
  startAt: number;
  completeAt: number;
  payoutAt: number;
};

export type PlanScheduleIssueReason =
  | 'lane_limit'
  | 'spend_capacity'
  | 'cash_capacity'
  | 'direct_deposit_slot'
  | 'pace_limit'
  | 'timeline_overflow';

export type PlanScheduleIssue = {
  recommendationId: string;
  lane: PlanScheduleLane;
  reason: PlanScheduleIssueReason;
};

type PlanPaceConfig = {
  maxCards: number;
  maxBanking: number;
  maxActiveCards: number;
  maxActiveBanking: number;
  maxDirectDepositBanking: number;
};

type SearchCandidate = SchedulablePlanRecommendation & {
  contribution: number;
};

type ScheduledWindow = {
  recommendationId: string;
  lane: PlanScheduleLane;
  startDay: number;
  completeDay: number;
  payoutLagDays: number;
  contribution: number;
  estimatedNetValue: number;
  priorityScore: number;
  monthlySpendLoad: number;
  openingDeposit: number;
  requiresDirectDeposit: boolean;
};

type BuildPlanScheduleOptions = {
  startAt?: number;
  horizonDays?: number;
  maxCards?: number;
  maxBanking?: number;
};

type SearchResult =
  | {
      ok: true;
      window: ScheduledWindow;
    }
  | {
      ok: false;
      reason: PlanScheduleIssueReason;
    };

type OptimizerBestResult = {
  score: number;
  totalValue: number;
  totalPriority: number;
  scheduled: ScheduledWindow[];
};

const DEFAULT_HORIZON_DAYS = 365;
const DAYS_IN_MONTH = 30;

const paceConfig: Record<QuizRequest['pace'], PlanPaceConfig> = {
  conservative: {
    maxCards: 2,
    maxBanking: 1,
    maxActiveCards: 1,
    maxActiveBanking: 1,
    maxDirectDepositBanking: 1
  },
  balanced: {
    maxCards: 3,
    maxBanking: 2,
    maxActiveCards: 1,
    maxActiveBanking: 1,
    maxDirectDepositBanking: 1
  },
  aggressive: {
    maxCards: 4,
    maxBanking: 3,
    maxActiveCards: 2,
    maxActiveBanking: 2,
    maxDirectDepositBanking: 1
  }
};

const reasonPriority: PlanScheduleIssueReason[] = [
  'spend_capacity',
  'cash_capacity',
  'direct_deposit_slot',
  'pace_limit',
  'timeline_overflow',
  'lane_limit'
];

function addDays(startAt: number, days: number) {
  const date = new Date(startAt);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function overlaps(startDay: number, completeDay: number, otherStartDay: number, otherCompleteDay: number) {
  return startDay < otherCompleteDay && otherStartDay < completeDay;
}

function openingCashCapacity(input: QuizRequest): number {
  if (input.openingCash === 'lt_2000') return 1999;
  if (input.openingCash === 'from_2000_to_10000') return 10000;
  return Number.POSITIVE_INFINITY;
}

function monthlySpendCapacity(input: QuizRequest): number {
  if (input.monthlySpend === 'lt_1000') return 999;
  if (input.monthlySpend === 'from_1000_to_2500') return 2500;
  if (input.monthlySpend === 'from_2500_to_5000') return 5000;
  return Number.POSITIVE_INFINITY;
}

function monthlySpendLoad(recommendation: SchedulablePlanRecommendation): number {
  const requiredSpend = recommendation.scheduleConstraints.requiredSpend ?? 0;
  if (requiredSpend <= 0) return 0;
  const activeMonths = Math.max(
    1,
    Math.ceil(recommendation.scheduleConstraints.activeDays / DAYS_IN_MONTH)
  );
  return Math.ceil(requiredSpend / activeMonths);
}

function contributionScore(recommendation: SchedulablePlanRecommendation): number {
  return Math.round(recommendation.estimatedNetValue * 100) + recommendation.priorityScore;
}

export function getPlanPaceConfig(pace: QuizRequest['pace']): PlanPaceConfig {
  return paceConfig[pace];
}

function dominantReason(reasonCounts: Record<PlanScheduleIssueReason, number>): PlanScheduleIssueReason {
  return (
    reasonPriority
      .slice()
      .sort((a, b) => reasonCounts[b] - reasonCounts[a] || reasonPriority.indexOf(a) - reasonPriority.indexOf(b))
      .find((reason) => reasonCounts[reason] > 0) ?? 'timeline_overflow'
  );
}

function normalizeCandidate(recommendation: SchedulablePlanRecommendation): SearchCandidate {
  return {
    ...recommendation,
    contribution: contributionScore(recommendation)
  };
}

function isSameOrLooserDirectDeposit(
  candidate: SearchCandidate,
  other: SearchCandidate
) {
  return (
    !candidate.scheduleConstraints.requiresDirectDeposit ||
    Boolean(other.scheduleConstraints.requiresDirectDeposit)
  );
}

function dominates(candidate: SearchCandidate, other: SearchCandidate): boolean {
  if (candidate.lane !== other.lane) return false;

  const candidateSpend = candidate.scheduleConstraints.requiredSpend ?? 0;
  const otherSpend = other.scheduleConstraints.requiredSpend ?? 0;
  const candidateDeposit = candidate.scheduleConstraints.requiredDeposit ?? 0;
  const otherDeposit = other.scheduleConstraints.requiredDeposit ?? 0;

  const noWorse =
    candidate.estimatedNetValue >= other.estimatedNetValue &&
    candidate.priorityScore >= other.priorityScore &&
    candidate.scheduleConstraints.activeDays <= other.scheduleConstraints.activeDays &&
    candidateSpend <= otherSpend &&
    candidateDeposit <= otherDeposit &&
    isSameOrLooserDirectDeposit(candidate, other);

  const strictlyBetter =
    candidate.estimatedNetValue > other.estimatedNetValue ||
    candidate.priorityScore > other.priorityScore ||
    candidate.scheduleConstraints.activeDays < other.scheduleConstraints.activeDays ||
    candidateSpend < otherSpend ||
    candidateDeposit < otherDeposit ||
    (!candidate.scheduleConstraints.requiresDirectDeposit &&
      Boolean(other.scheduleConstraints.requiresDirectDeposit));

  return noWorse && strictlyBetter;
}

function pruneDominatedCandidates(candidates: SearchCandidate[]): SearchCandidate[] {
  const kept: SearchCandidate[] = [];

  for (const candidate of candidates) {
    if (kept.some((existing) => dominates(existing, candidate))) {
      continue;
    }

    const survivors = kept.filter((existing) => !dominates(candidate, existing));
    survivors.push(candidate);
    kept.length = 0;
    kept.push(...survivors);
  }

  return kept;
}

function candidatePoolLimit(maxLane: number): number {
  if (maxLane <= 0) return 0;
  return maxLane + 1;
}

function buildCandidatePool(
  recommendations: SchedulablePlanRecommendation[],
  maxCards: number,
  maxBanking: number
): { reduced: SearchCandidate[]; reducedIds: Set<string> } {
  const normalized = recommendations.map(normalizeCandidate);
  const sortByContribution = (a: SearchCandidate, b: SearchCandidate) =>
    b.contribution - a.contribution || b.priorityScore - a.priorityScore;

  const cards = pruneDominatedCandidates(
    normalized.filter((item) => item.lane === 'cards').sort(sortByContribution)
  ).slice(0, candidatePoolLimit(maxCards));

  const banking = pruneDominatedCandidates(
    normalized.filter((item) => item.lane === 'banking').sort(sortByContribution)
  ).slice(0, candidatePoolLimit(maxBanking));

  const reduced = [...cards, ...banking].sort(sortByContribution);
  return {
    reduced,
    reducedIds: new Set(reduced.map((item) => item.id))
  };
}

function getWindowReasons(
  recommendation: SearchCandidate,
  scheduled: ScheduledWindow[],
  startDay: number,
  input: QuizRequest,
  config: PlanPaceConfig,
  horizonDays: number
): PlanScheduleIssueReason[] {
  const reasons = new Set<PlanScheduleIssueReason>();
  const activeDays = recommendation.scheduleConstraints.activeDays;
  const completeDay = startDay + activeDays;
  const payoutDay = completeDay + recommendation.scheduleConstraints.payoutLagDays;

  if (payoutDay > horizonDays) {
    reasons.add('timeline_overflow');
    return [...reasons];
  }

  const overlapping = scheduled.filter((item) =>
    overlaps(startDay, completeDay, item.startDay, item.completeDay)
  );

  const laneOverlapCount = overlapping.filter((item) => item.lane === recommendation.lane).length;
  if (recommendation.lane === 'cards' && laneOverlapCount >= config.maxActiveCards) {
    reasons.add('pace_limit');
  }

  if (recommendation.lane === 'banking' && laneOverlapCount >= config.maxActiveBanking) {
    reasons.add('pace_limit');
  }

  if (recommendation.lane === 'cards') {
    const spendLoad =
      overlapping
        .filter((item) => item.lane === 'cards')
        .reduce((sum, item) => sum + item.monthlySpendLoad, 0) + monthlySpendLoad(recommendation);
    if (spendLoad > monthlySpendCapacity(input)) {
      reasons.add('spend_capacity');
    }
  }

  if (recommendation.lane === 'banking') {
    const requiredDeposit = recommendation.scheduleConstraints.requiredDeposit ?? 0;
    const usedDeposit =
      overlapping
        .filter((item) => item.lane === 'banking')
        .reduce((sum, item) => sum + item.openingDeposit, 0) + requiredDeposit;
    if (usedDeposit > openingCashCapacity(input)) {
      reasons.add('cash_capacity');
    }

    if (recommendation.scheduleConstraints.requiresDirectDeposit) {
      const directDepositCount = overlapping.filter(
        (item) => item.lane === 'banking' && item.requiresDirectDeposit
      ).length;
      if (directDepositCount >= config.maxDirectDepositBanking) {
        reasons.add('direct_deposit_slot');
      }
    }
  }

  return [...reasons];
}

function candidateStartDays(
  recommendation: SearchCandidate,
  scheduled: ScheduledWindow[],
  horizonDays: number
): number[] {
  const activeDays = recommendation.scheduleConstraints.activeDays;
  const payoutLagDays = recommendation.scheduleConstraints.payoutLagDays;
  const maxStartDay = Math.max(0, horizonDays - activeDays - payoutLagDays);
  const days = new Set<number>([0]);

  for (const item of scheduled) {
    days.add(Math.max(0, Math.min(maxStartDay, item.completeDay)));
    days.add(Math.max(0, Math.min(maxStartDay, item.startDay - activeDays)));
  }

  return [...days].sort((a, b) => a - b);
}

function searchScheduleWindow(
  recommendation: SearchCandidate,
  scheduled: ScheduledWindow[],
  input: QuizRequest,
  config: PlanPaceConfig,
  horizonDays: number
): SearchResult {
  const activeDays = recommendation.scheduleConstraints.activeDays;
  const payoutLagDays = recommendation.scheduleConstraints.payoutLagDays;

  if (activeDays + payoutLagDays > horizonDays) {
    return { ok: false, reason: 'timeline_overflow' };
  }

  const reasonCounts: Record<PlanScheduleIssueReason, number> = {
    lane_limit: 0,
    spend_capacity: 0,
    cash_capacity: 0,
    direct_deposit_slot: 0,
    pace_limit: 0,
    timeline_overflow: 0
  };

  for (const startDay of candidateStartDays(recommendation, scheduled, horizonDays)) {
    const reasons = getWindowReasons(recommendation, scheduled, startDay, input, config, horizonDays);
    if (reasons.length === 0) {
      return {
        ok: true,
        window: {
          recommendationId: recommendation.id,
          lane: recommendation.lane,
          startDay,
          completeDay: startDay + activeDays,
          payoutLagDays,
          contribution: recommendation.contribution,
          estimatedNetValue: recommendation.estimatedNetValue,
          priorityScore: recommendation.priorityScore,
          monthlySpendLoad: monthlySpendLoad(recommendation),
          openingDeposit: recommendation.scheduleConstraints.requiredDeposit ?? 0,
          requiresDirectDeposit: recommendation.scheduleConstraints.requiresDirectDeposit ?? false
        }
      };
    }

    reasons.forEach((reason) => {
      reasonCounts[reason] += 1;
    });
  }

  return { ok: false, reason: dominantReason(reasonCounts) };
}

function compareBestCandidate(
  next: OptimizerBestResult,
  current: OptimizerBestResult
): number {
  if (next.score !== current.score) return next.score - current.score;
  if (next.totalValue !== current.totalValue) return next.totalValue - current.totalValue;
  if (next.totalPriority !== current.totalPriority) {
    return next.totalPriority - current.totalPriority;
  }
  if (next.scheduled.length !== current.scheduled.length) {
    return next.scheduled.length - current.scheduled.length;
  }
  const nextPayoutSum = next.scheduled.reduce((sum, item) => sum + item.completeDay + item.payoutLagDays, 0);
  const currentPayoutSum = current.scheduled.reduce(
    (sum, item) => sum + item.completeDay + item.payoutLagDays,
    0
  );
  return currentPayoutSum - nextPayoutSum;
}

function optimisticBound(
  remaining: SearchCandidate[],
  cardsUsed: number,
  bankingUsed: number,
  maxCards: number,
  maxBanking: number
): number {
  const remainingCardSlots = Math.max(0, maxCards - cardsUsed);
  const remainingBankingSlots = Math.max(0, maxBanking - bankingUsed);

  const cardBound = remaining
    .filter((item) => item.lane === 'cards')
    .slice(0, remainingCardSlots)
    .reduce((sum, item) => sum + item.contribution, 0);

  const bankingBound = remaining
    .filter((item) => item.lane === 'banking')
    .slice(0, remainingBankingSlots)
    .reduce((sum, item) => sum + item.contribution, 0);

  return cardBound + bankingBound;
}

function optimizeSchedule(
  candidates: SearchCandidate[],
  input: QuizRequest,
  config: PlanPaceConfig,
  horizonDays: number,
  maxCards: number,
  maxBanking: number
): OptimizerBestResult {
  let best: OptimizerBestResult = {
    score: 0,
    totalValue: 0,
    totalPriority: 0,
    scheduled: []
  };

  function search(
    remaining: SearchCandidate[],
    scheduled: ScheduledWindow[],
    score: number,
    totalValue: number,
    totalPriority: number,
    cardsUsed: number,
    bankingUsed: number
  ) {
    const candidateResult: OptimizerBestResult = {
      score,
      totalValue,
      totalPriority,
      scheduled
    };
    if (compareBestCandidate(candidateResult, best) > 0) {
      best = candidateResult;
    }

    if (cardsUsed >= maxCards && bankingUsed >= maxBanking) return;
    if (remaining.length === 0) return;

    const upperBound =
      score + optimisticBound(remaining, cardsUsed, bankingUsed, maxCards, maxBanking);
    if (upperBound < best.score) {
      return;
    }

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];

      if (candidate.lane === 'cards' && cardsUsed >= maxCards) continue;
      if (candidate.lane === 'banking' && bankingUsed >= maxBanking) continue;

      const searchResult = searchScheduleWindow(candidate, scheduled, input, config, horizonDays);
      if (!searchResult.ok) continue;

      const nextRemaining = [...remaining.slice(0, index), ...remaining.slice(index + 1)];
      const nextScheduled = [...scheduled, searchResult.window];
      search(
        nextRemaining,
        nextScheduled,
        score + candidate.contribution,
        totalValue + candidate.estimatedNetValue,
        totalPriority + candidate.priorityScore,
        cardsUsed + (candidate.lane === 'cards' ? 1 : 0),
        bankingUsed + (candidate.lane === 'banking' ? 1 : 0)
      );
    }
  }

  search(candidates, [], 0, 0, 0, 0, 0);
  return best;
}

function inferIssueReason(
  recommendation: SearchCandidate,
  scheduled: ScheduledWindow[],
  input: QuizRequest,
  config: PlanPaceConfig,
  horizonDays: number,
  maxCards: number,
  maxBanking: number,
  selectedIds: Set<string>
): PlanScheduleIssueReason {
  if (selectedIds.has(recommendation.id)) {
    return 'lane_limit';
  }

  const cardsSelected = scheduled.filter((item) => item.lane === 'cards').length;
  const bankingSelected = scheduled.filter((item) => item.lane === 'banking').length;
  if (
    (recommendation.lane === 'cards' && cardsSelected >= maxCards) ||
    (recommendation.lane === 'banking' && bankingSelected >= maxBanking)
  ) {
    return 'lane_limit';
  }

  const searchResult = searchScheduleWindow(recommendation, scheduled, input, config, horizonDays);
  return searchResult.ok ? 'lane_limit' : searchResult.reason;
}

export function buildPlanSchedule(
  recommendations: SchedulablePlanRecommendation[],
  input: QuizRequest,
  options: BuildPlanScheduleOptions = {}
): { scheduled: PlanScheduleItem[]; issues: PlanScheduleIssue[] } {
  const config = getPlanPaceConfig(input.pace);
  const startAt = options.startAt ?? Date.now();
  const horizonDays = options.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const maxCards = options.maxCards ?? config.maxCards;
  const maxBanking = options.maxBanking ?? config.maxBanking;

  const { reduced, reducedIds } = buildCandidatePool(recommendations, maxCards, maxBanking);
  const best = optimizeSchedule(reduced, input, config, horizonDays, maxCards, maxBanking);

  const recommendationRank = new Map(
    recommendations.map((item, index) => [item.id, index])
  );
  const scheduled = [...best.scheduled]
    .sort(
      (a, b) =>
        a.startDay - b.startDay ||
        b.contribution - a.contribution ||
        (recommendationRank.get(a.recommendationId) ?? 0) -
          (recommendationRank.get(b.recommendationId) ?? 0)
    )
    .map((window) => ({
      recommendationId: window.recommendationId,
      lane: window.lane,
      startAt: addDays(startAt, window.startDay),
      completeAt: addDays(startAt, window.completeDay),
      payoutAt: addDays(startAt, window.completeDay + window.payoutLagDays)
    }));

  const selectedIds = new Set(best.scheduled.map((item) => item.recommendationId));
  const reducedById = new Map(reduced.map((item) => [item.id, item]));
  const issues = recommendations
    .filter((item) => !selectedIds.has(item.id))
    .map((item) => {
      const reducedCandidate = reducedById.get(item.id);
      return {
        recommendationId: item.id,
        lane: item.lane,
        reason: reducedCandidate
          ? inferIssueReason(
              reducedCandidate,
              best.scheduled,
              input,
              config,
              horizonDays,
              maxCards,
              maxBanking,
              selectedIds
            )
          : 'lane_limit'
      };
    });

  // Mark reduced-pool exclusions explicitly so callers can tell these were cut
  // during optimization setup rather than by the final schedule.
  for (const item of recommendations) {
    if (selectedIds.has(item.id) || reducedIds.has(item.id)) continue;
    const existingIssue = issues.find((issue) => issue.recommendationId === item.id);
    if (existingIssue) {
      existingIssue.reason = 'lane_limit';
    }
  }

  return { scheduled, issues };
}
