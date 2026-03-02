import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Shared per-IP rate-limiting utilities for API routes.
 *
 * Runtime behavior:
 * - Primary path: Upstash Redis (`@upstash/ratelimit`) for shared limits across instances.
 * - Local/dev path: in-memory counter fallback when Redis env vars are not present.
 * - Failure mode: fail-open if Redis is configured but temporarily unreachable, so user traffic is not blocked.
 *
 * All endpoints pass a `namespace` so limits are isolated per API use-case.
 */

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

function parseForwardedFor(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(',')[0]?.trim();
  return first || null;
}

export function getClientIp(req: Request): string {
  // Prefer Vercel's trusted header (set at the edge, not spoofable),
  // then x-real-ip, then the first x-forwarded-for entry as last resort.
  const ip =
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip')?.trim() ??
    parseForwardedFor(req.headers.get('x-forwarded-for')) ??
    null;
  return ip || 'unknown';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Duration =
  | `${number} ms`
  | `${number} s`
  | `${number} m`
  | `${number} h`
  | `${number} d`;

export type RateLimitConfig = {
  namespace: string;
  limit: number;
  window: Duration;
  algorithm?: 'sliding' | 'fixed';
  message?: string;
};

// ---------------------------------------------------------------------------
// Upstash Redis rate limiting
// ---------------------------------------------------------------------------

function isUpstashConfigured(): boolean {
  // Accept either native Upstash var names or Vercel integration KV aliases.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return !!(url && token);
}

let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();
let _warnedMissingUpstashInProd = false;

function getLimiter(config: RateLimitConfig): Ratelimit {
  // Cache one limiter per unique config so every request doesn't re-create SDK objects.
  const cacheKey = `${config.namespace}:${config.limit}:${config.window}:${config.algorithm ?? 'sliding'}`;
  let limiter = _limiters.get(cacheKey);
  if (!limiter) {
    if (!_redis) {
      _redis = Redis.fromEnv();
    }

    const algo =
      config.algorithm === 'fixed'
        ? Ratelimit.fixedWindow(config.limit, config.window)
        : Ratelimit.slidingWindow(config.limit, config.window);

    limiter = new Ratelimit({
      redis: _redis,
      limiter: algo,
      prefix: `rl:${config.namespace}`,
      analytics: false
    });
    _limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev / when Upstash is not configured)
// ---------------------------------------------------------------------------

type MemEntry = { count: number; resetAtMs: number };
const _memStore = new Map<string, MemEntry>();

function parseWindowMs(window: Duration): number {
  const match = window.match(/^(\d+)\s+(ms|s|m|h|d)$/);
  if (!match) throw new Error(`Invalid window format: ${window}`);
  const n = Number(match[1]);
  switch (match[2]) {
    case 'ms':
      return n;
    case 's':
      return n * 1_000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      throw new Error(`Unknown unit: ${match[2]}`);
  }
}

function applyInMemoryLimit(
  ip: string,
  config: RateLimitConfig
): NextResponse | null {
  // This is a simple fixed-window counter used only as a non-shared fallback.
  const key = `${config.namespace}:${ip}`;
  const windowMs = parseWindowMs(config.window);
  const now = Date.now();
  const existing = _memStore.get(key);
  const isExpired = !existing || now >= existing.resetAtMs;

  const entry: MemEntry = isExpired
    ? { count: 0, resetAtMs: now + windowMs }
    : existing;

  if (entry.count >= config.limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((entry.resetAtMs - now) / 1000)
    );
    return NextResponse.json(
      { error: config.message ?? 'Too many requests. Please try again soon.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  entry.count += 1;
  _memStore.set(key, entry);
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply per-IP rate limiting.
 *
 * Uses Upstash Redis when configured (production), falls back to in-memory
 * counters for local development.
 */
export async function applyIpRateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Every endpoint uses a shared IP extraction strategy before enforcing limits.
  const ip = getClientIp(req);

  if (isUpstashConfigured()) {
    try {
      const limiter = getLimiter(config);
      const result = await limiter.limit(ip);

      if (result.success) return null; // Allowed, route handler continues.

      const retryAfter = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: config.message ?? 'Too many requests. Please try again soon.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    } catch (error) {
      // Fail open: preserve availability if upstream Redis is degraded.
      console.error('[rate-limit] Upstash error, failing open', {
        namespace: config.namespace,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  if (process.env.NODE_ENV === 'production' && !_warnedMissingUpstashInProd) {
    _warnedMissingUpstashInProd = true;
    console.warn(
      '[rate-limit] Redis REST env vars not set (UPSTASH_REDIS_REST_* or KV_REST_API_*) in production — ' +
        'falling back to per-process in-memory limits. ' +
        'Rate limits will NOT be shared across Vercel instances.'
    );
  }

  return applyInMemoryLimit(ip, config);
}
