import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest } from '@/lib/api-helpers';
import { getCardsList } from '@/lib/services/cards-service';

/**
 * Card listing API endpoint.
 *
 * Responsibilities:
 * - Parse and validate query-string filters (issuer, category, fee, pagination).
 * - Load active card records from the canonical card data service.
 * - Apply filtering + pagination in-process and return metadata for clients.
 */
export async function GET(req: Request) {
  return instrumentedApi('/api/cards', 'GET', async () => {
    const url = new URL(req.url);
    const result = await getCardsList({
      issuer: url.searchParams.get('issuer') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      maxFee: url.searchParams.get('maxFee') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined
    });
    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  });
}
