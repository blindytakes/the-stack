import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { apiRateLimits } from '@/lib/api-rate-limits';
import {
  getAiAssistantBudgetReserveCents,
  getAiAssistantMonthlyBudgetCents,
  getUpstashRedisConfig
} from '@/lib/config/server';
import { isProductionEnv } from '@/lib/config/runtime';
import { applyIdentifierRateLimit, getClientIp } from '@/lib/rate-limit';

const GLOBAL_ASSISTANT_BUDGET_KEY = 'global';
const MONTHLY_BUDGET_KEY_PREFIX = 'assistant:monthly-budget';

type BudgetPeriod = {
  key: string;
  resetAtMs: number;
  resetAtUnixSeconds: number;
};

type BudgetReservationResult = {
  allowed: boolean;
  usedCents: number;
};

type BudgetScriptResult = [number, number];

const RESERVE_MONTHLY_BUDGET_SCRIPT = `
local key = KEYS[1]
local reserve = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local reset_at = tonumber(ARGV[3])
local current = tonumber(redis.call("GET", key) or "0")

if current + reserve > limit then
  return {0, current}
end

local next_value = redis.call("INCRBY", key, reserve)
if next_value == reserve then
  redis.call("EXPIREAT", key, reset_at)
end

return {1, next_value}
`;

let _budgetRedis: Redis | null = null;
let _budgetScript: { exec(keys: string[], args: string[]): Promise<BudgetScriptResult> } | null =
  null;
let _warnedMissingMonthlyBudgetRedis = false;

type MemBudgetEntry = { usedCents: number; resetAtMs: number };
const _memBudgetStore = new Map<string, MemBudgetEntry>();

function getBudgetPeriod(now = new Date()): BudgetPeriod {
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  const month = String(monthIndex + 1).padStart(2, '0');
  const resetAtMs = Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0);

  return {
    key: `${MONTHLY_BUDGET_KEY_PREFIX}:${year}-${month}`,
    resetAtMs,
    resetAtUnixSeconds: Math.floor(resetAtMs / 1000)
  };
}

function getRetryAfterSeconds(resetAtMs: number): string {
  return String(Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000)));
}

function monthlyBudgetExceededResponse(resetAtMs: number): NextResponse {
  return NextResponse.json(
    {
      error:
        'The assistant has reached its monthly budget limit. Please try again next month.'
    },
    {
      status: 429,
      headers: { 'Retry-After': getRetryAfterSeconds(resetAtMs) }
    }
  );
}

function monthlyBudgetUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'The assistant budget guard is not configured yet. Please try again later.'
    },
    { status: 503 }
  );
}

function reserveInMemoryMonthlyBudget(
  period: BudgetPeriod,
  reserveCents: number,
  budgetCents: number
): BudgetReservationResult {
  const now = Date.now();
  const existing = _memBudgetStore.get(period.key);
  const entry =
    !existing || now >= existing.resetAtMs
      ? { usedCents: 0, resetAtMs: period.resetAtMs }
      : existing;

  if (entry.usedCents + reserveCents > budgetCents) {
    _memBudgetStore.set(period.key, entry);
    return { allowed: false, usedCents: entry.usedCents };
  }

  entry.usedCents += reserveCents;
  _memBudgetStore.set(period.key, entry);
  return { allowed: true, usedCents: entry.usedCents };
}

function getBudgetScript() {
  if (!_budgetRedis) {
    _budgetRedis = Redis.fromEnv();
  }

  if (!_budgetScript) {
    _budgetScript = _budgetRedis.createScript<BudgetScriptResult>(
      RESERVE_MONTHLY_BUDGET_SCRIPT
    );
  }

  return _budgetScript;
}

function normalizeBudgetScriptResult(value: BudgetScriptResult): BudgetReservationResult {
  const allowedRaw = Number(value[0]);
  const usedCents = Number(value[1]);

  if (!Number.isFinite(allowedRaw) || !Number.isFinite(usedCents)) {
    throw new Error('Invalid assistant monthly budget script response');
  }

  return { allowed: allowedRaw === 1, usedCents };
}

async function reserveRedisMonthlyBudget(
  period: BudgetPeriod,
  reserveCents: number,
  budgetCents: number
): Promise<BudgetReservationResult> {
  const result = await getBudgetScript().exec(period.key ? [period.key] : [], [
    String(reserveCents),
    String(budgetCents),
    String(period.resetAtUnixSeconds)
  ]);
  return normalizeBudgetScriptResult(result);
}

async function reserveAssistantMonthlyBudget(): Promise<NextResponse | null> {
  const budgetCents = getAiAssistantMonthlyBudgetCents();
  const reserveCents = getAiAssistantBudgetReserveCents();
  const period = getBudgetPeriod();

  if (reserveCents > budgetCents) {
    return monthlyBudgetExceededResponse(period.resetAtMs);
  }

  if (getUpstashRedisConfig()) {
    try {
      const result = await reserveRedisMonthlyBudget(period, reserveCents, budgetCents);
      return result.allowed ? null : monthlyBudgetExceededResponse(period.resetAtMs);
    } catch (error) {
      console.error('[assistant-budget] Redis monthly budget guard failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return monthlyBudgetUnavailableResponse();
    }
  }

  if (isProductionEnv()) {
    if (!_warnedMissingMonthlyBudgetRedis) {
      _warnedMissingMonthlyBudgetRedis = true;
      console.error(
        '[assistant-budget] Redis REST env vars are required for the production monthly AI budget guard.'
      );
    }

    return monthlyBudgetUnavailableResponse();
  }

  const result = reserveInMemoryMonthlyBudget(period, reserveCents, budgetCents);
  return result.allowed ? null : monthlyBudgetExceededResponse(period.resetAtMs);
}

export async function applyAssistantBudgetLimits(req: Request): Promise<Response | null> {
  const ipLimited = await applyIdentifierRateLimit(
    getClientIp(req),
    apiRateLimits.assistantDailyIp
  );
  if (ipLimited) return ipLimited;

  const globalLimited = await applyIdentifierRateLimit(
    GLOBAL_ASSISTANT_BUDGET_KEY,
    apiRateLimits.assistantDailyGlobal
  );
  if (globalLimited) return globalLimited;

  return reserveAssistantMonthlyBudget();
}
