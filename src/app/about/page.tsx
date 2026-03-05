import Link from 'next/link';
import type { Metadata } from 'next';

const whatWeDo = [
  {
    title: 'Build a card and bank bonus schedule that fits your spending and timeline.',
    href: '/tools/card-finder'
  },
  {
    title: 'Compare offers and track real net value after fees, credits, and deadlines.',
    href: '/tools/card-vs-card'
  },
  {
    title: 'Avoid costly mistakes like missed bonus windows, weak redemptions, and fee traps.',
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
      <h1 className="font-heading text-4xl text-text-primary md:text-5xl">About The Stack</h1>
      <p className="mt-4 max-w-3xl text-text-secondary">
        The Stack helps you make big banks and credit card companies work for you. We&apos;ve spent years
        helping friends and family navigate rewards, fees, and fine print with practical, proven
        strategies. So we put everything we&apos;ve learned here for anyone to use, free.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
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

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">Why We Exist</h2>
          <p className="mt-3 text-base leading-8 text-text-secondary">
            Big banks and card issuers build products to maximize their profit, not your outcome.
            Between headline offers, buried terms, and fee traps, most customers are set up to leave
            money on the table. The Stack exists to flip that dynamic: show you the catches, map the
            best move, and help you come out ahead.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">Who We Are</h2>
          <p className="mt-3 text-base leading-8 text-text-secondary">
            We are a small team of builders and rewards nerds helping people use these systems in
            their favor instead of getting played by them. We track new offers, pressure-test
            strategies, and publish simple playbooks so you can act quickly and keep more of your
            money.
          </p>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-bg-elevated p-6 md:p-8">
        <h2 className="text-2xl font-heading text-text-primary">What We Do</h2>
        <p className="mt-3 text-base leading-8 text-text-secondary">
          What we do is simple: give you a plan, show you the math, and help you execute.
        </p>
        <ul className="mt-5 list-disc space-y-3 pl-5">
          {whatWeDo.map((item) => (
            <li key={item.title} className="text-base leading-8 text-text-secondary">
              <Link href={item.href} className="font-semibold text-text-primary transition hover:text-brand-teal">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-heading text-text-primary">How We Evaluate Cards</h2>
        <p className="mt-4 text-base leading-8 text-text-secondary">
          We score cards by your expected net value, not by commission rate. That means we penalize
          annual fee drag, discount credits most people will not fully use, and prioritize rewards
          you can actually redeem. If a card only looks good on marketing pages, it does not rank
          well here.
        </p>
        <p className="mt-3 text-base leading-8 text-text-secondary">
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
