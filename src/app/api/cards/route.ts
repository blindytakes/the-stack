import { NextResponse } from 'next/server';
import { filterCards, getCardsDataWithDbFallback, paginateCards, cardsQuerySchema } from '@/lib/cards';
import { instrumentedApi } from '@/lib/api-route';

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
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
      }

      const { cards: allCards, source } = await getCardsDataWithDbFallback();
      const filtered = filterCards(allCards, parsed.data);
      const results = paginateCards(filtered, parsed.data);
      if (source === 'json') {
        console.warn('[api:/api/cards] using JSON fallback source');
      }

      return NextResponse.json({
        results,
        pagination: {
          total: filtered.length,
          limit: parsed.data.limit,
          offset: parsed.data.offset
        }
      });
    } catch {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  });
}
