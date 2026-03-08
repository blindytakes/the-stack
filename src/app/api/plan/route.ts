import { NextResponse } from 'next/server';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, parseJsonBody } from '@/lib/api-helpers';
import { buildPlan } from '@/lib/services/plan-service';

export async function POST(req: Request) {
  return instrumentedApi('/api/plan', 'POST', async () => {
    const body = await parseJsonBody(req);
    const result = await buildPlan(body);
    if (!result.ok) {
      if (result.status === 400) {
        return badRequest(result.error);
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  });
}
