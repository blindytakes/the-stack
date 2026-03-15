import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { CustomerReviewsRail } from '@/components/customer-reviews-rail';
import { ProofPoints } from '@/components/proof-points';
import { SamplePlanCarousel } from '@/components/sample-plan-carousel';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Build a personalized 6-month card and bank bonus plan with practical next-step guidance.';

const faqs = [
  {
    question: 'Is The Stack free?',
    answer:
      'Yes, the site, the Bonus Planner, and the comparison tools are free to use. You can run the quiz, review your results, and explore the site without paying a fee.'
  },
  {
    question: 'How long does the Bonus Planner take?',
    answer:
      'About 2 minutes for most people. We ask enough to make the recommendations useful without turning it into a long intake form.'
  },
  {
    question: 'Does the Bonus Planner cover bank bonuses too?',
    answer:
      'Yes. The full Bonus Planner can include both card bonuses and bank account bonuses when they fit your profile and timing.'
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
      'New applications can create a small temporary dip, so the Bonus Planner is best used by people who already pay on time and are comfortable opening accounts deliberately to earn sign-up bonuses and reward points.'
  },
  {
    question: 'Do I need a spreadsheet to use this?',
    answer:
      'No. The point of the Bonus Planner is to give you a clearer plan without having to maintain your own spreadsheet.'
  }
] as const;

const howItWorksSteps = [
  {
    step: '01',
    title: 'Answer a few questions',
    description:
      'Answer 4-5 quick questions about your cards, spend, and credit. No SSN, bank login, or card numbers.'
  },
  {
    step: '02',
    title: 'Get a ranked plan',
    description:
      'See your best next moves ranked in order. We show bonus value, the spend needed to earn it, and which one to start with.'
  },
  {
    step: '03',
    title: 'Execute with confidence',
    description:
      'Open the right offer at the right time. Each move shows where to apply, what deadline matters, and what to do after approval.'
  }
] as const;

const differentiationCards = [
  {
    title: 'Tangible value, not hype',
    description:
      'We show bonus value minus fees and realistic estimates — not inflated point valuations that never cash out.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 8v4m-1.5-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Ranked for your profile',
    description:
      'Your spend, goals, and credit profile shape the plan so it reflects what you can actually hit.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4.5 14.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15.5 6.5 17 8l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Sequenced with timing in mind',
    description:
      'Moves are ordered by issuer rules, approval logic, and deadlines so you do not waste applications.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 6h8M6 10h6M6 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 10l-1.5 1.5L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Tracks offers that come and go',
    description:
      'When a strong offer returns or is about to expire, your plan adjusts.',
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

const sampleReviews = [
  {
    name: 'Ashley P.',
    quote:
      'I was overwhelmed by card lists. The Stack gave me a clear order, and I ended up earning just over $3,000 in my first 12 months.',
    result: '$3,000+ in the first year',
    detail: 'Travel goal · first year using bonuses'
  },
  {
    name: 'Marcus T.',
    quote:
      'I had a rough idea of what cards I wanted, but no idea what order to open them in. The Stack laid it out step by step with deadlines I could actually follow.',
    result: 'Clear sequencing for 4 moves',
    detail: 'Already had a few cards · wanted better order'
  },
  {
    name: 'Priya R.',
    quote:
      'I liked that it included a bank bonus too. It felt like an actual plan, and I did not need a spreadsheet to keep up with it.',
    result: 'No spreadsheet needed',
    detail: 'Cash + travel mix · wanted something simple'
  },
  {
    name: 'Daniel K.',
    quote:
      'Most sites just throw the biggest offers at you. This was the first tool that adjusted the order based on my credit and what I could realistically hit.',
    result: 'Better sequencing',
    detail: 'Good credit · moderate monthly spend'
  },
  {
    name: 'Lauren S.',
    quote:
      'I used to spend hours comparing cards in browser tabs. This just told me which one to get now and which to wait on. Saved me a ton of time.',
    result: 'Replaced hours of research',
    detail: 'First time stacking bonuses'
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
          <p className="text-base font-medium text-text-muted md:text-lg">
            Credit card and bank bonuses. One plan. The right order.
          </p>
        </div>
        <SamplePlanCarousel />
      </section>

      <ProofPoints className="mt-12" variant="trust-bar" />

      <section className="mt-14">
        <div className="border-y border-white/10 px-8 py-6 md:px-10 md:py-8">
          <p className="max-w-3xl text-left text-2xl font-medium leading-tight text-text-secondary md:text-3xl lg:text-[2rem]">
            <span className="block">Other credit card sites list options with no plan.</span>
            <span className="mt-2 block font-semibold text-text-primary">
              The Stack gives you a step-by-step plan.
            </span>
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,35,0.92),rgba(8,10,18,0.96))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
          <div className="max-w-3xl">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
              How it works
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
                Three steps to your first bonus.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-text-secondary md:text-base">
                Tell us what fits, get a ranked 6-month plan, and follow the right order.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {howItWorksSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6"
              >
                <p className="font-heading text-4xl text-brand-teal">{item.step}</p>
                <h3 className="mt-5 text-xl font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why The Stack Is Different */}
      <section className="mt-14 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,35,0.92),rgba(8,10,18,0.96))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
        <div className="max-w-3xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            Why The Stack Is Different
          </p>
          <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
            A better way to choose your next bonus.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
            Most credit card sites rank offers by the biggest headline number. The Stack ranks them
            by tangible value, fit, and timing.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {differentiationCards.map((card) => (
            <div
              key={card.title}
              className="h-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-7"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-brand-teal">
                {card.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-text-primary">{card.title}</h3>
              <p className="mt-3 max-w-[34ch] text-sm leading-7 text-text-secondary">
                {card.description}
              </p>
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

      {/* Reviews */}
      <section className="mt-14 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,30,0.92),rgba(7,9,16,0.98))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:p-10">
        <div className="max-w-2xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            Reviews
          </p>
          <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
            What people think of the plan.
          </h2>
        </div>
        <CustomerReviewsRail reviews={sampleReviews} />
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
