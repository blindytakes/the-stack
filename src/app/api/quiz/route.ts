import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { applyIpRateLimit } from '@/lib/rate-limit';
import { scoreQuiz } from '@/lib/services/quiz-service';

/**
 * Quiz scoring endpoint.
 *
 * Flow:
 * - Validate JSON body against quiz schema.
 * - Load current active cards.
 * - Score and rank matches with quiz-engine heuristics.
 * - Return ranked recommendations for client rendering.
 */
export async function POST(req: Request) {
  return instrumentedApi('/api/quiz', 'POST', async () => {
    const rateLimited = await applyIpRateLimit(req, apiRateLimits.quiz);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(req);
    const result = await scoreQuiz(body);
    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  });
}
