import { NextResponse } from 'next/server';
import { quizRequestSchema, rankQuizResults } from '@/lib/quiz-engine';
import { instrumentedApi } from '@/lib/api-route';
import { getCardsDataWithDbFallback } from '@/lib/cards';
import { badRequest, parseJsonBody, serverError } from '@/lib/api-helpers';

export async function POST(req: Request) {
  return instrumentedApi('/api/quiz', 'POST', async () => {
    try {
      const body = await parseJsonBody(req);
      if (body === null) {
        return badRequest('Invalid JSON');
      }

      const parsed = quizRequestSchema.safeParse(body);
      if (!parsed.success) {
        return badRequest('Invalid payload');
      }

      const { cards } = await getCardsDataWithDbFallback();
      const ranked = rankQuizResults(cards, parsed.data);

      return NextResponse.json({ results: ranked });
    } catch (err) {
      console.error('[/api/quiz] Unhandled error:', err);
      return serverError();
    }
  });
}
