import { readTrimmed } from '@/lib/config/read-trimmed';
import { isProductionEnv } from '@/lib/config/runtime';

export type UpstashRedisConfig = {
  url: string;
  token: string;
};

export function getDatabaseUrl(): string | null {
  return readTrimmed(process.env.DATABASE_URL);
}

export function isDatabaseUrlConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getUpstashRedisConfig(): UpstashRedisConfig | null {
  const url =
    readTrimmed(process.env.UPSTASH_REDIS_REST_URL) ??
    readTrimmed(process.env.KV_REST_API_URL);
  const token =
    readTrimmed(process.env.UPSTASH_REDIS_REST_TOKEN) ??
    readTrimmed(process.env.KV_REST_API_TOKEN);

  if (!url || !token) return null;
  return { url, token };
}

export function getTurnstileSecretKey(): string | null {
  return readTrimmed(process.env.TURNSTILE_SECRET_KEY);
}

export function getHealthCheckToken(): string | null {
  return readTrimmed(process.env.HEALTH_CHECK_TOKEN);
}

function parseEnabledFlag(value: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

export function isAiAssistantEnabled(): boolean {
  const explicit = parseEnabledFlag(
    readTrimmed(process.env.AI_ASSISTANT_ENABLED) ??
      readTrimmed(process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED)
  );

  if (explicit !== null) return explicit;
  return !isProductionEnv();
}

export function getAiAssistantModel(): string {
  return readTrimmed(process.env.AI_ASSISTANT_MODEL) ?? 'openai/gpt-5.4-mini';
}

const DEFAULT_AI_ASSISTANT_MONTHLY_BUDGET_CENTS = 5_000;
const DEFAULT_AI_ASSISTANT_BUDGET_RESERVE_CENTS = 5;

function parseNonNegativeInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function getAiAssistantMonthlyBudgetCents(): number {
  return (
    parseNonNegativeInteger(readTrimmed(process.env.AI_ASSISTANT_MONTHLY_BUDGET_CENTS)) ??
    DEFAULT_AI_ASSISTANT_MONTHLY_BUDGET_CENTS
  );
}

export function getAiAssistantBudgetReserveCents(): number {
  const parsed = parseNonNegativeInteger(
    readTrimmed(process.env.AI_ASSISTANT_BUDGET_RESERVE_CENTS)
  );
  return parsed && parsed > 0 ? parsed : DEFAULT_AI_ASSISTANT_BUDGET_RESERVE_CENTS;
}

export function hasAiGatewayAuth(): boolean {
  return Boolean(
    readTrimmed(process.env.AI_GATEWAY_API_KEY) ??
      readTrimmed(process.env.VERCEL_OIDC_TOKEN)
  );
}

export function getSupportEmail(): string | null {
  return readTrimmed(process.env.SUPPORT_EMAIL);
}

export function getPersonalFinanceTrackerGoogleSheetSource(): string | null {
  return (
    readTrimmed(process.env.PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET) ??
    readTrimmed(process.env.PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_URL) ??
    readTrimmed(process.env.PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_ID)
  );
}

export function getPersonalFinanceTrackerGoogleSheetGid(): string | null {
  return readTrimmed(process.env.PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_GID);
}
