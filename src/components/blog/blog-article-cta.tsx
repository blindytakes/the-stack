import Link from 'next/link';

export function BlogArticleCTA() {
  return (
    <section className="relative mt-16 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-teal/10 via-bg-elevated to-bg-surface p-8 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_40%)]" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Take Action</p>
        <h2 className="mt-3 font-heading text-2xl text-text-primary md:text-3xl">
          Put this into action
        </h2>
        <p className="mt-3 max-w-lg text-base text-text-secondary">
          Turn what you just read into your next move. Build a personalized bonus plan or compare
          two cards head-to-head.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/tools/card-finder?mode=full"
            className="inline-flex items-center justify-center rounded-full bg-brand-teal px-7 py-3 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Build Your Bonus Plan
          </Link>
          <Link
            href="/cards/compare"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-7 py-3 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Compare Cards
          </Link>
        </div>
        <div className="mt-4">
          <Link
            href="/tools/premium-card-calculator"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <span>Running the numbers on Platinum, Reserve, or Venture X?</span>
            <span className="text-brand-teal">Open the Premium Card Calculator</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
