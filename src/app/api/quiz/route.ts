import { createApiRoute, jsonFromServiceResult } from '@/lib/api-route';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { parseJsonBody } from '@/lib/api-helpers';
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
export const POST = createApiRoute({
  route: '/api/quiz',
  method: 'POST',
  rateLimit: apiRateLimits.quiz,
  handler: async (req: Request) => {
    const body = await parseJsonBody(req);
    return jsonFromServiceResult(await scoreQuiz(body));
  }
});
