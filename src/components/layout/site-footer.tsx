'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NewsletterSignup } from '@/components/newsletter-signup';

const footerLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' }
];

export function SiteFooter() {
  const pathname = usePathname();
  const showFooterNewsletter =
    pathname !== '/' &&
    pathname !== '/about' &&
    pathname !== '/newsletter' &&
    !pathname.startsWith('/tools/card-finder');
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-[linear-gradient(180deg,rgba(10,10,15,0.38)_0%,rgba(12,20,22,0.86)_22%,rgba(14,28,29,0.96)_100%)] shadow-[inset_0_1px_0_rgba(45,212,191,0.08)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.10),transparent_72%)]"
      />

      {/* Newsletter */}
      {showFooterNewsletter && (
        <div className="container-page relative border-b border-white/5 py-10">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-teal">Get bonus plays</p>
            <p className="mt-2 text-xs text-text-muted">
              Bonus offers, APY moves, and fee traps to avoid. Never sponsored.
            </p>
            <div className="mt-4">
              <NewsletterSignup source="footer" compact />
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="container-page relative flex flex-col gap-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-heading text-lg text-text-primary">The Stack</div>
          <p className="max-w-xl">
            The rewards site that tells you exactly what to do next, with personalized bonus plans
            for cards and banking.
          </p>
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
