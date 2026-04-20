import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Use The Stack tools to build a bonus plan, compare offers, uncover hidden benefits, and run the premium card calculator.'
};

const toolCards = [
  {
    href: '/tools/card-finder?mode=full',
    eyebrow: 'Planning',
    title: 'Card Finder',
    description:
      'Build a personalized bonus plan around your spend capacity, deposit access, current accounts, and timing.',
    accentClassName: 'from-brand-teal/20 via-brand-teal/8 to-transparent'
  },
  {
    href: '/cards/compare',
    eyebrow: 'Compare',
    title: 'Compare Cards',
    description: 'Run year-one and ongoing value math for any two cards under your own spend assumptions.',
    accentClassName: 'from-brand-gold/20 via-brand-gold/7 to-transparent'
  },
  {
    href: '/tools/card-vs-card',
    eyebrow: 'Tracker',
    title: 'Personal Finance Tracker',
    description: 'Download a spreadsheet tracker to log spending, bills, savings goals, and monthly cash flow.',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  },
  {
    href: '/tools/hidden-benefits',
    eyebrow: 'Benefits',
    title: 'Hidden Benefits',
    description: 'Find the less-obvious protections, credits, and perks attached to your card.',
    accentClassName: 'from-brand-coral/18 via-brand-coral/7 to-transparent'
  },
  {
    href: '/tools/premium-card-calculator',
    eyebrow: 'Premium',
    title: 'Premium Card Calculator',
    description: 'Run the real math on Amex Platinum, Sapphire Reserve, and Venture X.',
    accentClassName: 'from-[#5ae0ff]/18 via-[#5ae0ff]/6 to-transparent'
  }
] as const;

export default function ToolsPage() {
  return (
    <div className="container-page min-h-[calc(100vh-4rem)] pt-12">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">The Stack Tools</p>
          <h1 className="mt-4 font-heading text-[clamp(2.7rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.04em] text-text-primary">
            Run the numbers before you make the move
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-7 text-text-secondary">
            Use the calculators and comparison tools to pressure-test an offer, compare cards, and
            see where premium products actually clear the fee.
          </p>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">{tool.eyebrow}</p>
                <h2 className="mt-3 font-heading text-[1.9rem] leading-[1] tracking-[-0.03em] text-text-primary">
                  {tool.title}
                </h2>
                <p className="mt-3 max-w-[28rem] text-sm leading-6 text-text-secondary">
                  {tool.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <span>Open tool</span>
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
