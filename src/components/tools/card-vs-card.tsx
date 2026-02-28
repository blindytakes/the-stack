'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CardPicker } from '@/components/ui/card-picker';
import { formatCategory } from '@/lib/format';
import type { CardRecord, CardDetail, RewardDetail } from '@/lib/cards';

/* ── Helpers ────────────────────────────────────────────── */

function winner(a: number, b: number, lowerIsBetter = false): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie';
  if (lowerIsBetter) return a < b ? 'a' : 'b';
  return a > b ? 'a' : 'b';
}

function winColor(side: 'a' | 'b' | 'tie', which: 'a' | 'b') {
  if (side === 'tie') return 'text-text-primary';
  return side === which ? 'text-brand-teal' : 'text-text-secondary';
}

function formatRate(r: RewardDetail) {
  return r.rateType === 'cashback' ? `${r.rate}%` : `${r.rate}x`;
}

function formatCurrency(n: number) {
  return n === 0 ? 'Free' : `$${n.toLocaleString()}`;
}

function useCardDetail(slug: string | null) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setCard(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/cards/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCard(data.card);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load card.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { card, loading, error };
}

/* ── Main Component ─────────────────────────────────────── */

export function CardVsCardTool() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [slugA, setSlugA] = useState<string | null>(null);
  const [slugB, setSlugB] = useState<string | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState('');

  const detailA = useCardDetail(slugA);
  const detailB = useCardDetail(slugB);

  useEffect(() => {
    fetch('/api/cards?limit=100')
      .then((res) => res.json())
      .then((data) => setCards(data.results))
      .catch(() => setCardsError('Could not load card list.'))
      .finally(() => setLoadingCards(false));
  }, []);

  const bothLoaded = detailA.card && detailB.card;
  const anyLoading = detailA.loading || detailB.loading;
  const anyError = cardsError || detailA.error || detailB.error;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {/* Card pickers */}
      {loadingCards ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
          <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CardPicker cards={cards} selectedSlug={slugA} onSelect={setSlugA} label="Card 1" />
          <CardPicker cards={cards} selectedSlug={slugB} onSelect={setSlugB} label="Card 2" />
        </div>
      )}

      {anyError && <p className="mt-6 text-sm text-brand-coral">{anyError}</p>}

      {anyLoading && (
        <div className="mt-8 animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-bg-surface" />
          ))}
        </div>
      )}

      {bothLoaded && !anyLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 space-y-6"
        >
          <AnnualFeeRow a={detailA.card!} b={detailB.card!} />
          <RewardsComparison a={detailA.card!} b={detailB.card!} />
          <SignUpBonusRow a={detailA.card!} b={detailB.card!} />
          <BenefitsRow a={detailA.card!} b={detailB.card!} />
          <TransferPartnersRow a={detailA.card!} b={detailB.card!} />
          <QuickFactsRow a={detailA.card!} b={detailB.card!} />
        </motion.div>
      )}
    </section>
  );
}

