import Link from 'next/link';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/about', label: 'Transparency' },
  { href: '/about', label: 'Contact' }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-[var(--font-heading)] text-lg text-text-primary">The Stack</div>
          <p>Independent card intelligence. No hype, just signal.</p>
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
