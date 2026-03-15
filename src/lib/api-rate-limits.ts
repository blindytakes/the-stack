import type { RateLimitConfig } from '@/lib/rate-limit';

/**
 * Public API rate limits tuned for interactive product usage.
 *
 * Read-heavy directory/detail endpoints get generous limits so normal browsing
 * and compare flows stay smooth. Quiz and plan endpoints are more expensive,
 * so they use tighter per-minute caps.
 */
export const apiRateLimits = {
  newsletterSubscribe: {
    namespace: 'newsletter_subscribe',
    limit: 3,
    window: '10 m',
    algorithm: 'sliding',
    message: 'Too many newsletter signup requests. Please try again soon.'
  },
  affiliateClick: {
    namespace: 'affiliate_click',
    limit: 60,
    window: '1 m',
    algorithm: 'fixed',
    message: 'Too many affiliate click requests. Please try again shortly.'
  },
  vitalsIngestion: {
    namespace: 'web_vitals',
    limit: 120,
    window: '1 m',
    algorithm: 'fixed',
    message: 'Rate limit exceeded for vitals ingestion'
  },
  cardsList: {
    namespace: 'cards_list',
    limit: 120,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many card list requests. Please try again soon.'
  },
  cardDetail: {
    namespace: 'card_detail',
    limit: 60,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many card detail requests. Please try again soon.'
  },
  bankingList: {
    namespace: 'banking_list',
    limit: 120,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many banking requests. Please try again soon.'
  },
  quiz: {
    namespace: 'quiz_score',
    limit: 30,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many quiz requests. Please try again soon.'
  },
  plan: {
    namespace: 'plan_build',
    limit: 20,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many plan requests. Please try again soon.'
  },
  planSnapshot: {
    namespace: 'plan_snapshot',
    limit: 20,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many plan save requests. Please try again soon.'
  },
  emailPlan: {
    namespace: 'email_plan',
    limit: 3,
    window: '10 m',
    algorithm: 'sliding',
    message: 'Too many plan email requests. Please try again soon.'
  }
} satisfies Record<string, RateLimitConfig>;
