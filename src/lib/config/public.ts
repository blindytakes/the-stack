import { readTrimmed } from '@/lib/config/read-trimmed';

export type PosthogPublicConfig = {
  key: string;
  host: string;
};

export function getPosthogPublicConfig(): PosthogPublicConfig | null {
  const key = readTrimmed(process.env.NEXT_PUBLIC_POSTHOG_KEY);
  const host = readTrimmed(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  if (!key || !host) return null;
  return { key, host };
}

export function getTurnstileSiteKey(): string | null {
  return readTrimmed(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
