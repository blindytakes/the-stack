import { NextResponse } from 'next/server';
import { quizRequestSchema, rankQuizResults } from '@/lib/quiz-engine';
import { instrumentedApi } from '@/lib/api-route';
import { getCardsData } from '@/lib/cards';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';

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
    if (body === null) {
      return badRequest('Invalid JSON');
    }

    const parsed = quizRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid payload');
    }

    const { cards } = await getCardsData();
    const ranked = rankQuizResults(cards, parsed.data);

    return NextResponse.json({ results: ranked });
  });
}
