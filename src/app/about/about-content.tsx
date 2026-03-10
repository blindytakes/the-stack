'use client';

import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';

export function AboutContent() {
  return (
    <div className="container-page pt-12 pb-16 max-w-5xl">
      <section className="mx-auto max-w-5xl text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">About</p>

        <h1 className="mx-auto mt-3 max-w-[14ch] text-balance font-heading text-5xl leading-[0.94] text-text-primary md:max-w-[30ch] md:text-6xl">
          Why We Built The Stack
        </h1>

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-left text-xl leading-9 text-text-primary/80">
          <p>
            We started The Stack after each making more than $5,000 in a single year from cards
            and bank accounts we were already using. Friends kept asking how we were finding the
            best offers, timing applications, and tracking the fine print without making expensive
            mistakes.
          </p>
          <p>
            Most of the advice online felt built for clicks, not real decisions, so we built the
            resource we wanted ourselves: clear math, honest comparisons, and practical tools that
            help you know what an offer is actually worth before you apply. That&apos;s what The
            Stack is for.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-4xl">
        <h2 className="text-center font-heading text-2xl text-text-primary md:text-3xl">
          What we built
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-text-secondary md:text-lg">
          Tools to help you track the details, time the move, and compare what an offer is
          actually worth.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="group relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_38%),linear-gradient(180deg,rgba(26,26,38,0.98)_0%,rgba(18,18,26,0.98)_100%)] p-8 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_24px_rgba(45,212,191,0.08)] md:p-9">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-teal/60 to-transparent" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-teal/90">
              Track
            </p>
            <h3 className="mt-6 text-[1.45rem] font-semibold leading-tight text-text-primary">
              Spreadsheet trackers
            </h3>
            <p className="mt-4 max-w-[18rem] text-base leading-7 text-text-primary/72">
              Track your bonuses and spending in one place
            </p>
          </article>
          <article className="group relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,168,83,0.1),transparent_38%),linear-gradient(180deg,rgba(26,26,38,0.98)_0%,rgba(18,18,26,0.98)_100%)] p-8 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_24px_rgba(45,212,191,0.08)] md:p-9">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Plan
            </p>
            <h3 className="mt-6 text-[1.45rem] font-semibold leading-tight text-text-primary">
              Scheduling tools
            </h3>
            <p className="mt-4 max-w-[18rem] text-base leading-7 text-text-primary/72">
              Know exactly when to apply and hit your spend
            </p>
          </article>
          <article className="group relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_38%),linear-gradient(180deg,rgba(26,26,38,0.98)_0%,rgba(18,18,26,0.98)_100%)] p-8 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_24px_rgba(45,212,191,0.08)] md:p-9">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-teal/45 to-transparent" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-teal/80">
              Compare
            </p>
            <h3 className="mt-6 text-[1.45rem] font-semibold leading-tight text-text-primary">
              Offer comparisons
            </h3>
            <p className="mt-4 max-w-[18rem] text-base leading-7 text-text-primary/72">
              See the real net value of any card before you commit
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-[4.5rem] max-w-3xl text-center">
        <p className="mx-auto max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
          Start with a bonus plan built around your spending and timing. No sponsored rankings. No
          paywalls.
        </p>
        <div className="mt-6">
          <Link
            href="/tools/card-finder?mode=full"
            className="inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Start My Bonus Plan
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <h2 className="font-heading text-3xl text-text-primary md:text-4xl">Get Bonus Plays</h2>
        <p className="mx-auto mt-3 max-w-none text-lg text-text-secondary md:text-xl lg:whitespace-nowrap">
          Bonus offers, timing tips, and free tools. Curated, not sponsored.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <NewsletterSignup source="about" compact size="large" />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl text-center">
        <p className="text-sm text-text-secondary">
          Have questions or want to reach out? Email us at{' '}
          <a href="mailto:team@thestackhq.com" className="font-semibold text-brand-teal transition hover:underline">
            team@thestackhq.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
