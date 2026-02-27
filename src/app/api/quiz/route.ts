import { NextResponse } from 'next/server';
import {
  quizRequestSchema,
  rankQuizResults
} from '@/lib/quiz-engine';
import { instrumentedApi } from '@/lib/api-route';
import { getCardsDataWithDbFallback } from '@/lib/cards';

export async function POST(req: Request) {
  return instrumentedApi('/api/quiz', 'POST', async () => {
    try {
      const body = await req.json();
      const parsed = quizRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      const { cards } = await getCardsDataWithDbFallback();
      const ranked = rankQuizResults(cards, parsed.data);

      return NextResponse.json({ results: ranked });
    } catch {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  });
}
