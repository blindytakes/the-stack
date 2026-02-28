import { NextResponse } from 'next/server';
import { filterCards, getCardsDataWithDbFallback, paginateCards, cardsQuerySchema } from '@/lib/cards';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  return instrumentedApi('/api/cards', 'GET', async () => {
    try {
      const url = new URL(req.url);
      const rawQuery = {
        issuer: url.searchParams.get('issuer') ?? undefined,
        category: url.searchParams.get('category') ?? undefined,
        maxFee: url.searchParams.get('maxFee') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
        offset: url.searchParams.get('offset') ?? undefined
      };

      const parsed = cardsQuerySchema.safeParse(rawQuery);
      if (!parsed.success) {
        return badRequest('Invalid query params');
      }

      const { cards: allCards } = await getCardsDataWithDbFallback();
      const filtered = filterCards(allCards, parsed.data);
      const results = paginateCards(filtered, parsed.data);

      return NextResponse.json({
        results,
        pagination: {
          total: filtered.length,
          limit: parsed.data.limit,
          offset: parsed.data.offset
        }
      });
    } catch (err) {
      console.error('[/api/cards] Unhandled error:', err);
      return serverError();
    }
  });
}
