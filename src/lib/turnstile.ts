import { getClientIp } from '@/lib/rate-limit';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Server-side Turnstile helpers for newsletter bot protection and request-origin validation.
 *
 * Design:
 * - In production, missing Turnstile secret is treated as a hard misconfiguration (fail closed).
 * - In non-production, missing secret is allowed so local/test environments work without extra setup.
 * - Token verification uses Cloudflare's siteverify API and includes client IP as context.
 */

/**
 * Verify a Turnstile challenge token server-side.
 *
 * Returns `true` only when Turnstile is not configured in non-production
 * environments so local dev/tests can proceed without blocking.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  req: Request
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[turnstile] TURNSTILE_SECRET_KEY not set in production — rejecting request'
      );
      return false;
    }
    return true; // not configured — skip in dev
  }

  // If Turnstile is configured, token is required on every protected request.
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: getClientIp(req)
      })
    });

    const data: { success: boolean } = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('[turnstile] verification request failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Check that the request Origin header matches the Host header.
 *
 * Returns `true` when the headers are consistent (same-origin request)
 * or when Origin is absent and we're in development.
 */
export function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  // In development, be lenient if Origin is missing (e.g. curl, Postman)
  if (process.env.NODE_ENV === 'development' && !origin) return true;

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
