'use client';

import { trackFunnelEvent } from '@/components/analytics/funnel-events';

type AffiliateLinkProps = {
  href: string;
  cardSlug: string;
  source: string;
  className?: string;
  children: React.ReactNode;
};

export function AffiliateLink({
  href,
  cardSlug,
  source,
  className,
  children
}: AffiliateLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={() => {
        trackFunnelEvent('affiliate_click', {
          source,
          card_slug: cardSlug
        });
      }}
    >
      {children}
    </a>
  );
}
