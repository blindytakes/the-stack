'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/tools/card-finder', label: 'Card Finder' },
  { href: '/cards', label: 'Cards' },
  { href: '/learn', label: 'Learn' },
  { href: '/about', label: 'About' }
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    function onClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, close]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide text-text-primary">
          <span className="font-[var(--font-heading)] text-2xl">The Stack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-6 text-sm text-text-secondary md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition hover:text-text-primary ${
                pathname.startsWith(item.href) ? 'text-text-primary' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/tools/card-finder"
            className="hidden rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 sm:inline-flex"
          >
            Find a Card
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-primary">
              {open ? (
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-white/5 bg-bg-elevated md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm transition hover:bg-bg-surface ${
                  pathname.startsWith(item.href) ? 'text-text-primary bg-bg-surface' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/tools/card-finder"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-brand-teal px-4 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
            >
              Find a Card
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
