import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { isValidOrigin, verifyTurnstileToken } from '@/lib/turnstile';
import {
  newsletterSubscribeInputSchema,
  processNewsletterSubscribe
} from '@/lib/services/newsletter-service';

const subscribeRequestSchema = newsletterSubscribeInputSchema.extend({
  // Optional in schema so local/test flows can run without Turnstile config.
  // verifyTurnstileToken() still enforces fail-closed behavior in production.
  turnstileToken: z.string().min(1).optional()
});

/**
 * Newsletter subscribe endpoint.
 *
 * Validation/enforcement order:
 * 1) Origin check (cheap anti-CSRF guard)
 * 2) Per-IP rate limit (abuse throttling)
 * 3) JSON/schema validation
 * 4) Turnstile verification (bot defense)
 * 5) Database upsert + provider sync
 *
 * The order is intentional to reject bad requests before expensive operations.
 */

export async function POST(req: Request) {
  return instrumentedApi('/api/newsletter/subscribe', 'POST', async () => {
    // 1. Origin check (cheap, no external calls)
    if (!isValidOrigin(req)) {
      return badRequest('Invalid request origin');
    }

    // 2. Rate limiting — 3 requests per 10 minutes, sliding window
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.newsletterSubscribe);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    if (body === null) {
      return badRequest('Invalid JSON');
    }

    const parsed = subscribeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Please provide a valid email address');
    }

    const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, req);
    if (!turnstileOk) {
      return badRequest('Challenge verification failed. Please try again.');
    }

    const result = await processNewsletterSubscribe({
      email: parsed.data.email,
      source: parsed.data.source
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.body, { status: result.status });
  });
}
