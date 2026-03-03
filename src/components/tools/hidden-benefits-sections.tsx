'use client';

import { formatCategory } from '@/lib/format';
import type { BenefitDetail } from '@/lib/cards';

export function ValueSummaryBar({
  totalValue,
  annualFee,
  netValue
}: {
  totalValue: number;
  annualFee: number;
  netValue: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/5 bg-bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Annual Payout</p>
        <p className="mt-1 text-2xl font-semibold text-brand-teal">
          ~${totalValue.toLocaleString()}
          <span className="text-sm font-normal text-text-muted">/yr</span>
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Cost</p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            annualFee > 0 ? 'text-brand-coral' : 'text-brand-teal'
          }`}
        >
          {annualFee === 0 ? 'Free' : `$${annualFee.toLocaleString()}`}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net Gain</p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            netValue >= 0 ? 'text-brand-teal' : 'text-brand-coral'
          }`}
        >
          {netValue >= 0 ? '+' : ''}${netValue.toLocaleString()}
          <span className="text-sm font-normal text-text-muted">/yr</span>
        </p>
      </div>
    </div>
  );
}

export function BenefitCard({ benefit }: { benefit: BenefitDetail }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-surface px-5 py-4">
      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {formatCategory(benefit.category)}
      </p>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{benefit.name}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{benefit.description}</p>
          {benefit.activationMethod && (
            <span className="mt-2 inline-block rounded-full border border-white/10 px-3 py-1 text-[10px] text-text-muted">
              {benefit.activationMethod}
            </span>
          )}
        </div>
        {benefit.estimatedValue != null && (
          <span className="shrink-0 text-sm font-semibold text-brand-teal">
            ~${benefit.estimatedValue}/yr
          </span>
        )}
      </div>
    </div>
  );
}

export function NoBenefitsState({ cardName }: { cardName: string }) {
  return (
    <div className="mt-10 text-center">
      <p className="text-text-muted">
        We don&apos;t have benefits data for <span className="text-text-secondary">{cardName}</span>{' '}
        yet.
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Check back soon - we&apos;re adding more cards regularly.
      </p>
    </div>
  );
}

export function HiddenBenefitsDetailSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 rounded-2xl bg-bg-surface" />
        ))}
      </div>
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-24 rounded-2xl bg-bg-surface" />
      ))}
    </div>
  );
}
