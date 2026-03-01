import { getNewsletterEnv, type NewsletterEnv } from '@/lib/env';
import { recordNewsletterSyncAttempt, recordNewsletterSyncResult } from '@/lib/metrics';

export type NewsletterSyncInput = {
  email: string;
  source: string;
};

export type NewsletterSyncResult = {
  provider: 'none' | 'resend';
  status: 'subscribed' | 'already_subscribed' | 'skipped';
  attempts: number;
};

class NewsletterSyncError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'NewsletterSyncError';
    this.retryable = retryable;
  }
}

type NewsletterProvider = {
  name: 'none' | 'resend';
  upsertSubscriber(input: NewsletterSyncInput): Promise<'subscribed' | 'already_subscribed'>;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function extractProviderErrorMessage(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  if ('message' in value && typeof value.message === 'string') return value.message;
  if ('error' in value && typeof value.error === 'string') return value.error;
  return '';
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function createNoopProvider(): NewsletterProvider {
  return {
    name: 'none',
    async upsertSubscriber() {
      return 'subscribed';
    }
  };
}

function createResendProvider(apiKey: string, audienceId: string): NewsletterProvider {
  return {
    name: 'resend',
    async upsertSubscriber(input) {
      let response: Response;
      try {
        response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: input.email,
            unsubscribed: false
          })
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown fetch error';
        throw new NewsletterSyncError(`Resend network error: ${message}`, true);
      }

      if (response.ok) {
        return 'subscribed';
      }

      const rawBody = await response.json().catch(() => null);
      const bodyMessage = extractProviderErrorMessage(rawBody);
      const responseSummary = `Resend API ${response.status}${bodyMessage ? `: ${bodyMessage}` : ''}`;

      if (response.status === 409) {
        return 'already_subscribed';
      }

      throw new NewsletterSyncError(responseSummary, isRetryableStatus(response.status));
    }
  };
}

function resolveProvider(config: NewsletterEnv): NewsletterProvider {
  if (config.NEWSLETTER_PROVIDER === 'none') {
    return createNoopProvider();
  }

  return createResendProvider(config.RESEND_API_KEY!, config.RESEND_AUDIENCE_ID!);
}

export function getNewsletterProviderStatus() {
  const env = getNewsletterEnv();
  if (!env.ok) {
    return {
      ok: false as const,
      provider: 'unknown' as const,
      message: env.errors.join('; ')
    };
  }

  if (env.config.NEWSLETTER_PROVIDER === 'none') {
    return {
      ok: true as const,
      provider: 'none' as const,
      message: 'disabled'
    };
  }

  return {
    ok: true as const,
    provider: 'resend' as const,
    message: 'configured'
  };
}

export async function syncNewsletterSubscriber(
  input: NewsletterSyncInput
): Promise<NewsletterSyncResult> {
  const env = getNewsletterEnv();
  if (!env.ok) {
    throw new NewsletterSyncError(
      `Newsletter config invalid: ${env.errors.join('; ')}`,
      false
    );
  }

  const maxRetries = env.config.NEWSLETTER_SYNC_MAX_RETRIES;
  const provider = resolveProvider(env.config);

  if (provider.name === 'none') {
    return { provider: 'none', status: 'skipped', attempts: 0 };
  }

  for (let attempts = 1; attempts <= maxRetries + 1; attempts += 1) {
    recordNewsletterSyncAttempt(provider.name, attempts);
    try {
      const status = await provider.upsertSubscriber(input);
      recordNewsletterSyncResult(provider.name, status, attempts);
      return {
        provider: provider.name,
        status,
        attempts
      };
    } catch (error) {
      const syncError =
        error instanceof NewsletterSyncError
          ? error
          : new NewsletterSyncError(
              error instanceof Error ? error.message : 'Unexpected sync error',
              false
            );

      const shouldRetry = syncError.retryable && attempts <= maxRetries;
      if (!shouldRetry) {
        recordNewsletterSyncResult(provider.name, 'failed', attempts);
        throw syncError;
      }

      await sleep(250 * attempts);
    }
  }

  throw new NewsletterSyncError('Newsletter sync exhausted retries', false);
}
