import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { ProofPoints } from '@/components/proof-points';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Build a personalized 12-month card and bank bonus plan with practical next-step guidance.';

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
    description:
      'We ask about your monthly spend, credit range, and whether you prefer cash or travel rewards. Nothing sensitive.'
  },
  {
    step: '02',
    title: 'Get a ranked plan',
    description:
      'You get a list of 3–5 moves with net bonus value, spend requirements, and the order to apply in.'
  },
  {
    step: '03',
    title: 'Execute with confidence',
    description:
      'Each move shows the application link, the deadline window, and what to tackle next once you\u2019re approved.'
  }
] as const;

const methodologyCards = [
  {
    title: 'Profile-first ranking',
    description:
      'Your spending, goals, and credit profile drive the order — not a generic list. Two people get different plans.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4.5 14.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15.5 6.5 17 8l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Real net value',
    description:
      'Bonus value minus annual fee, weighted by what you\'d actually earn. No inflated point valuations.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 8v4m-1.5-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Sequenced for approval',
    description:
      'Cards ordered by approval likelihood and bonus deadlines so you don\'t waste a hard pull on a long shot.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 6h8M6 10h6M6 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 10l-1.5 1.5L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Cyclical offer tracking',
    description:
      'We track bonuses that come and go. When a strong offer returns or is about to expire, your plan reflects it.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M14.5 5.5A6 6 0 1 0 16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.5 2.5v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
] as const;

const privacyPoints = [
  {
    label: 'No SSN Required',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M10 2.5 4 5.5v4c0 4.14 2.56 7.02 6 8 3.44-.98 6-3.86 6-8v-4L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m7.5 10 1.5 1.5L12 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'No Bank Login',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="4.5" y="9" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: 'No Credit Card #s',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 9h15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 16 16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: 'No Data Shared',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 17 17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
] as const;

const examplePlans = [
  {
    profile: 'The Starter',
    metric: '$1,800',
    period: 'Est. 12-month value',
    description:
      'First-time optimizer with moderate spend. One travel card bonus plus one bank bonus, paced over six months.',
    tags: ['Beginner', 'Travel goal', '2 moves']
  },
  {
    profile: 'The Travel Hacker',
    metric: '$4,200',
    period: 'Est. 12-month value',
    description:
      'Experienced with points and higher spend. Three card bonuses sequenced by approval windows and deadlines.',
    tags: ['Experienced', 'Points maximizer', '4 moves']
  },
  {
    profile: 'The Cash-Back Hunter',
    metric: '$2,600',
    period: 'Est. 12-month value',
    description:
      'Prefers cash over points. Mixed card and bank bonus plan built around bills already being paid.',
    tags: ['Cash preference', 'Existing bills', '3 moves']
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
            The Stack Bonus Plan
          </p>
          <h1 className="font-heading text-4xl leading-tight text-text-primary md:text-6xl lg:text-[66px]">
            Make the banks work for you.
          </h1>
          <p className="max-w-[48ch] text-xl font-medium leading-relaxed text-text-secondary md:text-2xl">
            Take a 2-minute quiz and get a sequenced list of your top card and bank bonus moves —
            with timing, value estimates, and where to apply first.
          </p>
          <p className="text-base leading-7 text-text-secondary md:text-lg">
            Most sites rank cards. <span className="font-semibold text-text-primary">The Stack builds your plan.</span>
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tools/card-finder?mode=full"
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
              href="/tools/card-finder?mode=full"
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

      <section className="mt-16">
        <div className="max-w-3xl">
          <p className="text-base leading-7 text-text-secondary md:text-lg">
            Card catalogs show you options.{' '}
            <span className="font-semibold text-text-primary">The Stack shows you what to do next.</span>
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,35,0.92),rgba(8,10,18,0.96))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
          <div className="max-w-3xl">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
              How it works
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
                Three steps to your first bonus.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-text-secondary md:text-base">
                Tell us what fits, get a ranked 12-month plan, and follow the right order.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {howItWorksSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-heading text-4xl text-brand-teal">{item.step}</p>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-text-muted">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Rank */}
      <section className="mt-14 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,35,0.92),rgba(8,10,18,0.96))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
        <div className="max-w-3xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            Our Methodology
          </p>
          <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
            How The Stack works for you.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
            Most reward sites rank cards by what pays them the highest commission. The Stack ranks
            by what actually fits your profile — your spend, your goals, your approval odds.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {methodologyCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-brand-teal">
                {card.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy reassurance */}
      <div className="mt-10 flex items-center justify-center gap-x-10 gap-y-4">
        {privacyPoints.map((point) => (
          <div key={point.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
              {point.icon}
            </div>
            <p className="text-xl font-medium text-text-primary md:text-2xl">{point.label}</p>
          </div>
        ))}
      </div>

      {/* Example Plans */}
      <section className="mt-14 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,30,0.92),rgba(7,9,16,0.98))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
        <div className="max-w-2xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            Example Plans
          </p>
          <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
            What a plan looks like for you.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
            Here&apos;s what a plan looks like for three common profiles.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {examplePlans.map((plan) => (
            <div
              key={plan.profile}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">
                  Example plan
                </p>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  {plan.tags[0]}
                </span>
              </div>
              <p className="mt-4 font-heading text-4xl text-text-primary">{plan.metric}</p>
              <p className="mt-1 text-sm text-text-muted">{plan.period}</p>
              <p className="mt-4 text-sm leading-7 text-text-secondary">{plan.description}</p>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-teal">
                  {plan.tags.slice(1).join(' · ')}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{plan.profile}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">FAQ</p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/10 bg-bg-surface p-5 open:border-brand-teal/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-text-primary md:text-xl">
                  <span>{item.question}</span>
                  <span className="text-brand-teal transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pr-8 text-base leading-8 text-text-secondary md:text-lg">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <h2 className="font-heading text-3xl text-text-primary md:text-4xl">Get Bonus Plays</h2>
        <p className="mx-auto mt-3 max-w-none text-lg text-text-secondary md:text-xl lg:whitespace-nowrap">
          Bonus offers, timing tips, and free tools. Curated, not sponsored.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <NewsletterSignup source="homepage" compact size="large" />
        </div>
      </section>

      <section className="mt-12 text-center">
        <Link
          href="/tools/card-finder?mode=full"
          className="inline-flex items-center justify-center rounded-full bg-brand-teal px-7 py-3 text-base font-semibold text-black shadow-[0_12px_30px_rgba(45,212,191,0.18)] transition-all duration-200 hover:scale-105 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:px-8 md:py-3.5 md:text-lg"
        >
          Start My Bonus Plan
        </Link>
      </section>
    </div>
  );
}
