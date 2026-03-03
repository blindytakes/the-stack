import { timingSafeEqual } from 'crypto';
import { getHealthCheckToken } from '@/lib/config/server';
import { isProductionEnv } from '@/lib/config/runtime';

const HEALTH_TOKEN_HEADER = 'x-health-token';

type HealthAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: string };

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function safeTokenEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function authorizeHealthCheck(req: Request): HealthAuthResult {
  const configuredToken = getHealthCheckToken();

  if (!configuredToken) {
    if (isProductionEnv()) {
      return {
        ok: false,
        status: 503,
        reason: 'HEALTH_CHECK_TOKEN is not configured'
      };
    }

    return { ok: true };
  }

  const tokenFromHeader =
    parseBearerToken(req.headers.get('authorization')) ??
    req.headers.get(HEALTH_TOKEN_HEADER);

  if (!tokenFromHeader || !safeTokenEqual(tokenFromHeader, configuredToken)) {
    return {
      ok: false,
      status: 401,
      reason: 'Unauthorized'
    };
  }

  return { ok: true };
}
