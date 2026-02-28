'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CardPicker } from '@/components/ui/card-picker';
import { formatCategory } from '@/lib/format';
import type { CardRecord, CardDetail, BenefitDetail } from '@/lib/cards';

export function HiddenBenefitsTool() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  /* Fetch card list on mount */
  useEffect(() => {
    fetch('/api/cards?limit=100')
      .then((res) => res.json())
      .then((data) => setCards(data.results))
      .catch(() => setError('Could not load card list.'))
      .finally(() => setLoadingCards(false));
  }, []);

  /* Fetch full card detail when selection changes */
  useEffect(() => {
    if (!selectedSlug) {
      setCardDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setError('');

    fetch(`/api/cards/${selectedSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCardDetail(data.card);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load card details.');
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const totalBenefitValue =
    cardDetail?.benefits.reduce((sum, b) => sum + (b.estimatedValue ?? 0), 0) ?? 0;
  const annualFee = cardDetail?.annualFee ?? 0;
  const netValue = totalBenefitValue - annualFee;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {loadingCards ? (
        <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
      ) : (
        <CardPicker
          cards={cards}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          placeholder="Search for your card..."
        />
      )}

      {error && (
        <p className="mt-6 text-sm text-brand-coral">{error}</p>
      )}

      {loadingDetail && <DetailSkeleton />}

      {cardDetail && !loadingDetail && cardDetail.benefits.length === 0 && (
        <NoBenefitsState cardName={cardDetail.name} />
      )}

      {cardDetail && !loadingDetail && cardDetail.benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <ValueSummaryBar
            totalValue={totalBenefitValue}
            annualFee={annualFee}
            netValue={netValue}
          />

          <div className="mt-6 space-y-3">
            {cardDetail.benefits.map((benefit, i) => (
              <BenefitCard key={i} benefit={benefit} />
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function ValueSummaryBar({
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
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Benefits</p>
        <p className="mt-1 text-2xl font-semibold text-brand-teal">
          ~${totalValue.toLocaleString()}<span className="text-sm font-normal text-text-muted">/yr</span>
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Annual Fee</p>
        <p className={`mt-1 text-2xl font-semibold ${annualFee > 0 ? 'text-brand-coral' : 'text-brand-teal'}`}>
          {annualFee === 0 ? 'Free' : `$${annualFee.toLocaleString()}`}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net Value</p>
        <p className={`mt-1 text-2xl font-semibold ${netValue >= 0 ? 'text-brand-teal' : 'text-brand-coral'}`}>
          {netValue >= 0 ? '+' : ''}${netValue.toLocaleString()}<span className="text-sm font-normal text-text-muted">/yr</span>
        </p>
      </div>
    </div>
  );
}

function BenefitCard({ benefit }: { benefit: BenefitDetail }) {
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

function NoBenefitsState({ cardName }: { cardName: string }) {
  return (
    <div className="mt-10 text-center">
      <p className="text-text-muted">
        We don&apos;t have benefits data for <span className="text-text-secondary">{cardName}</span> yet.
      </p>
      <p className="mt-1 text-sm text-text-muted">Check back soon — we&apos;re adding more cards regularly.</p>
    </div>
  );
}

function DetailSkeleton() {
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
