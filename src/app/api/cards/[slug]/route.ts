import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCardBySlug } from '@/lib/cards';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, jsonError } from '@/lib/api-helpers';

const slugSchema = z.string().trim().min(1).max(200);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return instrumentedApi('/api/cards/[slug]', 'GET', async () => {
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return badRequest('Invalid slug');
    }

    const card = await getCardBySlug(parsed.data);
    if (!card) {
      return jsonError('Card not found', 404);
    }
    return NextResponse.json({ card });
  });
}
