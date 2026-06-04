import type { RateLimitConfig } from '@/lib/rate-limit';

/**
 * Public API rate limits tuned for interactive product usage.
 *
 * Read-heavy directory/detail endpoints get generous limits so normal browsing
 * and compare flows stay smooth. Plan and email endpoints are more expensive,
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
  funnelEvents: {
    namespace: 'funnel_events',
    limit: 120,
    window: '1 m',
    algorithm: 'fixed',
    message: 'Rate limit exceeded for funnel events'
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
  },
  calculatorEmail: {
    namespace: 'calculator_email',
    limit: 3,
    window: '10 m',
    algorithm: 'sliding',
    message: 'Too many calculator email requests. Please try again soon.'
  },
  personalFinanceTrackerDownload: {
    namespace: 'personal_finance_tracker_download',
    limit: 30,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many tracker download requests. Please try again soon.'
  },
  assistantChat: {
    namespace: 'assistant_chat',
    limit: 5,
    window: '1 m',
    algorithm: 'sliding',
    message: 'Too many assistant messages. Please try again shortly.',
    failClosedOnRedisError: true,
    redisErrorMessage: 'The assistant is temporarily unavailable. Please try again later.'
  },
  assistantDailyIp: {
    namespace: 'assistant_daily_ip',
    limit: 10,
    window: '1 d',
    algorithm: 'fixed',
    message: 'Daily assistant limit reached for this connection. Please try again tomorrow.',
    failClosedOnRedisError: true,
    redisErrorMessage: 'The assistant is temporarily unavailable. Please try again later.'
  },
  assistantDailyGlobal: {
    namespace: 'assistant_daily_global',
    limit: 100,
    window: '1 d',
    algorithm: 'fixed',
    message: "The assistant has reached today's site-wide budget limit. Please try again tomorrow.",
    failClosedOnRedisError: true,
    redisErrorMessage: 'The assistant is temporarily unavailable. Please try again later.'
  }
} satisfies Record<string, RateLimitConfig>;
