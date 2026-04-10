import { z } from 'zod';
import {
  cardDetailResponseSchema,
  type CardDetailResponse,
  cardsListResponseSchema,
  type CardsListResponse,
  cardsQuerySchema,
  filterCards,
  getCardBySlug,
  getCardsData,
  paginateCards
} from '@/lib/cards';

export type CardsListResult =
  | {
      ok: true;
      data: CardsListResponse;
    }
  | { ok: false; status: 400 | 500; error: string };

export type CardsListQueryInput = {
  issuer?: string;
  category?: string;
  maxFee?: string;
  limit?: string;
  offset?: string;
};

const slugSchema = z.string().trim().min(1).max(200);

export async function getCardsList(query: CardsListQueryInput): Promise<CardsListResult> {
  const parsed = cardsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid query params' };
  }

  try {
    const { cards: allCards } = await getCardsData();
    const filtered = filterCards(allCards, parsed.data);
    const results = paginateCards(filtered, parsed.data);
    const data = cardsListResponseSchema.parse({
      results,
      pagination: {
        total: filtered.length,
        limit: parsed.data.limit,
        offset: parsed.data.offset
      }
    });

    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error('[cards-service] failed to load cards list', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 500,
      error: 'Card data is temporarily unavailable'
    };
  }
}

export type CardDetailResult =
  | { ok: true; data: CardDetailResponse }
  | { ok: false; status: 400 | 404 | 500; error: string };

export async function getCardDetail(slugInput: string): Promise<CardDetailResult> {
  const parsed = slugSchema.safeParse(slugInput);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid slug' };
  }

  try {
    const card = await getCardBySlug(parsed.data);
    if (!card) {
      return { ok: false, status: 404, error: 'Card not found' };
    }

    return {
      ok: true,
      data: cardDetailResponseSchema.parse({ card })
    };
  } catch (error) {
    console.error('[cards-service] failed to load card detail', {
      slug: parsed.data,
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      status: 500,
      error: 'Card data is temporarily unavailable'
    };
  }
}
