'use client';

import { motion } from 'framer-motion';
import { formatCategory } from '@/lib/format';
import type { CardDetail, RewardDetail } from '@/lib/cards';

function formatRate(reward: RewardDetail) {
  return reward.rateType === 'cashback' ? `${reward.rate}%` : `${reward.rate}x`;
}

function formatCurrency(value: number) {
  return value === 0 ? 'Free' : `$${value.toLocaleString()}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm uppercase tracking-[0.28em] text-text-muted">{children}</h3>;
}

function CardLabels({ a, b }: { a: CardDetail; b: CardDetail }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-4">
      <p className="text-sm font-semibold text-text-secondary">{a.name}</p>
      <p className="text-sm font-semibold text-text-secondary">{b.name}</p>
    </div>
  );
}

function AnnualFeeRow({ a, b }: { a: CardDetail; b: CardDetail }) {
  return (
    <div>
      <SectionHeading>Annual Fee</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <p className="text-xl font-semibold text-text-primary">{formatCurrency(a.annualFee)}</p>
          <p className="text-xl font-semibold text-text-primary">{formatCurrency(b.annualFee)}</p>
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

            return (
              <div key={category} className="flex items-center gap-4">
                <span className="min-w-[100px] text-sm text-text-muted">{formatCategory(category)}</span>
                <div className="grid flex-1 grid-cols-2 gap-4">
                  <span className="text-base font-semibold text-text-primary">
                    {rA ? formatRate(rA) : '—'}
                  </span>
                  <span className="text-base font-semibold text-text-primary">
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

  function formatBonus(bonus: typeof bonusA) {
    if (!bonus) return '—';
    if (bonus.displayHeadline) return bonus.displayHeadline;
    if (bonus.bonusType === 'statement_credit') return `$${bonus.bonusValue} credit`;
    if (bonus.bonusPoints) return `${bonus.bonusPoints.toLocaleString()} pts`;
    return `$${bonus.bonusValue} bonus`;
  }

  function formatSpend(bonus: typeof bonusA) {
    if (!bonus) return '';
    if (bonus.displayDescription) return bonus.displayDescription;
    return `Spend $${bonus.spendRequired.toLocaleString()} in ${Math.round(bonus.spendPeriodDays / 30)} mo`;
  }

  return (
    <div>
      <SectionHeading>Welcome Offer</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xl font-semibold text-text-primary">{formatBonus(bonusA)}</p>
            <p className="mt-1 text-sm leading-5 text-text-muted">{formatSpend(bonusA)}</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-text-primary">{formatBonus(bonusB)}</p>
            <p className="mt-1 text-sm leading-5 text-text-muted">{formatSpend(bonusB)}</p>
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
  const benefitValue = (card: CardDetail, total: number) => {
    if (total > 0) return `~$${total.toLocaleString()}/yr`;
    if (card.benefits.length > 0) return `${card.benefits.length} listed`;
    return '—';
  };
  const benefitDetail = (card: CardDetail) => {
    if (card.benefits.length === 0) return 'No listed benefits';

    const names = card.benefits.slice(0, 2).map((benefit) => benefit.name).join(' · ');
    const remaining = card.benefits.length > 2 ? ` · +${card.benefits.length - 2} more` : '';
    return `${names}${remaining}`;
  };

  return (
    <div>
      <SectionHeading>Benefits</SectionHeading>
      <div className="mt-3 rounded-2xl border border-white/5 bg-bg-surface p-5">
        <CardLabels a={a} b={b} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xl font-semibold text-text-primary">
              {benefitValue(a, totalA)}
            </p>
            <p className="mt-1 text-sm leading-5 text-text-muted">{benefitDetail(a)}</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-text-primary">
              {benefitValue(b, totalB)}
            </p>
            <p className="mt-1 text-sm leading-5 text-text-muted">{benefitDetail(b)}</p>
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
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-text-secondary"
                >
                  {partner.partnerName}
                </span>
              ))
            ) : (
              <span className="text-sm text-text-muted">None</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {b.transferPartners.length > 0 ? (
              b.transferPartners.map((partner) => (
                <span
                  key={partner.partnerName}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-text-secondary"
                >
                  {partner.partnerName}
                </span>
              ))
            ) : (
              <span className="text-sm text-text-muted">None</span>
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
      valB: b.foreignTxFee === 0 ? 'None' : `${b.foreignTxFee}%`
    },
    {
      label: 'Credit Needed',
      valA: a.creditTierMin,
      valB: b.creditTierMin
    },
    {
      label: 'Network',
      valA: a.network ?? '—',
      valB: b.network ?? '—'
    },
    {
      label: 'Reward Type',
      valA: a.rewardType,
      valB: b.rewardType
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
              <span className="min-w-[100px] text-sm text-text-muted">{row.label}</span>
              <div className="grid flex-1 grid-cols-2 gap-4">
                <span className="text-base capitalize text-text-primary">{row.valA}</span>
                <span className="text-base capitalize text-text-primary">{row.valB}</span>
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
