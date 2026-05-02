import { readTrimmed } from '@/lib/config/read-trimmed';

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
