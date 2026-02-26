import Link from 'next/link';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    title: 'Signal over hype',
    copy: 'Every recommendation is based on your inputs and transparent scoring.'
  },
  {
    title: 'Built for real spend',
    copy: 'We map bonuses, fees, and categories to how you actually use a card.'
  },
  {
    title: 'Zero fluff tools',
    copy: 'Fast, focused flows that get you to a decision in minutes.'
  }
];

export default function HomePage() {
  return (
    <div className="container-page pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">The Stack</p>
          <h1 className="font-[var(--font-heading)] text-4xl leading-tight text-text-primary md:text-6xl">
            Find the credit card that matches your priorities.
          </h1>
          <p className="max-w-xl text-lg text-text-secondary">
            Start with the Card Finder and get a ranked list of options built around your spend, fees,
            and credit tier. No sponsored rankings. No mystery logic.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/card-finder">
              <Button>Start the Card Finder</Button>
            </Link>
            <Link href="/learn">
              <Button variant="ghost">Read the playbooks</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-8 shadow-[0_0_45px_rgba(45,212,191,0.08)]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">What you get</p>
            <div className="space-y-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/5 bg-bg-surface p-4">
                  <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-teal">Tool</p>
          <h3 className="mt-4 text-xl font-semibold">Card Finder</h3>
          <p className="mt-2 text-sm text-text-secondary">
            A five-step quiz that surfaces the top three cards for your profile.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Toolkit</p>
          <h3 className="mt-4 text-xl font-semibold">Hidden Benefits</h3>
          <p className="mt-2 text-sm text-text-secondary">
            See which protections and credits are worth real money.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-coral">Compare</p>
          <h3 className="mt-4 text-xl font-semibold">Card vs Card</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Head-to-head breakdowns on fees, rewards, and bonuses.
          </p>
        </div>
      </section>
    </div>
  );
}
