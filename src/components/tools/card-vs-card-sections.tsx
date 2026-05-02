'use client';

import { Fragment, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { formatCategory } from '@/lib/format';
import type { CardDetail, RewardDetail } from '@/lib/cards';

type ComparisonCell = {
  value: ReactNode;
  detail?: ReactNode;
  muted?: boolean;
};

type ComparisonRow = {
  group: string;
  label: string;
  a: ComparisonCell;
  b: ComparisonCell;
};

function formatRate(reward: RewardDetail) {
  return reward.rateType === 'cashback' ? `${reward.rate}%` : `${reward.rate}x`;
}

function formatCurrency(value: number) {
  return value === 0 ? 'Free' : `$${value.toLocaleString()}`;
}

function formatPercent(value: number) {
  return value === 0 ? 'None' : `${value}%`;
}

function summarizeNames(names: string[], visibleCount = 3, emptyLabel = 'None') {
  if (names.length === 0) return emptyLabel;

  const visibleNames = names.slice(0, visibleCount).join(' · ');
  const remaining = names.length > visibleCount ? ` · +${names.length - visibleCount} more` : '';
  return `${visibleNames}${remaining}`;
}

function getCurrentBonus(card: CardDetail) {
  return card.signUpBonuses.find((bonus) => bonus.isCurrentOffer !== false);
}

function formatBonusHeadline(bonus: ReturnType<typeof getCurrentBonus>) {
  if (!bonus) return '—';
  if (bonus.displayHeadline) return bonus.displayHeadline;
  if (bonus.bonusType === 'statement_credit') return `$${bonus.bonusValue.toLocaleString()} credit`;
  if (bonus.bonusPoints) return `${bonus.bonusPoints.toLocaleString()} pts`;
  return `$${bonus.bonusValue.toLocaleString()} bonus`;
}

function formatBonusDetail(bonus: ReturnType<typeof getCurrentBonus>) {
  if (!bonus) return undefined;
  if (bonus.displayDescription) return bonus.displayDescription;
  return `Spend $${bonus.spendRequired.toLocaleString()} in ${Math.round(bonus.spendPeriodDays / 30)} mo`;
}

function rewardDetail(reward: RewardDetail | null) {
  if (!reward) {
    return {
      value: '—',
      muted: true
    };
  }

  const notes =
    reward.notes ??
    (typeof reward.capAmount === 'number' && reward.capAmount > 0
      ? `Up to $${Math.round(reward.capAmount).toLocaleString()}${
          reward.capPeriod ? `/${reward.capPeriod}` : ''
        }`
      : undefined);

  return {
    value: formatRate(reward),
    detail: [notes, reward.isRotating ? 'Rotating category' : undefined].filter(Boolean).join(' · ') || undefined
  };
}

function benefitValue(card: CardDetail, total: number) {
  if (total > 0) return `~$${total.toLocaleString()}/yr`;
  if (card.benefits.length > 0) return `${card.benefits.length} listed`;
  return '—';
}

function buildComparisonRows(a: CardDetail, b: CardDetail): ComparisonRow[] {
  const rows: ComparisonRow[] = [
    {
      group: 'Costs',
      label: 'Annual fee',
      a: { value: formatCurrency(a.annualFee) },
      b: { value: formatCurrency(b.annualFee) }
    },
    {
      group: 'Costs',
      label: 'Foreign transaction fee',
      a: { value: formatPercent(a.foreignTxFee) },
      b: { value: formatPercent(b.foreignTxFee) }
    }
  ];

  const categorySet = new Set<string>();
  a.rewards.forEach((reward) => categorySet.add(reward.category));
  b.rewards.forEach((reward) => categorySet.add(reward.category));

  Array.from(categorySet)
    .sort((x, y) => {
      if (x === 'all') return 1;
      if (y === 'all') return -1;
      return x.localeCompare(y);
    })
    .forEach((category) => {
      rows.push({
        group: 'Rewards',
        label: `${formatCategory(category)} rewards`,
        a: rewardDetail(a.rewards.find((reward) => reward.category === category) ?? null),
        b: rewardDetail(b.rewards.find((reward) => reward.category === category) ?? null)
      });
    });

  const bonusA = getCurrentBonus(a);
  const bonusB = getCurrentBonus(b);
  if (bonusA || bonusB) {
    rows.push({
      group: 'Offer',
      label: 'Welcome offer',
      a: {
        value: formatBonusHeadline(bonusA),
        detail: formatBonusDetail(bonusA),
        muted: !bonusA
      },
      b: {
        value: formatBonusHeadline(bonusB),
        detail: formatBonusDetail(bonusB),
        muted: !bonusB
      }
    });
  }

  const totalA = a.benefits.reduce((sum, benefit) => sum + (benefit.estimatedValue ?? 0), 0);
  const totalB = b.benefits.reduce((sum, benefit) => sum + (benefit.estimatedValue ?? 0), 0);
  if (a.benefits.length > 0 || b.benefits.length > 0) {
    rows.push(
      {
        group: 'Benefits',
        label: 'Estimated benefits',
        a: {
          value: benefitValue(a, totalA),
          muted: a.benefits.length === 0
        },
        b: {
          value: benefitValue(b, totalB),
          muted: b.benefits.length === 0
        }
      },
      {
        group: 'Benefits',
        label: 'Benefit highlights',
        a: {
          value: summarizeNames(
            a.benefits.map((benefit) => benefit.name),
            3,
            'No listed benefits'
          ),
          muted: a.benefits.length === 0
        },
        b: {
          value: summarizeNames(
            b.benefits.map((benefit) => benefit.name),
            3,
            'No listed benefits'
          ),
          muted: b.benefits.length === 0
        }
      }
    );
  }

  if (a.transferPartners.length > 0 || b.transferPartners.length > 0) {
    rows.push({
      group: 'Benefits',
      label: 'Transfer partners',
      a: {
        value:
          a.transferPartners.length > 0
            ? `${a.transferPartners.length} listed`
            : 'None',
        detail: summarizeNames(
          a.transferPartners.map((partner) => partner.partnerName),
          4
        ),
        muted: a.transferPartners.length === 0
      },
      b: {
        value:
          b.transferPartners.length > 0
            ? `${b.transferPartners.length} listed`
            : 'None',
        detail: summarizeNames(
          b.transferPartners.map((partner) => partner.partnerName),
          4
        ),
        muted: b.transferPartners.length === 0
      }
    });
  }

  rows.push(
    {
      group: 'Profile',
      label: 'Credit needed',
      a: { value: formatCategory(a.creditTierMin) },
      b: { value: formatCategory(b.creditTierMin) }
    },
    {
      group: 'Profile',
      label: 'Network',
      a: { value: a.network ?? '—', muted: !a.network },
      b: { value: b.network ?? '—', muted: !b.network }
    },
    {
      group: 'Profile',
      label: 'Reward type',
      a: { value: formatCategory(a.rewardType) },
      b: { value: formatCategory(b.rewardType) }
    }
  );

  return rows;
}

function ComparisonCellContent({ cell }: { cell: ComparisonCell }) {
  return (
    <div className="min-w-0">
      <p
        className={`break-words text-base leading-6 ${
          cell.muted ? 'text-text-muted' : 'font-semibold text-text-primary'
        }`}
      >
        {cell.value}
      </p>
      {cell.detail ? (
        <p className="mt-1 break-words text-sm leading-5 text-text-muted">{cell.detail}</p>
      ) : null}
    </div>
  );
}

export function CardVsCardComparison({ a, b }: { a: CardDetail; b: CardDetail }) {
  const rows = buildComparisonRows(a, b);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8 overflow-hidden rounded-[1.2rem] border border-white/8 bg-bg-surface/80"
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b border-white/8 bg-black/10">
            <tr>
              <th
                scope="col"
                className="w-[24%] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
              >
                Metric
              </th>
              <th
                scope="col"
                className="w-[38%] px-5 py-4 text-sm font-semibold text-text-secondary"
              >
                {a.name}
              </th>
              <th
                scope="col"
                className="w-[38%] px-5 py-4 text-sm font-semibold text-text-secondary"
              >
                {b.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const showGroup = index === 0 || rows[index - 1].group !== row.group;

              return (
                <Fragment key={`${row.group}-${row.label}`}>
                  {showGroup ? (
                    <tr className="border-t border-white/10 bg-white/[0.025]">
                      <th
                        colSpan={3}
                        className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold"
                      >
                        {row.group}
                      </th>
                    </tr>
                  ) : null}
                  <tr className="border-t border-white/6 align-top">
                    <th
                      scope="row"
                      className="px-5 py-4 text-sm font-medium text-text-secondary"
                    >
                      {row.label}
                    </th>
                    <td className="px-5 py-4">
                      <ComparisonCellContent cell={row.a} />
                    </td>
                    <td className="px-5 py-4">
                      <ComparisonCellContent cell={row.b} />
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        {rows.map((row, index) => {
          const showGroup = index === 0 || rows[index - 1].group !== row.group;

          return (
            <Fragment key={`${row.group}-${row.label}`}>
              {showGroup ? (
                <div className="border-t border-white/10 bg-white/[0.025] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
                  {row.group}
                </div>
              ) : null}
              <div className="border-t border-white/6 px-4 py-4">
                <p className="text-sm font-semibold text-text-secondary">{row.label}</p>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-2 border-t border-white/6 pt-3">
                    <p className="break-words text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {a.name}
                    </p>
                    <ComparisonCellContent cell={row.a} />
                  </div>
                  <div className="grid gap-2 border-t border-white/6 pt-3">
                    <p className="break-words text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {b.name}
                    </p>
                    <ComparisonCellContent cell={row.b} />
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}
