import Link from 'next/link';
import type { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter-signup';

const tools = [
  {
    tag: 'Plan',
    title: 'Payout Planner',
    description: 'Build a card and bank bonus schedule that fits your spending and timeline.',
    href: '/tools/card-finder',
    color: 'text-brand-teal'
  },
  {
    tag: 'Compare',
    title: 'Offer vs Offer',
    description: 'Compare offers and track real net value after fees, credits, and deadlines.',
    href: '/tools/card-vs-card',
    color: 'text-brand-coral'
  },
  {
    tag: 'Learn',
    title: 'Playbooks',
    description: 'Avoid costly mistakes like missed bonus windows, weak redemptions, and fee traps.',
    href: '/blog',
    color: 'text-brand-gold'
  }
];

const stats = [
  { value: '10+', label: 'Years of experience' },
  { value: '200+', label: 'Cards tracked' },
  { value: '100+', label: 'Banks monitored' },
  { value: '$0', label: 'Cost to you' }
];

const principles = [
  {
    label: 'Net value scoring',
    detail: 'We rank by your expected outcome, not by commission rate.'
  },
  {
    label: 'Fee drag penalty',
    detail: 'Annual fees reduce a card\u2019s score unless benefits clearly offset them.'
  },
  {
    label: 'Credit realism',
    detail: 'We discount credits most people won\u2019t fully use.'
  },
  {
    label: 'Transparent math',
    detail: 'Every assumption is visible in our card guides and comparison tools.'
  }
];

export const metadata: Metadata = {
  title: 'About',
  description: 'How The Stack works, how we evaluate cards, and how we make money.'
};

export default function AboutPage() {
  return (
    <div className="container-page pt-12 pb-16 max-w-4xl">
      {/* Hero */}
      <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">About</p>
      <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-5xl">
        Make the Banks Work for You.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
        The Stack helps you make big banks and credit card companies work for you. We&apos;ve spent
        years helping friends and family navigate rewards, fees, and fine print with practical,
        proven strategies. So we put everything we&apos;ve learned here for anyone to use, free.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tools/card-finder"
          className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Build My Bonus Plan
        </Link>
        <Link
          href="/cards"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Browse Card Guides
        </Link>
      </div>

      {/* Proof points */}
      <section className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-heading text-3xl text-text-primary md:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Why / Who — side by side cards */}
      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <article className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-teal">The Problem</p>
          <h2 className="mt-3 text-xl font-semibold text-text-primary">Why We Exist</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            Big banks and card issuers build products to maximize their profit, not your outcome.
            Between headline offers, buried terms, and fee traps, most customers are set up to leave
            money on the table. The Stack exists to flip that dynamic: show you the catches, map the
            best move, and help you come out ahead.
          </p>
        </article>
        <article className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">The Team</p>
          <h2 className="mt-3 text-xl font-semibold text-text-primary">Who We Are</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            We are a small team of builders and rewards nerds helping people use these systems in
            their favor instead of getting played by them. We track new offers, pressure-test
            strategies, and publish simple playbooks so you can act quickly and keep more of your
            money.
          </p>
        </article>
      </section>

      {/* What We Do — tool cards matching homepage pattern */}
      <section className="mt-16">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">What We Do</p>
        <h2 className="mt-2 font-heading text-2xl text-text-primary md:text-3xl">
          Give you a plan, show you the math, help you execute.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
            >
              <p className={`text-xs uppercase tracking-[0.25em] ${tool.color}`}>{tool.tag}</p>
              <h3 className="mt-3 text-lg font-semibold text-text-primary">{tool.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How We Evaluate — promoted section */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-bg-elevated p-8 shadow-[0_0_45px_rgba(45,212,191,0.08)] md:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Our Method</p>
        <h2 className="mt-2 font-heading text-2xl text-text-primary md:text-3xl">
          How We Evaluate Cards
        </h2>
        <p className="mt-4 text-base leading-7 text-text-secondary">
          If a card only looks good on marketing pages, it does not rank well here. We score by
          what you actually keep, not what the issuer advertises.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-white/5 bg-bg-surface p-4"
            >
              <p className="text-sm font-semibold text-text-primary">{p.label}</p>
              <p className="mt-1 text-sm text-text-secondary">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Inspect every assumption in our{' '}
          <Link href="/cards" className="font-semibold text-brand-teal transition hover:underline">
            card guides
          </Link>{' '}
          and{' '}
          <Link
            href="/tools/card-vs-card"
            className="font-semibold text-brand-teal transition hover:underline"
          >
            comparison tools
          </Link>{' '}
          before making a decision.
        </p>
      </section>

      {/* Newsletter CTA */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Stay Ahead</p>
        <h2 className="mt-2 font-heading text-2xl text-text-primary md:text-3xl">
          Get Weekly Payout Plays
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary">
          Bonus offers, APY opportunities, and fee traps to avoid — delivered weekly.
        </p>
        <div className="mx-auto mt-6 max-w-md">
          <NewsletterSignup source="about" compact />
        </div>
      </section>

      {/* Feedback — compact */}
      <section className="mt-16 text-center">
        <p className="text-sm text-text-secondary">
          Found an error, have feedback on rankings, or want us to review a strategy?{' '}
          <a
            href="mailto:team@thestackhq.com"
            className="font-semibold text-brand-teal transition hover:underline"
          >
            Reach out
          </a>
          . This site is for educational purposes only and is not personalized financial advice.
        </p>
      </section>
    </div>
  );
}
