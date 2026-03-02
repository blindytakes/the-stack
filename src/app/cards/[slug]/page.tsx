import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCardSlugs, getCardBySlug } from '@/lib/cards';
import { formatCategory } from '@/lib/format';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
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
    description: card.description ?? `${card.name} by ${card.issuer} - ${card.headline}`
  };
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
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

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">{card.issuer}</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-text-primary">{card.name}</h1>
          <p className="mt-3 text-lg text-text-secondary">{card.headline}</p>
          {card.longDescription && (
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{card.longDescription}</p>
          )}
          {card.editorRating != null && (
            <div className="mt-4">
              <CardRatingStars rating={card.editorRating} />
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-bg-elevated p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Quick Facts</p>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-text-secondary">Annual Fee</dt>
              <dd className="text-sm font-semibold text-text-primary">
                {formatCardCurrency(card.annualFee)}
              </dd>
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
            <div className="flex justify-between">
              <dt className="text-sm text-text-secondary">Foreign Tx Fee</dt>
              <dd
                className={`text-sm font-semibold ${
                  card.foreignTxFee === 0 ? 'text-brand-teal' : 'text-text-primary'
                }`}
              >
                {card.foreignTxFee === 0 ? 'None' : `${card.foreignTxFee}%`}
              </dd>
            </div>
            {card.introApr && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Intro APR</dt>
                <dd className="text-sm font-semibold text-text-primary">{card.introApr}</dd>
              </div>
            )}
            {card.regularAprMin != null && card.regularAprMax != null && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Regular APR</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {card.regularAprMin}% - {card.regularAprMax}%
                </dd>
              </div>
            )}
            {card.cardType !== 'personal' && (
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">Card Type</dt>
                <dd className="text-sm font-semibold capitalize text-text-primary">{card.cardType}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {card.topCategories
              .filter((category) => category !== 'all')
              .map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal"
                >
                  {formatCategory(category)}
                </span>
              ))}
          </div>

          {applyHref && (
            <AffiliateLink
              href={applyHref}
              cardSlug={card.slug}
              source={source}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Apply Now
            </AffiliateLink>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-10 lg:max-w-2xl">
        <CardSignUpBonusSection bonuses={card.signUpBonuses} />
        <CardRewardsSection rewards={card.rewards} rewardType={card.rewardType} />
        <CardBenefitsSection benefits={card.benefits} />
        <CardTransferPartnersSection partners={card.transferPartners} />
        <CardProsConsSection pros={card.pros} cons={card.cons} />
      </div>
    </div>
  );
}
