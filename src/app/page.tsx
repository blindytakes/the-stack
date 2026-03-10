import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { ProofPoints } from '@/components/proof-points';
import { ProofResultsRail } from '@/components/proof-results-rail';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Build a personalized 12-month card and bank bonus plan with practical next-step guidance.';

const planOutcomes = [
  {
    title: 'Ordered next steps',
    description: 'Know what to do first, what comes next, and what can wait.'
  },
  {
    title: '12-month value estimate',
    description: 'See the grounded upside before you apply, not just the headline bonus.'
  },
  {
    title: 'Realistic pace',
    description: 'Move through offers on a timeline you can actually complete.'
  }
] as const;

const faqs = [
  {
    question: 'Is The Stack free?',
    answer:
      'Yes. The planner and comparison tools are free to use. You can run the quiz, review your results, and explore the site without paying.'
  },
  {
    question: 'How long does the planner take?',
    answer:
      'About 2 minutes for most people. We ask enough to make the recommendations useful without turning it into a long intake form.'
  },
  {
    question: 'Does the planner cover bank bonuses too?',
    answer:
      'Yes. The full planner can include both card bonuses and bank bonuses when they fit your profile and timing.'
  },
  {
    question: 'Do I need excellent credit?',
    answer:
      'No. Some offers are best for excellent credit, but the planner also filters for what is more realistic based on the credit profile you choose.'
  },
  {
    question: 'How do you estimate value?',
    answer:
      'We use the bonus value, annual fee, and practical assumptions around offer quality and fit so the ranking is more grounded than a raw points headline.'
  },
  {
    question: 'Will applying hurt my credit?',
    answer:
      'New applications can create a small temporary dip, so this is best used by people who already pay on time and are comfortable opening accounts deliberately.'
  },
  {
    question: 'Do I need a spreadsheet to use this?',
    answer:
      'No. The point is to give you a clearer plan without making you build your own spreadsheet first.'
  }
] as const;

const howItWorksSteps = [
  {
    step: '01',
    title: 'Answer a few questions',
    description: 'Tell us about your spending habits and goals. Takes about 2 minutes.'
  },
  {
    step: '02',
    title: 'Get your personalized plan',
    description:
      'We rank the strongest card and bank offers you can realistically complete and put them in order.'
  },
  {
    step: '03',
    title: 'Follow the order and execute',
    description:
      'Know what to apply for first, what can wait, and when to compare options before you move.'
  }
] as const;

