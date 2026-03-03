import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Banking',
  description:
    'Checking and savings strategy to earn more from banks through bonuses, APY, and fee avoidance.'
};

const pillars = [
  {
    title: 'Checking bonuses',
    body: 'Track direct-deposit and activity requirements so you can capture bonuses without missing deadlines.'
  },
  {
    title: 'Savings yield',
    body: 'Prioritize competitive APY while watching balance rules, transfer limits, and promo expiration windows.'
  },
  {
    title: 'Fee defense',
    body: 'Avoid maintenance, ATM, overdraft, and transfer fees that silently erase bonus gains.'
  }
];

export default function BankingPage() {
  return (
    <div className="container-page pt-12 pb-16">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Banking</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">
          Make banks work for you beyond cards.
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Build a system around checking bonuses, savings yield, and fee avoidance so your banking
          stack contributes real annual value.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Value examples are estimates, not guarantees. Results vary by offer availability and
          account eligibility.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="rounded-2xl border border-white/10 bg-bg-surface p-6">
            <h2 className="text-lg font-semibold text-text-primary">{pillar.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{pillar.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">Featured Guide</p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          Bank Account Bonuses 101: How to Actually Keep the Money
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Checking and savings bonuses can be high-value, but only if you avoid fee clawbacks and
          missed requirements.
        </p>
        <Link
          href="/learn/bank-account-bonuses-101"
          className="mt-3 inline-block text-sm font-semibold text-brand-teal transition hover:underline"
        >
          Read the playbook
        </Link>
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-bg-elevated p-8">
        <h2 className="font-[var(--font-heading)] text-3xl text-text-primary">
          Start with your highest-probability wins.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">
          Use the planning tools to identify high-fit offers and value leaks now, then layer
          banking bonuses and APY optimization into the same system.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tools/card-finder">
            <Button>Start My Payout Plan</Button>
          </Link>
          <Link href="/learn">
            <Button variant="ghost">Read the playbooks</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
