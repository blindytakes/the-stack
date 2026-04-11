'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NewsletterSignup } from '@/components/newsletter-signup';

const footerLinks = [
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' }
];

export function SiteFooter() {
  const pathname = usePathname();
  const showFooterNewsletter =
    pathname !== '/' &&
    pathname !== '/about' &&
    pathname !== '/newsletter' &&
    !pathname.startsWith('/tools/card-finder') &&
    !pathname.startsWith('/tools/premium-card-calculator') &&
    !pathname.startsWith('/plan/results');
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-bg shadow-[inset_0_1px_0_rgba(45,212,191,0.06)]">
      {/* Newsletter */}
      {showFooterNewsletter && (
        <div className="container-page relative border-b border-white/5 py-10">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-teal">Get bonus plays</p>
            <p className="mt-2 text-xs text-text-muted">
              Bonus offers, APY moves, and fee traps to avoid. Never sponsored.
            </p>
            <div className="mt-4">
              <NewsletterSignup
                source="footer"
                compact
                size="large"
                submitLabel="Get bonus plays"
              />
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="container-page relative flex flex-col gap-6 py-12 text-base text-text-secondary md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-heading text-xl text-text-primary">The Stack</div>
          <p className="mt-2 leading-7 xl:whitespace-nowrap">
            The rewards site that tells you exactly what to do next, with personalized bonus plans
            for cards and banking.
          </p>
          <p className="mt-3 text-sm text-text-muted">© {year} The Stack. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-8 text-base">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
