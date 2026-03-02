import type {
  BenefitDetail,
  RewardDetail,
  SignUpBonusDetail,
  TransferPartnerDetail
} from '@/lib/cards';
import { formatCategory } from '@/lib/format';

export function formatCardCurrency(amount: number) {
  return amount === 0 ? 'Free' : `$${amount.toLocaleString()}`;
}

function formatRate(reward: RewardDetail) {
  if (reward.rateType === 'cashback') return `${reward.rate}%`;
  return `${reward.rate}x`;
}

export function CardRatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            i < full
              ? 'text-brand-gold'
              : i === full && half
                ? 'text-brand-gold/50'
                : 'text-white/10'
          }
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm text-text-secondary">{rating.toFixed(1)}</span>
    </div>
  );
}

export function CardRewardsSection({
  rewards,
  rewardType
}: {
  rewards: RewardDetail[];
  rewardType: string;
}) {
  if (rewards.length === 0) return null;
  const sorted = [...rewards].sort((a, b) => b.rate - a.rate);
  const label =
    rewardType === 'cashback' ? 'Cash Back' : rewardType === 'miles' ? 'Miles' : 'Points';

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Rewards - {label}</h2>
      <div className="mt-4 space-y-2">
        {sorted.map((reward, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-bg-surface px-5 py-3"
          >
            <div>
              <span className="text-sm font-medium text-text-primary">
                {formatCategory(reward.category)}
              </span>
              {reward.capAmount != null && (
                <span className="ml-2 text-xs text-text-muted">
                  up to ${reward.capAmount.toLocaleString()}
                  {reward.capPeriod ? `/${reward.capPeriod}` : ''}
                </span>
              )}
              {reward.notes && <p className="mt-0.5 text-xs text-text-muted">{reward.notes}</p>}
            </div>
            <span className="text-lg font-semibold text-brand-teal">{formatRate(reward)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CardSignUpBonusSection({ bonuses }: { bonuses: SignUpBonusDetail[] }) {
  if (bonuses.length === 0) return null;
  const active = bonuses.filter((bonus) => bonus.isCurrentOffer !== false);
  if (active.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Sign-Up Bonus</h2>
      <div className="mt-4 space-y-3">
        {active.map((bonus, i) => (
          <div
            key={i}
            className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-5 py-4"
          >
            <p className="text-lg font-semibold text-brand-gold">
              {bonus.bonusType === 'statement_credit'
                ? `$${bonus.bonusValue} statement credit`
                : bonus.bonusPoints
                  ? `${bonus.bonusPoints.toLocaleString()} bonus points`
                  : `$${bonus.bonusValue} bonus`}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Spend ${bonus.spendRequired.toLocaleString()} in the first{' '}
              {Math.round(bonus.spendPeriodDays / 30)} months
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CardBenefitsSection({ benefits }: { benefits: BenefitDetail[] }) {
  if (benefits.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Benefits</h2>
      <div className="mt-4 space-y-2">
        {benefits.map((benefit, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-bg-surface px-5 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{benefit.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{benefit.description}</p>
              </div>
              {benefit.estimatedValue != null && (
                <span className="shrink-0 text-sm font-semibold text-brand-teal">
                  ~${benefit.estimatedValue}/yr
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CardTransferPartnersSection({ partners }: { partners: TransferPartnerDetail[] }) {
  if (partners.length === 0) return null;
  const airlines = partners.filter((partner) => partner.partnerType === 'airline');
  const hotels = partners.filter((partner) => partner.partnerType === 'hotel');
  const other = partners.filter(
    (partner) => partner.partnerType !== 'airline' && partner.partnerType !== 'hotel'
  );

  const renderGroup = (label: string, group: TransferPartnerDetail[]) =>
    group.length > 0 && (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
        <div className="flex flex-wrap gap-2">
          {group.map((partner) => (
            <span
              key={partner.partnerName}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-secondary"
            >
              {partner.partnerName}
              {partner.transferRatio !== 1 && (
                <span className="ml-1 text-text-muted">({partner.transferRatio}:1)</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Transfer Partners</h2>
      <div className="mt-4 space-y-4">
        {renderGroup('Airlines', airlines)}
        {renderGroup('Hotels', hotels)}
        {renderGroup('Other', other)}
      </div>
    </section>
  );
}

export function CardProsConsSection({ pros, cons }: { pros?: string[]; cons?: string[] }) {
  if (!pros?.length && !cons?.length) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Pros & Cons</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {pros && pros.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-bg-surface p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-teal">Pros</p>
            <ul className="space-y-2">
              {pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 text-brand-teal">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}
        {cons && cons.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-bg-surface p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-coral">Cons</p>
            <ul className="space-y-2">
              {cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 text-brand-coral">-</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
