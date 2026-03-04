import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';

const highlights = [
  {
    title: 'Earn more',
    copy: 'Target sign-up bonuses, rewards, and promo value with transparent math.'
  },
  {
    title: 'Keep more',
    copy: 'Avoid interest and fee traps with pay-in-full rules and better account decisions.'
  },
  {
    title: 'Grow more',
    copy: 'Build credit and cash flow systems that improve your yearly net value.'
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
      url: 'https://thestackhq.com',
      description:
        'Make the banks work for you with transparent bonus strategy, banking plays, and payout math.'
    },
    {
      '@type': 'Organization',
      name: 'The Stack',
      url: 'https://thestackhq.com'
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
          <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">The Stack</p>
          <h1 className="font-heading text-4xl leading-tight text-text-primary md:text-6xl">
            Make the Banks Work for You.
          </h1>
          <p className="max-w-xl text-lg text-text-secondary">
            Use a disciplined bonus and banking strategy to capture up to $3,000/year in value.
            No debt games. No mystery logic.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/card-finder">
              <Button>Build My Bonus Plan</Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost">Read the money playbooks</Button>
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            Results vary by credit profile, available offers, spend, and redemption choices.
          </p>
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
            heading="Get Weekly Payout Plays + Optional 1:1 Strategy Session"
            description="Join a free newsletter built to help you make better card and banking decisions with less guesswork."
            valueBullets={[
              'Best current offers that are actually worth your time',
              'Fee traps and mistakes to avoid before you apply',
              'One practical action step each week'
            ]}
            showConsultationOption
            consultationSource="homepage_consultation"
            consultationLabel="I am interested in a 1:1 strategy consultation."
            finePrint="Free newsletter. Unsubscribe anytime. Consultations are educational only and not individualized financial advice."
          />
        </div>
      </section>
    </div>
  );
}
