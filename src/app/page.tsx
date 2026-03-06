import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { ProofPoints } from '@/components/proof-points';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Learn how to make the most of your money with practical card and banking strategies.';

const highlights = [
  {
    title: 'Your plan',
    copy: 'Build a card and bank bonus schedule that fits your spending and timing.'
  },
  {
    title: 'Real value',
    copy: 'See the real value after fees, credits, and fine print.'
  },
  {
    title: 'Next move',
    copy: 'Know what to apply for now, what to skip, and what to do next.'
  }
];

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
          <h1 className="font-heading text-4xl leading-tight text-text-primary md:text-6xl">
            Make the Banks Work for You.
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-text-secondary md:text-2xl">
            Banks and card issuers are built to profit off you. The Stack helps you flip that
            dynamic with better offers, clear math, and practical next moves.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/card-finder">
              <Button className="px-7 py-3 text-base md:px-8 md:py-3.5 md:text-lg">
                Start My Bonus Plan
              </Button>
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 shadow-[0_0_45px_rgba(45,212,191,0.08)]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">How it works</p>
            <div className="space-y-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/5 bg-bg-surface p-4">
                  <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProofPoints className="mt-16" />

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
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
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
          <NewsletterSignup
            source="homepage"
            eyebrow="Free Weekly Newsletter"
            heading="Get Weekly Payout Plays"
            description="One useful email each week with the best offers worth your time, mistakes to avoid, and one clear next move."
            finePrint="Free. No spam. Unsubscribe anytime."
            submitLabel="Join Free"
          />
        </div>
      </section>
    </div>
  );
}
