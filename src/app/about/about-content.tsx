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

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-center font-heading text-2xl text-text-primary md:text-3xl">
          What we built
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="min-h-[210px] rounded-2xl border border-white/10 bg-bg-surface p-7 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)] md:p-8">
            <h3 className="text-xl font-semibold text-text-primary">Spreadsheet trackers</h3>
            <p className="mt-3 text-base leading-7 text-text-primary/70">
              Track your bonuses and spending in one place
            </p>
          </article>
          <article className="min-h-[210px] rounded-2xl border border-white/10 bg-bg-surface p-7 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)] md:p-8">
            <h3 className="text-xl font-semibold text-text-primary">Scheduling tools</h3>
            <p className="mt-3 text-base leading-7 text-text-primary/70">
              Know exactly when to apply and hit your spend
            </p>
          </article>
          <article className="min-h-[210px] rounded-2xl border border-white/10 bg-bg-surface p-7 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)] md:p-8">
            <h3 className="text-xl font-semibold text-text-primary">Offer comparisons</h3>
            <p className="mt-3 text-base leading-7 text-text-primary/70">
              See the real net value of any card before you commit
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-2xl border border-white/10 bg-bg-surface/70 px-6 py-6 md:px-8">
        <h2 className="text-center font-heading text-2xl text-text-primary">
          Why trust The Stack
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-text-secondary md:text-lg">
          We built The Stack because most rewards advice is optimized for clicks, not decisions.
          We do not sell sponsored rankings, and we aim to show the real tradeoffs behind every
          offer.
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-text-primary">
          <li className="rounded-full border border-white/10 bg-bg px-4 py-2">
            No sponsored rankings
          </li>
          <li className="rounded-full border border-white/10 bg-bg px-4 py-2">
            Clear affiliate disclosure
          </li>
          <li className="rounded-full border border-white/10 bg-bg px-4 py-2">No paywalls, ever</li>
        </ul>
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary md:text-base">
            New here? Start with a personalized plan.
          </p>
          <div className="mt-4">
            <Link
              href="/tools/card-finder"
              className="inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Start Your Personal Plan
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl rounded-3xl border border-white/10 bg-bg-elevated p-8 text-center md:p-10">
        <h2 className="font-heading text-3xl text-text-primary md:text-4xl">Get Weekly Payout Plays</h2>
        <p className="mx-auto mt-3 max-w-none text-lg text-text-secondary md:text-xl lg:whitespace-nowrap">
          Bonus offers, finance how-tos, and free tools. Delivered weekly. No Slop.
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
