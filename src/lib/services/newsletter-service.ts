import { z } from 'zod';
import { db, isDatabaseConfigured } from '@/lib/db';
import { syncNewsletterSubscriber } from '@/lib/newsletter/provider';
import { trackedSourceSchema } from '@/lib/tracking';

export const newsletterSubscribeInputSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase().trim()),
  source: trackedSourceSchema.default('homepage')
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeInputSchema>;

type NewsletterSubscribeSuccessBody =
  | {
      message: string;
      provider: 'none' | 'resend' | 'beehiiv';
      syncStatus: 'subscribed' | 'already_subscribed' | 'skipped';
    }
  | {
      message: string;
      warning: string;
    };

export type NewsletterSubscribeResult =
  | { ok: true; status: 200 | 201 | 202; body: NewsletterSubscribeSuccessBody }
  | { ok: false; status: 500; error: string };

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const prefix = local.length > 1 ? `${local[0]}***` : '*';
  return `${prefix}@${domain}`;
}

export async function processNewsletterSubscribe(
  input: NewsletterSubscribeInput
): Promise<NewsletterSubscribeResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      status: 500,
      error: 'Newsletter signup is temporarily unavailable'
    };
  }

  const existing = await db.subscriber.findUnique({
    where: { email: input.email },
    select: { id: true }
  });
  const created = !existing;
  await db.subscriber.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      source: input.source,
      isActive: true
    },
    update: {
      source: input.source,
      isActive: true
    }
  });

  try {
    const syncResult = await syncNewsletterSubscriber({
      email: input.email,
      source: input.source
    });

    return {
      ok: true,
      status: created ? 201 : 200,
      body: {
        message: created ? 'Successfully subscribed!' : "You're already subscribed!",
        provider: syncResult.provider,
        syncStatus: syncResult.status
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[newsletter] provider sync failed', {
      email: maskEmail(input.email),
      source: input.source,
      error: message
    });

    return {
      ok: true,
      status: 202,
      body: {
        message: created ? 'Successfully subscribed!' : "You're already subscribed!",
        warning:
          'We saved your request, but could not finish syncing your subscription. Please try again shortly.'
      }
    };
  }
}
