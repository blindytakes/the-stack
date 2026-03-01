import { NextResponse } from 'next/server';
import { z } from 'zod';
import { instrumentedApi } from '@/lib/api-route';
import { badRequest, parseJsonBody, serverError } from '@/lib/api-helpers';
import { db, isDatabaseConfigured } from '@/lib/db';
import { syncNewsletterSubscriber } from '@/lib/newsletter/provider';
import { trackedSourceSchema } from '@/lib/tracking';

const subscribeSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.toLowerCase().trim()),
  source: trackedSourceSchema.default('homepage')
});

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const prefix = local.length > 1 ? `${local[0]}***` : '*';
  return `${prefix}@${domain}`;
}

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

    const existing = await db.subscriber.findUnique({
      where: { email: parsed.data.email },
      select: { id: true }
    });
    const created = !existing;
    await db.subscriber.upsert({
      where: { email: parsed.data.email },
      create: {
        email: parsed.data.email,
        source: parsed.data.source,
        isActive: true
      },
      update: {
        source: parsed.data.source,
        isActive: true
      }
    });

    try {
      const syncResult = await syncNewsletterSubscriber({
        email: parsed.data.email,
        source: parsed.data.source
      });

      return NextResponse.json(
        {
          message: created ? 'Successfully subscribed!' : "You're already subscribed!",
          provider: syncResult.provider,
          syncStatus: syncResult.status
        },
        { status: created ? 201 : 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[newsletter] provider sync failed', {
        email: maskEmail(parsed.data.email),
        source: parsed.data.source,
        error: message
      });

      return NextResponse.json(
        {
          message: created ? 'Successfully subscribed!' : "You're already subscribed!",
          warning: 'Saved locally, but provider sync failed. Our team has been alerted.'
        },
        { status: 202 }
      );
    }
  });
}