const resultsStories = [
  {
    metric: '$3,200',
    headline: 'Earned in year one',
    name: 'Jamie R.',
    summary:
      'Started with no prior strategy and used a simple two-move plan matched to real spending.',
    tags: ['Beginner profile', 'Travel goal', '2-card plan'],
    setup: 'Started from scratch'
  },
  {
    metric: '60 days',
    headline: 'First bonus unlocked',
    name: 'Marcus T.',
    summary:
      'Started with the highest-fit first move instead of jumping into an aggressive setup.',
    tags: ['No prior strategy', 'Single-card start', 'Clear approval target'],
    setup: 'Low-friction first move'
  },
  {
    metric: '$1,500',
    headline: 'Earned in 4 months',
    name: 'Priya S.',
    summary:
      'Followed the recommended order and picked up two bonuses without over-optimizing.',
    tags: ['2 bonuses completed', 'Order-first plan', 'Busy schedule'],
    setup: 'Followed the sequence'
  },
  {
    metric: '3 moves',
    headline: 'Planned across 12 months',
    name: 'Evan L.',
    summary:
      'Used the planner to spread applications across a realistic pace instead of bunching them up.',
    tags: ['Paced timeline', 'Lower stress', 'Bank + card mix'],
    setup: 'Built around timing'
  },
  {
    metric: '$900',
    headline: 'Bank bonus in 45 days',
    name: 'Nina P.',
    summary:
      'Started with banking first because it fit her cash goal and current spending better than a new card.',
    tags: ['Bank-first move', 'Cash goal', 'Low spend required'],
    setup: 'Swapped the order'
  },
  {
    metric: '2 bonuses',
    headline: 'Completed without overlap',
    name: 'Leo C.',
    summary:
      'Spaced deadlines instead of stacking them, which made the tracking manageable with a busy work schedule.',
    tags: ['Cleaner pacing', 'Less tracking', 'Busy schedule'],
    setup: 'Avoided overlap'
  },
  {
    metric: '$2,050',
    headline: 'Earned in 9 months',
    name: 'Sara D.',
    summary:
      'Used a mixed card and bank path built around bills she already had instead of inventing spend.',
    tags: ['Mixed plan', 'Existing bills', 'Travel + cash'],
    setup: 'Matched existing spend'
  }
] as const;

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
            Banks and card issuers are built to profit off you. The Stack flips that, for free.
            Answer a few questions and get a personalized bonus plan that ranks the best next card
            and bank offers for your profile, then shows you what to do first.
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
          <p className="text-sm font-medium text-text-muted">
            Free. Takes about 2 minutes. No spreadsheet required.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(212,168,83,0.12),transparent_38%)]" />
          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sample Plan</p>
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
                    See your next two moves.
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary md:text-base">
                    A short quiz turns your profile into a ranked 12-month plan with cleaner math,
                    realistic timing, and a clear starting point.
                  </p>
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm font-semibold text-brand-teal shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                2 min quiz
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-text-muted">12-month value est.</p>
                  <p className="mt-2 font-heading text-4xl text-text-primary">$2,150</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-text-muted">Start now</p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">Travel card bonus</p>
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[0_0_24px_rgba(45,212,191,0.4)]" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-text-muted">
                <span>Start now</span>
                <span>Next</span>
                <span>Later</span>
              </div>
            </div>

            <div className="hidden gap-3 lg:grid lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">First move</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">Card bonus</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Next move</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">Bank bonus</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Pace</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">3 moves / 12 mo</p>
              </div>
            </div>

            <Link
              href="/tools/card-finder"
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-teal transition hover:translate-x-1 hover:text-brand-teal/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span>Build your own plan</span>
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

      <section className="mt-16 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,35,0.92),rgba(8,10,18,0.96))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
        <div className="max-w-3xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            How it works
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
              Three steps to your first bonus.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-text-secondary md:text-base">
              The planner is meant to reduce guesswork. First it figures out what fits. Then it
              gives you an ordered plan, a grounded value estimate, and a pace you can actually
              follow.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {howItWorksSteps.map((item) => (
            <div
              key={item.step}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-4xl text-brand-teal">{item.step}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-text-muted">
                  Step {item.step}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-text-primary">{item.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-brand-teal/15 bg-brand-teal/[0.05] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xs">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-teal">
                What you leave with
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                A usable plan, not just a ranked list. The value is in the recommendation and the
                order.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:flex-1">
              {planOutcomes.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-white/10 bg-black/15 px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">Output</p>
                  <h3 className="mt-2 text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
                Real results
              </p>
              <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
                Outcomes from real plans.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
                Real examples of what happened when people followed a clear order instead of
                guessing their way through offers.
              </p>
            </div>
          </div>
          <ProofResultsRail stories={resultsStories} />
        </div>
      </section>

      <section className="mt-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">FAQ</p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Questions people usually have before they start.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
              Short answers to the main objections: price, time, credit, and what kind of plan
              you actually get at the end.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/10 bg-bg-surface p-5 open:border-brand-teal/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-text-primary">
                  <span>{item.question}</span>
                  <span className="text-brand-teal transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-7 text-text-secondary">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 md:p-10">
          <NewsletterSignup
            source="homepage"
            heading="Get Weekly Bonus Plays."
            description="Get the best offers worth your attention, practical strategy, and product updates in your inbox."
            finePrint="Free. No spam. Unsubscribe anytime."
            submitLabel="Join Free"
          />
        </div>
      </section>
    </div>
  );
}
