'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  activePath?: string;
};

type SubmenuNavItem = {
  href: string;
  label: string;
  description: string;
  activePath: string;
  exact?: boolean;
};

const primaryNavItems: NavItem[] = [
  { href: '/banking', label: 'Bank Accounts' },
  { href: '/business', label: 'Business Accounts' },
  { href: '/blog', label: 'Blog' }
];

const toolNavItems: SubmenuNavItem[] = [
  {
    href: '/tools',
    label: 'All Tools',
    description: 'Browse the full tools directory.',
    activePath: '/tools',
    exact: true
  },
  {
    href: '/tools/card-finder?mode=full',
    label: 'Personalized Bonus Plan',
    description: 'Build a personalized bonus plan.',
    activePath: '/tools/card-finder'
  },
  {
    href: '/cards/compare',
    label: 'Card Comparison Tool',
    description: 'Run year-one and ongoing value math.',
    activePath: '/cards/compare'
  },
  {
    href: '/tools/personal-finance-tracker',
    label: 'Personal Finance Tracker',
    description: 'Download the spreadsheet tracker.',
    activePath: '/tools/personal-finance-tracker'
  },
  {
    href: '/tools/premium-card-calculator',
    label: 'Premium Card Calculator',
    description: 'Run the annual-fee math.',
    activePath: '/tools/premium-card-calculator'
  },
  {
    href: '/tools/card-benefit-calendar',
    label: 'Card Benefit Calendar',
    description: 'Track premium card credits and renewal reminders.',
    activePath: '/tools/card-benefit-calendar'
  },
  {
    href: '/tools/points-advisor',
    label: 'Points Redemption Tool',
    description: 'See the best next move for your points balance.',
    activePath: '/tools/points-advisor'
  }
];

const navPulseClassName = 'animate-[nav-click-pulse_520ms_ease-out]';
const desktopNavLinkClassName = 'relative font-medium transition hover:text-text-primary active:scale-[0.98]';
const desktopNavActiveClassName =
  'text-brand-teal after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-teal after:shadow-[0_0_14px_rgba(45,212,191,0.45)]';
const desktopNavInactiveClassName = 'text-text-secondary';
const menuItemActiveClassName = 'border-brand-teal/35 bg-brand-teal/12 shadow-[inset_0_1px_0_rgba(45,212,191,0.12)]';
const menuItemInactiveClassName = 'border-transparent hover:border-white/10 hover:bg-white/[0.04] active:scale-[0.99]';
const mobileItemActiveClassName = 'border-brand-teal/25 bg-brand-teal/12 text-brand-teal';
const mobileItemInactiveClassName = 'border-transparent text-text-secondary active:scale-[0.99]';

