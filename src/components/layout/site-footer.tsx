import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
  { href: '/contact', label: 'Contact' },
  { href: '/methodology', label: 'Methodology' }
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5">
      {/* Newsletter */}
      <div className="container-page border-b border-white/5 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-text-primary">Get weekly card intel</p>
            <p className="mt-1 text-xs text-text-muted">No spam. Unsubscribe anytime.</p>
          </div>
          <div className="w-full md:max-w-md">
            <NewsletterSignup source="footer" compact />
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-[var(--font-heading)] text-lg text-text-primary">The Stack</div>
          <p>Independent card intelligence. No hype, just signal.</p>
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
