import { z } from 'zod';

const resendApiKeySchema = z.string().trim().regex(/^re_[A-Za-z0-9_]+$/, {
  message: 'RESEND_API_KEY format is invalid'
});

const uuidSchema = z.string().trim().uuid({
  message: 'RESEND_AUDIENCE_ID must be a UUID'
});

const newsletterEnvSchema = z
  .object({
    NEWSLETTER_PROVIDER: z.enum(['none', 'resend']).default('none'),
    RESEND_API_KEY: resendApiKeySchema.optional(),
    RESEND_AUDIENCE_ID: uuidSchema.optional(),
    NEWSLETTER_SYNC_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2)
  })
  .superRefine((data, ctx) => {
    if (data.NEWSLETTER_PROVIDER === 'resend') {
      if (!data.RESEND_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RESEND_API_KEY'],
          message: 'RESEND_API_KEY is required when NEWSLETTER_PROVIDER=resend'
        });
      }

      if (!data.RESEND_AUDIENCE_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RESEND_AUDIENCE_ID'],
          message: 'RESEND_AUDIENCE_ID is required when NEWSLETTER_PROVIDER=resend'
        });
      }
    }
  });

export type NewsletterEnv = z.infer<typeof newsletterEnvSchema>;

const affiliateEnvSchema = z.object({
  AFFILIATE_ALLOWED_HOSTS: z
    .string()
    .trim()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean)
    )
});

export type AffiliateEnv = z.infer<typeof affiliateEnvSchema>;

export function getNewsletterEnv():
  | { ok: true; config: NewsletterEnv }
  | { ok: false; errors: string[] } {
  const parsed = newsletterEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message)
    };
  }
  return { ok: true, config: parsed.data };
}

export function getAffiliateEnv():
  | { ok: true; config: AffiliateEnv }
  | { ok: false; errors: string[] } {
  const parsed = affiliateEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message)
    };
  }

  if (parsed.data.AFFILIATE_ALLOWED_HOSTS.length === 0) {
    return {
      ok: false,
      errors: ['AFFILIATE_ALLOWED_HOSTS must include at least one host']
    };
  }

  return { ok: true, config: parsed.data };
}
