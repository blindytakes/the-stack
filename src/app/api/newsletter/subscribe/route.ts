import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, parseJsonBody, serverError } from '@/lib/api-helpers';
import { db, isDatabaseConfigured } from '@/lib/db';

const subscribeSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.toLowerCase().trim()),
  source: z.string().trim().min(1).max(50).default('homepage')
});

export async function POST(req: Request) {
  return instrumentedApi('/api/newsletter/subscribe', 'POST', async () => {
    if (!isDatabaseConfigured()) {
      return serverError('Newsletter signup is temporarily unavailable');
    }

    const body = await parseJsonBody(req);
    if (body === null) {
      return badRequest('Invalid JSON');
    }

    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Please provide a valid email address');
    }

    try {
      await db.subscriber.create({
        data: {
          email: parsed.data.email,
          source: parsed.data.source
        }
      });
    } catch (err: unknown) {
      /* Prisma unique constraint violation (P2002) — already subscribed */
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json(
          { message: "You're already subscribed!" },
          { status: 200 }
        );
      }
      throw err;
    }

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 201 }
    );
  });
}
