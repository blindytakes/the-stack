import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { ProofPoints } from '@/components/proof-points';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Learn how to make the most of your money with practical card and banking strategies.';

const tools = [
  {
    tag: 'Plan',
    title: 'Payout Planner',
    description: 'A five-step flow that maps your next best offers based on your profile.',
    href: '/tools/card-finder',
    color: 'text-brand-teal',
    soon: false
  },
  {
    tag: 'Recover',
    title: 'Hidden Benefits',
    description: 'Find credits and protections you are not using, with yearly value estimates.',
    href: '/tools/hidden-benefits',
    color: 'text-brand-gold',
    soon: false
  },
  {
    tag: 'Compare',
    title: 'Offer vs Offer',
    description: 'Head-to-head net-value breakdowns on bonuses, fees, rewards, and benefits.',
    href: '/tools/card-vs-card',
    color: 'text-brand-coral',
    soon: false
  }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'The Stack',
      url: SITE_URL,
      description: SITE_DESCRIPTION
    },
    {
      '@type': 'Organization',
      name: 'The Stack',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
        width: 512,
        height: 512
      }
    }
  ]
};

export default function HomePage() {
  return (
    <div className="container-page pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'homepage', path: '/' }}
      />
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold md:text-lg">
            The Stack
          </p>
          <h1 className="font-heading text-4xl leading-tight text-text-primary md:text-6xl lg:text-[66px]">
            Make the Banks Work for You.
          </h1>
          <p className="max-w-[45ch] text-xl font-medium leading-relaxed text-text-secondary md:text-2xl">
            Banks and card issuers are built to profit off you. The Stack helps you flip that
            dynamic with better offers, clear math, and practical next moves.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tools/card-finder"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-teal px-7 py-3 text-base font-semibold text-black shadow-[0_12px_30px_rgba(45,212,191,0.18)] transition-all duration-200 hover:scale-105 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:px-8 md:py-3.5 md:text-lg"
            >
              <span>Start My Bonus Plan</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
              >
                <path
                  d="M3.5 8h8m0 0-3-3m3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(212,168,83,0.12),transparent_38%)]" />
          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Bonus Tracker</p>
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
                    Never Miss a Payout.
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary md:text-base">
                    Track your spend, stay ahead of the deadline, and keep the payout in view.
                  </p>
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm font-semibold text-brand-teal shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                80% complete
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-text-muted">Target bonus</p>
                  <p className="mt-2 font-heading text-4xl text-text-primary">$500</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-text-muted">Current progress</p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">$400 / $500</p>
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[0_0_24px_rgba(45,212,191,0.4)]" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-text-muted">
                <span>Applied</span>
                <span>On track</span>
                <span>Unlocked</span>
              </div>
            </div>

            <div className="hidden gap-3 lg:grid lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Spend left</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">$100</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Time window</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">18 days</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Estimated payout</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">$500</p>
              </div>
            </div>

            <Link
              href="/tools/card-finder"
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-teal transition hover:translate-x-1 hover:text-brand-teal/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span>See your own progress map</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
              >
                <path
                  d="M3.5 8h8m0 0-3-3m3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <ProofPoints className="mt-12" variant="trust-bar" />

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {tools.map((tool, index) => (
          <RevealOnScroll key={tool.title} className="h-full" delayMs={index * 80}>
            <Link
              href={tool.href}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
            >
              <p className={`text-xs uppercase tracking-[0.25em] ${tool.color}`}>{tool.tag}</p>
              <h3 className="mt-4 text-xl font-semibold">{tool.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{tool.description}</p>
              {tool.soon && (
                <span className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-text-muted">
                  Coming soon
                </span>
              )}
            </Link>
          </RevealOnScroll>
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
          <NewsletterSignup
            source="homepage"
            eyebrow="Free Weekly Newsletter"
            heading="Join Strategic Spenders."
            description="One useful email each week with the best offers worth your time, mistakes to avoid, and one clear next move."
            finePrint="Free. No spam. Unsubscribe anytime."
            submitLabel="Join Free"
          />
        </div>
      </section>
    </div>
  );
}
