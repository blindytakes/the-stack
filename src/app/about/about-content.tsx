'use client';

import Link from 'next/link';
import { CountUp } from '@/components/ui/count-up';
import { NewsletterSignup } from '@/components/newsletter-signup';

const tools = [
  {
    title: 'Payout Planner',
    description: 'Build a card and bank bonus schedule that fits your spending and timeline.',
    href: '/tools/card-finder'
  },
  {
    title: 'Offer vs Offer',
    description: 'Compare offers and track real net value after fees, credits, and deadlines.',
    href: '/tools/card-vs-card'
  },
  {
    title: 'Playbooks',
    description: 'Avoid costly mistakes like missed bonus windows, weak redemptions, and fee traps.',
    href: '/blog'
  }
];

const stats = [
  { end: 10, prefix: '', suffix: '+', label: 'Years of experience' },
  { end: 200, prefix: '', suffix: '+', label: 'Cards tracked' },
  { end: 100, prefix: '', suffix: '+', label: 'Banks monitored' },
  { end: 0, prefix: '$', suffix: '', label: 'Cost to you' }
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
          <p className="mt-3 text-base leading-7 text-text-primary/90">
            Banks design products to maximize their profit, not yours.{' '}
            <span className="text-text-primary/70">
              The Stack exists to flip that. Show you the catches, map the best move, and help you
              come out ahead.
            </span>
          </p>
        </article>
        <article className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
          <h2 className="text-xl font-semibold text-text-primary">Who We Are</h2>
          <p className="mt-3 text-base leading-7 text-text-primary/90">
            A team of builders and rewards nerds who got tired of watching banks win.{' '}
            <span className="text-text-primary/70">
              We track offers, pressure-test strategies, and publish playbooks so you can act fast
              and keep more of your money.
            </span>
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
              <h3 className="text-lg font-semibold text-text-primary">{tool.title}</h3>
              <p className="mt-2 text-base leading-7 text-text-primary/70">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Stay Ahead</p>
        <h2 className="mt-2 font-heading text-2xl text-text-primary md:text-3xl">
          Get Weekly Payout Plays
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base text-text-secondary">
          Bonus offers, APY opportunities, and fee traps to avoid. Delivered weekly.
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
