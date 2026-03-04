import Link from 'next/link';
import type { Metadata } from 'next';

const whatWeDo = [
  {
    title: 'Card breakdowns',
    description: 'Clear tradeoffs on fees, credits, rewards, and first-year value.',
    href: '/cards'
  },
  {
    title: 'Decision tools',
    description: 'Payout planning and side-by-side comparisons to narrow your next move.',
    href: '/tools/card-finder'
  },
  {
    title: 'Strategy content',
    description: 'Practical playbooks for bonus timing, redemptions, and avoiding fee drag.',
    href: '/blog'
  }
];

export const metadata: Metadata = {
  title: 'About',
  description: 'How The Stack works, how we evaluate cards, and how we make money.'
};

export default function AboutPage() {
  return (
    <div className="container-page pt-12 pb-16 max-w-4xl">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">About</p>
      <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-5xl">About The Stack</h1>
      <p className="mt-4 max-w-3xl text-text-secondary">
        The Stack helps you make banks work for you with transparent strategy, practical tools, and
        no mystery ranking logic. It is free to use, and always will be for you.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/tools/card-finder"
          className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Start My Payout Plan
        </Link>
        <Link
          href="/cards"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Browse Card Guides
        </Link>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">Why We Exist</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Most card and banking content is noisy, payout-driven, or hard to compare. We built The
            Stack to turn that into a clear system for capturing real value while keeping risk low.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">Who We Are</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            We are operators and product builders focused on one job: make bank and credit decisions
            simpler, faster, and more evidence-based for everyday users.
          </p>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-bg-elevated p-6 md:p-8">
        <h2 className="text-2xl font-heading text-text-primary">What We Do</h2>
        <ul className="mt-5 space-y-4">
          {whatWeDo.map((item) => (
            <li key={item.title} className="text-sm leading-7 text-text-secondary">
              <Link href={item.href} className="font-semibold text-text-primary transition hover:text-brand-teal">
                {item.title}
              </Link>
              : {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-heading text-text-primary">How We Evaluate Cards</h2>
        <p className="mt-4 text-sm leading-7 text-text-secondary">
          We score options by expected value and user fit, not by commission rate. That means we
          weight annual fee drag, usable credits, bonus timing, reward earn rate, and practical
          redemption value. Every recommendation should pass a simple question: does this improve
          your real-world outcome over the next 12 months?
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          You can inspect assumptions directly in our{' '}
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

      <section className="mt-10 rounded-2xl border border-white/10 bg-bg-elevated p-6 md:p-8">
        <h2 className="text-2xl font-heading text-text-primary">Feedback or Questions?</h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          Found an error, want us to review a strategy, or have feedback on rankings? Reach out and
          we will take a look.
        </p>
        <a
          href="mailto:team@thestackhq.com"
          className="mt-3 inline-block text-sm font-semibold text-brand-teal transition hover:underline"
        >
          team@thestackhq.com
        </a>
      </section>
    </div>
  );
}