function isItemActive(pathname: string, item: { href?: string; activePath?: string; exact?: boolean }) {
  const target = item.activePath ?? item.href ?? '';
  if (!target) return false;
  return item.exact ? pathname === target : pathname.startsWith(target);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const navCloseTimeoutRef = useRef<number | null>(null);
  const cardCompareActive = pathname === '/cards/compare' || pathname.startsWith('/cards/compare/');
  const cardsActive = pathname.startsWith('/cards') && !cardCompareActive;
  const toolsActive = pathname.startsWith('/tools') || cardCompareActive;

  const closeAll = useCallback(() => {
    setOpen(false);
    setToolsOpen(false);
    setMobileToolsOpen(false);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      if (navCloseTimeoutRef.current) {
        window.clearTimeout(navCloseTimeoutRef.current);
      }
    };
  }, []);

  const triggerNavPulse = useCallback((target: string) => {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }

    setPulseTarget(target);
    pulseTimeoutRef.current = window.setTimeout(() => {
      setPulseTarget(null);
      pulseTimeoutRef.current = null;
    }, 520);
  }, []);

  const getPulseClassName = useCallback(
    (target: string) => (pulseTarget === target ? navPulseClassName : ''),
    [pulseTarget]
  );

  const queueMenuClose = useCallback(() => {
    if (navCloseTimeoutRef.current) {
      window.clearTimeout(navCloseTimeoutRef.current);
    }

    navCloseTimeoutRef.current = window.setTimeout(() => {
      closeAll();
      navCloseTimeoutRef.current = null;
    }, 180);
  }, [closeAll]);

  useEffect(() => {
    if (!open && !toolsOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll();
    }

    function onClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, toolsOpen, closeAll]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/5 bg-[linear-gradient(180deg,rgba(45,212,191,0.08)_0%,rgba(10,10,15,0.92)_62%)] shadow-[inset_0_-1px_0_rgba(45,212,191,0.12)] backdrop-blur-xl"
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide text-text-primary">
          <span className="font-heading text-2xl">The Stack</span>
        </Link>

        <nav className="hidden items-center gap-6 text-lg text-text-secondary md:flex">
          <Link
            href="/cards"
            onClick={() => triggerNavPulse('desktop-cards')}
            className={`${desktopNavLinkClassName} ${getPulseClassName('desktop-cards')} ${
              cardsActive ? desktopNavActiveClassName : desktopNavInactiveClassName
            }`}
          >
            Credit Cards
          </Link>

          {primaryNavItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerNavPulse(`desktop-${item.href}`)}
              className={`${desktopNavLinkClassName} ${getPulseClassName(`desktop-${item.href}`)} ${
                isItemActive(pathname, item) ? desktopNavActiveClassName : desktopNavInactiveClassName
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="relative">
            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              onClick={() => {
                triggerNavPulse('desktop-tools');
                setToolsOpen((current) => !current);
              }}
              className={`${desktopNavLinkClassName} inline-flex items-center gap-2 ${getPulseClassName('desktop-tools')} ${
                toolsActive ? desktopNavActiveClassName : desktopNavInactiveClassName
              }`}
            >
              <span>Tools</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {toolsOpen ? (
              <div
                role="menu"
                className="absolute left-1/2 top-[calc(100%+0.9rem)] z-50 w-[20rem] -translate-x-1/2 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.98),rgba(10,14,24,0.99))] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]" />
                <div className="relative flex flex-col gap-1">
                  {toolNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => {
                        triggerNavPulse(`desktop-menu-${item.activePath}`);
                        queueMenuClose();
                      }}
                      className={`rounded-[1rem] border px-4 py-3 transition ${getPulseClassName(
                        `desktop-menu-${item.activePath}`
                      )} ${
                        isItemActive(pathname, item) ? menuItemActiveClassName : menuItemInactiveClassName
                      }`}
                    >
                      <span className="block text-sm font-semibold text-text-primary">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-text-secondary">{item.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {primaryNavItems.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerNavPulse(`desktop-${item.href}`)}
              className={`${desktopNavLinkClassName} ${getPulseClassName(`desktop-${item.href}`)} ${
                isItemActive(pathname, item) ? desktopNavActiveClassName : desktopNavInactiveClassName
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/tools/card-finder?mode=full"
            className="hidden rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 sm:inline-flex"
          >
            Start My Bonus Plan
          </Link>

          <button
            onClick={() =>
              setOpen((current) => {
                const next = !current;
                setToolsOpen(false);
                setMobileToolsOpen(next && toolsActive);
                return next;
              })
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 md:hidden"
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

      {open ? (
        <nav className="border-t border-white/5 bg-[linear-gradient(180deg,rgba(18,24,27,0.98)_0%,rgba(10,10,15,0.98)_100%)] shadow-[inset_0_1px_0_rgba(45,212,191,0.08)] md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            <Link
              href="/cards"
              onClick={() => {
                triggerNavPulse('mobile-cards');
                queueMenuClose();
              }}
              className={`rounded-xl border px-4 py-3 text-base transition hover:bg-bg-surface hover:text-text-primary ${getPulseClassName(
                'mobile-cards'
              )} ${
                cardsActive ? mobileItemActiveClassName : mobileItemInactiveClassName
              }`}
            >
              Credit Cards
            </Link>

            {primaryNavItems.slice(0, 2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  triggerNavPulse(`mobile-${item.href}`);
                  queueMenuClose();
                }}
                className={`rounded-xl border px-4 py-3 text-base transition hover:bg-bg-surface hover:text-text-primary ${getPulseClassName(
                  `mobile-${item.href}`
                )} ${
                  isItemActive(pathname, item) ? mobileItemActiveClassName : mobileItemInactiveClassName
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="rounded-xl border border-white/8 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => {
                  triggerNavPulse('mobile-tools');
                  setMobileToolsOpen((current) => !current);
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-base transition hover:bg-bg-surface hover:text-text-primary ${getPulseClassName(
                  'mobile-tools'
                )} ${
                  toolsActive ? mobileItemActiveClassName : mobileItemInactiveClassName
                }`}
                aria-expanded={mobileToolsOpen}
              >
                <span>Tools</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {mobileToolsOpen ? (
                <div className="mx-4 mb-3 flex flex-col gap-1 border-l border-white/10 pl-3">
                  {toolNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        triggerNavPulse(`mobile-menu-${item.activePath}`);
                        queueMenuClose();
                      }}
                      className={`rounded-xl border px-4 py-3 text-base transition hover:bg-bg-surface hover:text-text-primary ${getPulseClassName(
                        `mobile-menu-${item.activePath}`
                      )} ${
                        isItemActive(pathname, item) ? mobileItemActiveClassName : mobileItemInactiveClassName
                      }`}
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-text-muted">{item.description}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {primaryNavItems.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  triggerNavPulse(`mobile-${item.href}`);
                  queueMenuClose();
                }}
                className={`rounded-xl border px-4 py-3 text-base transition hover:bg-bg-surface hover:text-text-primary ${getPulseClassName(
                  `mobile-${item.href}`
                )} ${
                  isItemActive(pathname, item) ? mobileItemActiveClassName : mobileItemInactiveClassName
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/tools/card-finder?mode=full"
              onClick={queueMenuClose}
              className="mt-2 rounded-full bg-brand-teal px-4 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start My Bonus Plan
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
