import Link from 'next/link';

const navItems = [
  { href: '/tools/card-finder', label: 'Card Finder' },
  { href: '/cards', label: 'Cards' },
  { href: '/learn', label: 'Learn' },
  { href: '/about', label: 'About' }
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide text-text-primary">
          <span className="font-[var(--font-heading)] text-2xl">The Stack</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-text-secondary md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tools/card-finder"
          className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Find a Card
        </Link>
      </div>
    </header>
  );
}
