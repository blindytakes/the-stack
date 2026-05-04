import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Use The Stack tools to build a bonus plan, compare offers, track spending, and run the premium card calculator.'
};

const toolCards = [
  {
    href: '/tools/card-finder?mode=full',
    title: 'Personalized Bonus Plan',
    description: 'Build a personalized bonus plan that combines both credit cards and banking accounts',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  },
  {
    href: '/cards/compare',
    title: 'Card Comparison Tool',
    description: 'Run year-one and ongoing value math for any two cards under your own spend assumptions.',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  },
  {
    href: '/tools/personal-finance-tracker',
    title: 'Personal Finance Tracker',
    description: 'Download a spreadsheet tracker to log spending, bills, savings goals, and monthly cash flow.',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  },
  {
    href: '/tools/premium-card-calculator',
    title: 'Premium Card Calculator',
    description: 'Run the real math on Amex Platinum, Sapphire Reserve, and Venture X.',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  },
  {
    href: '/tools/card-benefit-calendar',
    title: 'Card Benefit Calendar',
    description: 'Create calendar reminders for credits, bonus deadlines, annual fees, and renewal decisions.',
    accentClassName: 'from-[#d4a853]/18 via-[#d4a853]/6 to-transparent'
  },
  {
    href: '/tools/points-advisor',
    title: 'Points Redemption Tool',
    description:
      'Enter your balance, compare ranked redemption paths, and price a real trip before you transfer points.',
    accentClassName: 'from-[#d6e5ff]/18 via-[#d6e5ff]/6 to-transparent'
  }
] as const;

export default function ToolsPage() {
  return (
    <div className="container-page min-h-[calc(100vh-4rem)] pt-12">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative max-w-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">The Stack Tools</p>
          <h1 className="mt-4 font-heading text-[clamp(2.35rem,4.7vw,4.8rem)] leading-[0.94] tracking-[-0.04em] text-text-primary md:whitespace-nowrap">
            Tools for Stacking Your Money
          </h1>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2">
          {toolCards.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,21,34,0.98),rgba(10,14,24,0.98))] p-5 transition hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(18,25,40,0.98),rgba(12,17,29,0.99))]"
            >
              <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_18%,transparent_18%)]`} />
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.accentClassName} opacity-100`} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
              <div className="relative">
                <h2 className="font-heading text-[1.9rem] leading-[1] tracking-[-0.03em] text-text-primary">
                  {tool.title}
                </h2>
                <p className="mt-3 max-w-[28rem] text-sm leading-6 text-text-secondary">
                  {tool.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <span>Open {tool.title}</span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
