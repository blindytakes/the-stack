import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { getCardDetail } from '@/lib/services/cards-service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return instrumentedApi('/api/cards/[slug]', 'GET', async () => {
    const result = await getCardDetail(slug);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  });
}
