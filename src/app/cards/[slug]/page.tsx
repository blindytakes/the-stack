import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCardSlugs, getCardBySlug } from '@/lib/cards';
import { formatCategory } from '@/lib/format';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { EntityImage } from '@/components/ui/entity-image';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { trackedSourceSchema } from '@/lib/tracking';
import {
  CardBenefitsSection,
  CardProsConsSection,
  CardRatingStars,
  CardRewardsSection,
  CardSignUpBonusSection,
  CardTransferPartnersSection,
  formatCardCurrency
} from '@/components/cards/card-detail-sections';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string | string[] }>;
};

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
    description: card.description ?? `${card.name} by ${card.issuer} - offer details and value breakdown`
  };
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatCreditTierLabel(creditTier: string): string {
  if (creditTier === 'excellent') return 'Excellent credit';
  if (creditTier === 'good') return 'Good to excellent credit';
  if (creditTier === 'fair') return 'Fair to good credit';
  return 'Building credit';
}

function formatAprRange(min?: number, max?: number): string {
  if (min == null || max == null) return 'Varies by issuer terms';
  return `${min}% - ${max}%`;
}

export default async function CardDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  const card = await getCardBySlug(slug);
  if (!card) notFound();

  const sourceInput = firstParam(search.src) ?? 'card_detail';
  const parsedSource = trackedSourceSchema.safeParse(sourceInput);
  const source = parsedSource.success ? parsedSource.data : 'card_detail';

  const outboundApplyUrl = card.affiliateUrl ?? card.applyUrl;
  const applyHref = outboundApplyUrl
    ? `/api/affiliate/click?${new URLSearchParams({
        card_slug: card.slug,
        source,
        target: outboundApplyUrl
      }).toString()}`
    : null;
  const topCategories = card.topCategories.filter((category) => category !== 'all');
  const topCategoryLabels = topCategories.map((category) => formatCategory(category));
  const activeBonuses = card.signUpBonuses.filter((bonus) => bonus.isCurrentOffer !== false);
  const bestBonus = [...activeBonuses].sort((a, b) => b.bonusValue - a.bonusValue)[0];
  const estimatedBonusValue = bestBonus?.bonusValue ?? 0;
  const estimatedBenefitsValue = card.benefits.reduce(
    (sum, benefit) => sum + (benefit.estimatedValue ?? 0),
    0
  );
  const estimatedFirstYearValue =
    estimatedBonusValue + estimatedBenefitsValue - card.annualFee;
  const fitBullets = [
    `${formatCreditTierLabel(card.creditTierMin)} or better`,
    card.annualFee === 0
      ? 'You prefer no-annual-fee cards'
      : `You can offset the ${formatCardCurrency(card.annualFee)} annual fee with real usage`,
    topCategoryLabels.length > 0
      ? `You spend meaningfully on ${topCategoryLabels.slice(0, 2).join(' and ')}`
      : 'You want a solid all-around card'
  ];
  const cautionBullets = [
    card.annualFee > 0 ? 'You avoid paying annual fees' : '',
    card.foreignTxFee > 0 ? 'You spend heavily outside the U.S.' : '',
    card.rewardType !== 'cashback'
      ? 'You want fixed cash-back value without points strategy'
      : 'You prefer travel transfer partner redemptions',
    card.creditTierMin === 'excellent' ? 'You are still building or repairing credit' : ''
  ].filter(Boolean);
  const quickFacts = [
    { label: 'Annual Fee', value: formatCardCurrency(card.annualFee) },
    { label: 'Credit Profile', value: formatCreditTierLabel(card.creditTierMin) },
    {
      label: 'Reward Style',
      value:
        card.rewardType === 'cashback'
          ? 'Cash back'
          : card.rewardType === 'points'
            ? 'Points'
            : 'Miles'
    },
    {
      label: 'Foreign Spend',
      value: card.foreignTxFee === 0 ? 'No foreign transaction fee' : `${card.foreignTxFee}% fee`
    }
  ];
  const imagePresentation = getCardImagePresentation(card.slug);
  const detailImageClassName = imagePresentation?.imgClassName ?? 'bg-black/5 p-2';

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="card_detail_view"
        properties={{ source, card_slug: card.slug, path: `/cards/${card.slug}` }}
      />

      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/cards" className="transition hover:text-text-secondary">
          Cards
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{card.name}</span>
      </nav>

      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-elevated p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">{card.issuer}</p>
            <h1 className="mt-2 font-heading text-4xl text-text-primary">{card.name}</h1>
            <p className="mt-3 text-lg text-text-secondary">{card.headline}</p>
            {card.longDescription && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
                {card.longDescription}
              </p>
            )}
            {card.editorRating != null && (
              <div className="mt-4">
                <CardRatingStars rating={card.editorRating} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {topCategoryLabels.length > 0 ? (
                topCategoryLabels.slice(0, 4).map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal"
                  >
                    Best for {category}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal">
                  Best for general spending
                </span>
              )}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{fact.label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Card Snapshot</p>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-bg/70 p-3">
              <EntityImage
                src={card.imageUrl}
                alt={`${card.name} card art`}
                label={card.name}
                className="aspect-[1.586/1] rounded-[1.25rem]"
                imgClassName={detailImageClassName}
                fallbackClassName="bg-black/10"
                priority
                fit={imagePresentation?.fit}
                position={imagePresentation?.position}
                scale={imagePresentation?.scale}
              />
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Best listed offer</p>
                <p className="mt-2 text-xl font-semibold text-brand-gold">
                  {estimatedBonusValue > 0 ? `$${estimatedBonusValue.toLocaleString()} est.` : 'See issuer site'}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {bestBonus ? 'Based on the strongest current offer in our data.' : 'Check the live page for the latest bonus.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Annual fee</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {formatCardCurrency(card.annualFee)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Credit needed</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {formatCreditTierLabel(card.creditTierMin)}
                  </p>
                </div>
              </div>
            </div>
            {applyHref && (
              <>
                <AffiliateLink
                  href={applyHref}
                  cardSlug={card.slug}
                  source={source}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  View Current Offer & Apply
                </AffiliateLink>
                <p className="mt-2 text-xs text-text-muted">
                  Opens the live issuer or partner offer page so you can confirm terms before you apply.
                </p>
              </>
            )}
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/tools/card-vs-card" className="text-brand-teal transition hover:underline">
                Compare against another card
              </Link>
              <Link href="/cards" className="text-text-secondary transition hover:text-text-primary">
                Back to card directory
              </Link>
            </div>
          </aside>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">First-Year Value Snapshot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Welcome Offer Est.</p>
                <p className="mt-2 text-xl font-semibold text-brand-gold">
                  {estimatedBonusValue > 0
                    ? `$${estimatedBonusValue.toLocaleString()}`
                    : 'No current offer listed'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Perks Value Est.</p>
                <p className="mt-2 text-xl font-semibold text-brand-teal">
                  {estimatedBenefitsValue > 0
                    ? `$${estimatedBenefitsValue.toLocaleString()}/yr`
                    : 'Not enough data'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Annual Fee</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">
                  {formatCardCurrency(card.annualFee)}
                </p>
              </div>
            </div>
          </section>

          <CardSignUpBonusSection bonuses={card.signUpBonuses} />
          <CardRewardsSection rewards={card.rewards} rewardType={card.rewardType} />
          <CardBenefitsSection benefits={card.benefits} />
          <CardTransferPartnersSection partners={card.transferPartners} />
          <CardProsConsSection pros={card.pros} cons={card.cons} />

          <section className="rounded-2xl border border-white/10 bg-bg-surface p-6">
            <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Rates & Terms</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                <dt className="text-sm text-text-secondary">Credit needed</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {formatCreditTierLabel(card.creditTierMin)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                <dt className="text-sm text-text-secondary">Intro APR</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {card.introApr ?? 'No intro APR listed'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                <dt className="text-sm text-text-secondary">Regular APR</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {formatAprRange(card.regularAprMin, card.regularAprMax)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                <dt className="text-sm text-text-secondary">Foreign transaction fee</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {card.foreignTxFee === 0 ? 'None' : `${card.foreignTxFee}%`}
                </dd>
              </div>
              {card.network && (
                <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                  <dt className="text-sm text-text-secondary">Network</dt>
                  <dd className="text-sm font-semibold capitalize text-text-primary">{card.network}</dd>
                </div>
              )}
              {card.cardType !== 'personal' && (
                <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-bg/40 p-3">
                  <dt className="text-sm text-text-secondary">Card type</dt>
                  <dd className="text-sm font-semibold capitalize text-text-primary">{card.cardType}</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-xs text-text-muted">
              Rates and offers can change. Confirm final terms on the issuer site before applying.
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-2xl border border-white/10 bg-bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Quick Verdict</p>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {card.description ?? `${card.name} is strongest for people who can extract recurring value from its core perks and reward structure.`}
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-bg/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Estimated First-Year Net Value</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  estimatedFirstYearValue >= 0 ? 'text-brand-teal' : 'text-brand-coral'
                }`}
              >
                {estimatedFirstYearValue >= 0 ? '+' : ''}${estimatedFirstYearValue.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Estimate = welcome offer + listed perks value - annual fee. Actual results vary.
              </p>
            </div>
            <p className="mt-4 text-sm font-semibold text-brand-teal">Good fit if:</p>
            <ul className="mt-2 space-y-2">
              {fitBullets.map((bullet) => (
                <li key={bullet} className="text-sm text-text-secondary">
                  <span className="mr-2 text-brand-teal">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
            {cautionBullets.length > 0 ? (
              <>
                <p className="mt-4 text-sm font-semibold text-brand-coral">Think twice if:</p>
                <ul className="mt-2 space-y-2">
                  {cautionBullets.slice(0, 3).map((bullet) => (
                    <li key={bullet} className="text-sm text-text-secondary">
                      <span className="mr-2 text-brand-coral">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Next Step</p>
            <p className="mt-3 text-sm text-text-secondary">
              Compare this card against alternatives before deciding.
            </p>
            <div className="mt-4 space-y-2">
              <Link
                href="/tools/card-vs-card"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Compare Cards
              </Link>
              <Link
                href="/tools/card-finder?mode=full"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Find Better-Fit Cards
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
