'use client';

import { trackFunnelEvent } from '@/components/analytics/funnel-events';

type AffiliateLinkProps = {
  href: string;
  source: string;
  className?: string;
  children: React.ReactNode;
} & (
  | {
      cardSlug: string;
      bankSlug?: never;
    }
  | {
      cardSlug?: never;
      bankSlug: string;
    }
);

export function AffiliateLink({
  href,
  cardSlug,
  bankSlug,
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
          ...(cardSlug ? { card_slug: cardSlug } : {}),
          ...(bankSlug ? { bank_slug: bankSlug } : {})
        });
      }}
    >
      {children}
    </a>
  );
}
