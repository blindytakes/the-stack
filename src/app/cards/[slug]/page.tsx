import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCardBySlug, getAllCardSlugs } from '@/lib/cards';
import type { RewardDetail, BenefitDetail, SignUpBonusDetail, TransferPartnerDetail } from '@/lib/cards';
import { formatCategory } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return { title: 'Card Not Found' };

  return {
    title: card.name,
    description:
      card.description ?? `${card.name} by ${card.issuer} — ${card.headline}`
  };
}

function formatCurrency(amount: number) {
  return amount === 0 ? 'Free' : `$${amount.toLocaleString()}`;
}

function formatRate(reward: RewardDetail) {
  if (reward.rateType === 'cashback') return `${reward.rate}%`;
  return `${reward.rate}x`;
}

function RatingStars({ rating }: { rating: number }) {
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

function RewardsSection({ rewards, rewardType }: { rewards: RewardDetail[]; rewardType: string }) {
  if (rewards.length === 0) return null;
  const sorted = [...rewards].sort((a, b) => b.rate - a.rate);
  const label = rewardType === 'cashback' ? 'Cash Back' : rewardType === 'miles' ? 'Miles' : 'Points';

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Rewards — {label}</h2>
      <div className="mt-4 space-y-2">
        {sorted.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-bg-surface px-5 py-3"
          >
            <div>
              <span className="text-sm font-medium text-text-primary">
                {formatCategory(r.category)}
              </span>
              {r.capAmount && (
                <span className="ml-2 text-xs text-text-muted">
                  up to ${r.capAmount.toLocaleString()}{r.capPeriod ? `/${r.capPeriod}` : ''}
                </span>
              )}
              {r.notes && (
                <p className="mt-0.5 text-xs text-text-muted">{r.notes}</p>
              )}
            </div>
            <span className="text-lg font-semibold text-brand-teal">{formatRate(r)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SignUpBonusSection({ bonuses }: { bonuses: SignUpBonusDetail[] }) {
  if (bonuses.length === 0) return null;
  const active = bonuses.filter((b) => b.isCurrentOffer !== false);
  if (active.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Sign-Up Bonus</h2>
      <div className="mt-4 space-y-3">
        {active.map((b, i) => (
          <div
            key={i}
            className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-5 py-4"
          >
            <p className="text-lg font-semibold text-brand-gold">
              {b.bonusType === 'statement_credit'
                ? `$${b.bonusValue} statement credit`
                : b.bonusPoints
                  ? `${b.bonusPoints.toLocaleString()} bonus points`
                  : `$${b.bonusValue} bonus`}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Spend ${b.spendRequired.toLocaleString()} in the first{' '}
              {Math.round(b.spendPeriodDays / 30)} months
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection({ benefits }: { benefits: BenefitDetail[] }) {
  if (benefits.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Benefits</h2>
      <div className="mt-4 space-y-2">
        {benefits.map((b, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-bg-surface px-5 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{b.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{b.description}</p>
              </div>
              {b.estimatedValue && (
                <span className="shrink-0 text-sm font-semibold text-brand-teal">
                  ~${b.estimatedValue}/yr
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TransferPartnersSection({ partners }: { partners: TransferPartnerDetail[] }) {
  if (partners.length === 0) return null;
  const airlines = partners.filter((p) => p.partnerType === 'airline');
  const hotels = partners.filter((p) => p.partnerType === 'hotel');
  const other = partners.filter((p) => p.partnerType !== 'airline' && p.partnerType !== 'hotel');

  const renderGroup = (label: string, group: TransferPartnerDetail[]) =>
    group.length > 0 && (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
        <div className="flex flex-wrap gap-2">
          {group.map((p) => (
            <span
              key={p.partnerName}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-secondary"
            >
              {p.partnerName}
              {p.transferRatio !== 1 && (
                <span className="ml-1 text-text-muted">({p.transferRatio}:1)</span>
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

function ProsConsSection({ pros, cons }: { pros?: string[]; cons?: string[] }) {
  if (!pros?.length && !cons?.length) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Pros & Cons</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {pros && pros.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-bg-surface p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-teal">Pros</p>
            <ul className="space-y-2">
              {pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 text-brand-teal">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {cons && cons.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-bg-surface p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-coral">Cons</p>
            <ul className="space-y-2">
              {cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 text-brand-coral">−</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function CardDetailPage({ params }: Props) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) notFound();

  return (
    <div className="container-page pt-12 pb-16">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/cards" className="hover:text-text-secondary transition">Cards</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{card.name}</span>
      </nav>

      {/* Hero */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">{card.issuer}</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-text-primary">{card.name}</h1>
          <p className="mt-3 text-lg text-text-secondary">{card.headline}</p>
          {card.longDescription && (
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{card.longDescription}</p>
          )}
          {card.editorRating && (
            <div className="mt-4">
              <RatingStars rating={card.editorRating} />
            </div>
          )}
        </div>

        {/* Quick facts sidebar */}
        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Quick Facts</p>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-text-secondary">Annual Fee</dt>
              <dd className="text-sm font-semibold text-text-primary">{formatCurrency(card.annualFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-text-secondary">Reward Type</dt>
              <dd className="text-sm font-semibold capitalize text-text-primary">{card.rewardType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-text-secondary">Credit Needed</dt>
              <dd className="text-sm font-semibold capitalize text-text-primary">{card.creditTierMin}</dd>
            </div>
            {card.network && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Network</dt>
                <dd className="text-sm font-semibold capitalize text-text-primary">{card.network}</dd>
              </div>
            )}
            {card.foreignTxFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Foreign Tx Fee</dt>
                <dd className="text-sm font-semibold text-text-primary">{card.foreignTxFee}%</dd>
              </div>
            )}
            {card.foreignTxFee === 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Foreign Tx Fee</dt>
                <dd className="text-sm font-semibold text-brand-teal">None</dd>
              </div>
            )}
            {card.introApr && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Intro APR</dt>
                <dd className="text-sm font-semibold text-text-primary">{card.introApr}</dd>
              </div>
            )}
            {card.regularAprMin && card.regularAprMax && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Regular APR</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {card.regularAprMin}% – {card.regularAprMax}%
                </dd>
              </div>
            )}
            {card.cardType && card.cardType !== 'personal' && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Card Type</dt>
                <dd className="text-sm font-semibold capitalize text-text-primary">{card.cardType}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {card.topCategories.filter((c) => c !== 'all').map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal"
              >
                {formatCategory(cat)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="mt-12 space-y-10 lg:max-w-2xl">
        <SignUpBonusSection bonuses={card.signUpBonuses} />
        <RewardsSection rewards={card.rewards} rewardType={card.rewardType} />
        <BenefitsSection benefits={card.benefits} />
        <TransferPartnersSection partners={card.transferPartners} />
        <ProsConsSection pros={card.pros} cons={card.cons} />
      </div>
    </div>
  );
}
