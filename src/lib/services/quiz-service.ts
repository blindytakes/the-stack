import { getCardsData } from '@/lib/cards';
import { type QuizResult, quizRequestSchema, rankQuizResults } from '@/lib/quiz-engine';

export type QuizScoreResult =
  | { ok: true; data: { results: QuizResult[] } }
  | { ok: false; status: 400 | 500; error: string };

export async function scoreQuiz(rawBody: unknown | null): Promise<QuizScoreResult> {
  if (rawBody === null) {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }

  const parsed = quizRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid payload' };
  }

  try {
    const { cards } = await getCardsData();
    const ranked = rankQuizResults(cards, parsed.data);
    return { ok: true, data: { results: ranked } };
  } catch (error) {
    console.error('[quiz-service] failed to score quiz', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 500,
      error: 'Quiz scoring is temporarily unavailable'
    };
  }
}
