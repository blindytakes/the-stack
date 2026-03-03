'use client';

import { motion } from 'framer-motion';
import { formatCategory } from '@/lib/format';
import type { CardDetail, RewardDetail } from '@/lib/cards';

function winner(a: number, b: number, lowerIsBetter = false): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie';
  if (lowerIsBetter) return a < b ? 'a' : 'b';
  return a > b ? 'a' : 'b';
}

function winColor(side: 'a' | 'b' | 'tie', which: 'a' | 'b') {
  if (side === 'tie') return 'text-text-primary';
  return side === which ? 'text-brand-teal' : 'text-text-secondary';
}

function formatRate(reward: RewardDetail) {
  return reward.rateType === 'cashback' ? `${reward.rate}%` : `${reward.rate}x`;
}

function formatCurrency(value: number) {
  return value === 0 ? 'Free' : `$${value.toLocaleString()}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted">{children}</h3>;
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
          <p className={`text-lg font-semibold ${winColor(w, 'a')}`}>{formatCurrency(a.annualFee)}</p>
          <p className={`text-lg font-semibold ${winColor(w, 'b')}`}>{formatCurrency(b.annualFee)}</p>
        </div>
      </div>
    </div>
  );
}

function RewardsComparison({ a, b }: { a: CardDetail; b: CardDetail }) {
  const categorySet = new Set<string>();
  a.rewards.forEach((reward) => categorySet.add(reward.category));
  b.rewards.forEach((reward) => categorySet.add(reward.category));

  const categories = Array.from(categorySet).sort((x, y) => {
    if (x === 'all') return 1;
    if (y === 'all') return -1;
    return x.localeCompare(y);
  });

  if (categories.length === 0) return null;

  const getRate = (rewards: RewardDetail[], category: string) =>
    rewards.find((reward) => reward.category === category) ?? null;

  return (
    <div>
      <SectionHeading>Rewards</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="space-y-3">
          {categories.map((category) => {
            const rA = getRate(a.rewards, category);
            const rB = getRate(b.rewards, category);
            const w = winner(rA?.rate ?? 0, rB?.rate ?? 0);

            return (
              <div key={category} className="flex items-center gap-4">
                <span className="min-w-[100px] text-xs text-text-muted">{formatCategory(category)}</span>
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
  const bonusA = a.signUpBonuses.find((bonus) => bonus.isCurrentOffer !== false);
  const bonusB = b.signUpBonuses.find((bonus) => bonus.isCurrentOffer !== false);
  if (!bonusA && !bonusB) return null;

  const w = winner(bonusA?.bonusValue ?? 0, bonusB?.bonusValue ?? 0);

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
      <SectionHeading>Welcome Offer</SectionHeading>
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
  const totalA = a.benefits.reduce((sum, benefit) => sum + (benefit.estimatedValue ?? 0), 0);
  const totalB = b.benefits.reduce((sum, benefit) => sum + (benefit.estimatedValue ?? 0), 0);

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
              a.transferPartners.map((partner) => (
                <span
                  key={partner.partnerName}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {partner.partnerName}
                </span>
              ))
            ) : (
              <span className="text-xs text-text-muted">None</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {b.transferPartners.length > 0 ? (
              b.transferPartners.map((partner) => (
                <span
                  key={partner.partnerName}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {partner.partnerName}
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

export function CardVsCardComparison({ a, b }: { a: CardDetail; b: CardDetail }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8 space-y-6"
    >
      <AnnualFeeRow a={a} b={b} />
      <RewardsComparison a={a} b={b} />
      <SignUpBonusRow a={a} b={b} />
      <BenefitsRow a={a} b={b} />
      <TransferPartnersRow a={a} b={b} />
      <QuickFactsRow a={a} b={b} />
    </motion.div>
  );
}