/* ── Comparison Rows ────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted">{children}</h3>
  );
}

function CardLabels({ a, b }: { a: CardDetail; b: CardDetail }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-4">
      <p className="text-xs font-medium text-text-secondary">{a.name}</p>
      <p className="text-xs font-medium text-text-secondary">{b.name}</p>
    </div>
  );
}

function AnnualFeeRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  const w = winner(a.annualFee, b.annualFee, true);
  return (
    <div>
      <SectionHeading>Annual Fee</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <p className={`text-lg font-semibold ${winColor(w, 'a')}`}>
            {formatCurrency(a.annualFee)}
          </p>
          <p className={`text-lg font-semibold ${winColor(w, 'b')}`}>
            {formatCurrency(b.annualFee)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RewardsComparison({ a, b }: { a: CardDetail; b: CardDetail }) {
  /* Merge all categories from both cards */
  const categorySet = new Set<string>();
  a.rewards.forEach((r) => categorySet.add(r.category));
  b.rewards.forEach((r) => categorySet.add(r.category));

  const categories = Array.from(categorySet).sort((x, y) => {
    // Put 'all' last
    if (x === 'all') return 1;
    if (y === 'all') return -1;
    return x.localeCompare(y);
  });

  if (categories.length === 0) return null;

  const getRate = (rewards: RewardDetail[], cat: string) => {
    const r = rewards.find((rw) => rw.category === cat);
    return r ?? null;
  };

  return (
    <div>
      <SectionHeading>Rewards</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="space-y-3">
          {categories.map((cat) => {
            const rA = getRate(a.rewards, cat);
            const rB = getRate(b.rewards, cat);
            const rateA = rA?.rate ?? 0;
            const rateB = rB?.rate ?? 0;
            const w = winner(rateA, rateB);

            return (
              <div key={cat} className="flex items-center gap-4">
                <span className="min-w-[100px] text-xs text-text-muted">
                  {formatCategory(cat)}
                </span>
                <div className="grid flex-1 grid-cols-2 gap-4">
                  <span className={`text-sm font-semibold ${winColor(w, 'a')}`}>
                    {rA ? formatRate(rA) : '—'}
                  </span>
                  <span className={`text-sm font-semibold ${winColor(w, 'b')}`}>
                    {rB ? formatRate(rB) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SignUpBonusRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  const bonusA = a.signUpBonuses.find((b) => b.isCurrentOffer !== false);
  const bonusB = b.signUpBonuses.find((b) => b.isCurrentOffer !== false);

  if (!bonusA && !bonusB) return null;

  const valA = bonusA?.bonusValue ?? 0;
  const valB = bonusB?.bonusValue ?? 0;
  const w = winner(valA, valB);

  function formatBonus(bonus: typeof bonusA) {
    if (!bonus) return '—';
    if (bonus.bonusType === 'statement_credit') return `$${bonus.bonusValue} credit`;
    if (bonus.bonusPoints) return `${bonus.bonusPoints.toLocaleString()} pts`;
    return `$${bonus.bonusValue} bonus`;
  }

  function formatSpend(bonus: typeof bonusA) {
    if (!bonus) return '';
    return `Spend $${bonus.spendRequired.toLocaleString()} in ${Math.round(bonus.spendPeriodDays / 30)} mo`;
  }

  return (
    <div>
      <SectionHeading>Sign-Up Bonus</SectionHeading>
      <div className="mt-3 rounded-2xl border border-brand-gold/10 bg-brand-gold/5 p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-lg font-semibold ${winColor(w, 'a')}`}>{formatBonus(bonusA)}</p>
            <p className="text-xs text-text-muted">{formatSpend(bonusA)}</p>
          </div>
          <div>
            <p className={`text-lg font-semibold ${winColor(w, 'b')}`}>{formatBonus(bonusB)}</p>
            <p className="text-xs text-text-muted">{formatSpend(bonusB)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitsRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  const totalA = a.benefits.reduce((s, b) => s + (b.estimatedValue ?? 0), 0);
  const totalB = b.benefits.reduce((s, b) => s + (b.estimatedValue ?? 0), 0);

  if (a.benefits.length === 0 && b.benefits.length === 0) return null;

  const w = winner(totalA, totalB);

  return (
    <div>
      <SectionHeading>Benefits</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-lg font-semibold ${winColor(w, 'a')}`}>
              {totalA > 0 ? `~$${totalA.toLocaleString()}/yr` : '—'}
            </p>
            <p className="text-xs text-text-muted">
              {a.benefits.length} benefit{a.benefits.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className={`text-lg font-semibold ${winColor(w, 'b')}`}>
              {totalB > 0 ? `~$${totalB.toLocaleString()}/yr` : '—'}
            </p>
            <p className="text-xs text-text-muted">
              {b.benefits.length} benefit{b.benefits.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferPartnersRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  if (a.transferPartners.length === 0 && b.transferPartners.length === 0) return null;

  return (
    <div>
      <SectionHeading>Transfer Partners</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-wrap gap-1.5">
            {a.transferPartners.length > 0 ? (
              a.transferPartners.map((p) => (
                <span
                  key={p.partnerName}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {p.partnerName}
                </span>
              ))
            ) : (
              <span className="text-xs text-text-muted">None</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {b.transferPartners.length > 0 ? (
              b.transferPartners.map((p) => (
                <span
                  key={p.partnerName}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {p.partnerName}
                </span>
              ))
            ) : (
              <span className="text-xs text-text-muted">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickFactsRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  const rows = [
    {
      label: 'Foreign Tx Fee',
      valA: a.foreignTxFee === 0 ? 'None' : `${a.foreignTxFee}%`,
      valB: b.foreignTxFee === 0 ? 'None' : `${b.foreignTxFee}%`,
      w: winner(a.foreignTxFee, b.foreignTxFee, true)
    },
    {
      label: 'Credit Needed',
      valA: a.creditTierMin,
      valB: b.creditTierMin,
      w: 'tie' as const
    },
    {
      label: 'Network',
      valA: a.network ?? '—',
      valB: b.network ?? '—',
      w: 'tie' as const
    },
    {
      label: 'Reward Type',
      valA: a.rewardType,
      valB: b.rewardType,
      w: 'tie' as const
    }
  ];

  return (
    <div>
      <SectionHeading>Quick Facts</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="min-w-[100px] text-xs text-text-muted">{row.label}</span>
              <div className="grid flex-1 grid-cols-2 gap-4">
                <span className={`text-sm capitalize ${winColor(row.w, 'a')}`}>{row.valA}</span>
                <span className={`text-sm capitalize ${winColor(row.w, 'b')}`}>{row.valB}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
