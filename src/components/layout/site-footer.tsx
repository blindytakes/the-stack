'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NewsletterSignup } from '@/components/newsletter-signup';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/banking', label: 'Banking' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
  { href: '/contact', label: 'Contact' }
];

export function SiteFooter() {
  const pathname = usePathname();
  const showFooterNewsletter = pathname !== '/' && pathname !== '/about';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5">
      {/* Newsletter */}
      {showFooterNewsletter && (
        <div className="container-page border-b border-white/5 py-10">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-semibold text-text-primary">Get weekly bank payout plays</p>
            <p className="mt-1 text-xs text-text-muted">
              Bonus offers, APY opportunities, and fee traps to avoid.
            </p>
            <div className="mt-4">
              <NewsletterSignup source="footer" compact />
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-heading text-lg text-text-primary">The Stack</div>
          <p>Independent bank and card strategy. No hype, just math.</p>
          <p className="mt-1 text-xs text-text-muted">© {year} The Stack. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-6">
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
