import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
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
