import posthog from 'posthog-js';
import { getPosthogPublicConfig } from '@/lib/config/public';

const posthogConfig = getPosthogPublicConfig();

if (typeof window !== 'undefined' && posthogConfig) {
  posthog.init(posthogConfig.key, {
    api_host: posthogConfig.host,
    defaults: '2026-01-30'
  });
}
