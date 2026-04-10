import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest } from '@/lib/api-helpers';
import { resolveAffiliateClickRedirect } from '@/lib/services/affiliate-service';

/**
 * Affiliate click redirect endpoint.
 *
 * Responsibilities:
 * - Validate query parameters and tracking metadata.
 * - Enforce per-IP rate limiting to reduce automated abuse.
 * - Enforce host allowlist before redirecting to an external URL.
 * - Emit click tracking metrics before issuing a 307 redirect.
 */
export const GET = createApiRoute({
  route: '/api/affiliate/click',
  method: 'GET',
  rateLimit: apiRateLimits.affiliateClick,
  handler: async (req: Request) => {
    const resolution = resolveAffiliateClickRedirect(req.url);
    if (!resolution.ok) {
      return badRequest(resolution.error);
    }

    return NextResponse.redirect(resolution.redirectUrl, { status: 307 });
  }
});
