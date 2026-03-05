'use client';

import Link from 'next/link';
import { CountUp } from '@/components/ui/count-up';
import { NewsletterSignup } from '@/components/newsletter-signup';

const tools = [
  {
    title: 'Payout Planner',
    description: 'Build a card and bank bonus schedule that fits your spending and timeline.',
    href: '/tools/card-finder',
    cta: 'Open planner'
  },
  {
    title: 'Offer vs Offer',
    description: 'Compare offers and track real net value after fees, credits, and deadlines.',
    href: '/tools/card-vs-card',
    cta: 'Compare offers'
  },
  {
    title: 'Playbooks',
    description: 'Avoid costly mistakes and track your money with our easy to use templates.',
    href: '/blog',
    cta: 'Read playbooks'
  }
];

const stats = [
  { end: 200, prefix: '', suffix: '+', label: 'Cards tracked' },
  { end: 100, prefix: '', suffix: '+', label: 'Banks monitored' },
  { end: 100, prefix: '', suffix: '%', label: 'Free to use' },
  { end: 10, prefix: '', suffix: '+', label: 'Years of experience' }
];

export function AboutContent() {
  return (
    <div className="container-page pt-12 pb-16 max-w-4xl">
      {/* Hero */}
      <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">About</p>
      <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-5xl">
        Make the Banks Work for You.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
        The Stack helps you make banks and card issuers work for you. We have spent years helping
        friends and family navigate rewards, fees, and fine print with practical, proven
        strategies. Now we&apos;re sharing what we&apos;ve learned in one place for anyone to use,
        free.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tools/card-finder"
          className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Build My Bonus Plan
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-bg-surface px-5 py-2 text-sm font-semibold text-text-primary transition hover:border-white/30 hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Read the Playbooks
        </Link>
      </div>

      {/* Proof points */}
      <section className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <CountUp
              end={stat.end}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="font-heading text-5xl text-text-primary md:text-6xl"
            />
            <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Why / Who — side by side cards */}
      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <article className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
          <h2 className="text-xl font-semibold text-text-primary">Why We Exist</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            Big banks and credit card companies are built to profit from confusion, bad habits, and
            fine print. The Stack exists to flip that dynamic with practical tools, clear math, and
            guidance that helps you avoid the traps and come out ahead.
          </p>
        </article>
        <article className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
          <h2 className="text-xl font-semibold text-text-primary">Who Built This</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            The Stack was built by finance professionals who got tired of watching banks and credit
            card companies profit from confusion. We created The Stack to give you better
            information, clearer math, and practical tools that make it easier to make money.
          </p>
        </article>
      </section>

      {/* What We Do — tool cards matching homepage pattern */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl text-text-primary md:text-3xl">
          The Stack gives you a plan, shows you the math, and helps you execute.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]"
            >
              <h3 className="text-lg font-semibold text-text-primary transition group-hover:text-brand-teal">
                {tool.title}
              </h3>
              <p className="mt-2 text-base leading-7 text-text-primary/70">{tool.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-teal">
                <span>{tool.cta}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4 transition group-hover:translate-x-1"
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
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
          Get Weekly Payout Plays
        </h2>
        <p className="mx-auto mt-3 max-w-none text-lg text-text-secondary md:text-xl lg:whitespace-nowrap">
          Bonus offers, finance how-tos, and free tools. Delivered weekly. No Slop.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <NewsletterSignup source="about" compact size="large" />
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
