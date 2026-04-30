import Link from 'next/link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { EntityImage } from '@/components/ui/entity-image';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import type { CardDetail, CardRecord, SpendingCategoryValue } from '@/lib/cards';
import {
  formatCardCurrency,
  getCardDecisionMetrics,
  isOffsettingCreditBenefit
} from '@/lib/cards/presentation-metrics';
import { formatSpendCategoryLabel } from '@/lib/cards-directory-explorer';
import {
  buildPointsAdvisorHref,
  getPointsAdvisorProgramFromCardSlug
} from '@/lib/points-advisor';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type CardDetailPageProps = {
  card: CardDetail;
  cards: CardRecord[];
};

type CompareCandidate = {
  card: CardRecord;
  compareHref: string;
  reason: string;
  score: number;
};

function buildApplyHref(card: CardDetail) {
  const outboundApplyUrl = card.affiliateUrl ?? card.applyUrl;
  if (!outboundApplyUrl) return null;

  return `/api/affiliate/click?${new URLSearchParams({
    card_slug: card.slug,
    source: 'card_detail_page',
    target: outboundApplyUrl
  }).toString()}`;
}

function formatRewardRate(rate: number, rateType: CardDetail['rewardType']) {
  if (rateType === 'cashback') return `${rate}%`;
  return `${rate}x`;
}

function normalizeCategories(categories: SpendingCategoryValue[]) {
  return categories.filter((category) => category !== 'other');
}

function formatCalendarDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(date);
}

function formatLowerSpendCategoryLabel(category: SpendingCategoryValue) {
  if (category === 'all') return 'everyday spend';
  return formatSpendCategoryLabel(category).toLowerCase();
}

function formatCategoryFit(categories: SpendingCategoryValue[]) {
  const labels = categories.slice(0, 2).map(formatLowerSpendCategoryLabel);
  if (labels.length === 0) return 'normal card spend';
  if (labels.length === 1) return labels[0];
  return `${labels[0]} and ${labels[1]}`;
}

function getCardRequiredMonthlySpendLabel(card: CardDetail) {
  if (
    typeof card.bestSignUpBonusSpendRequired !== 'number' ||
    card.bestSignUpBonusSpendRequired <= 0 ||
    typeof card.bestSignUpBonusSpendPeriodDays !== 'number' ||
    card.bestSignUpBonusSpendPeriodDays <= 0
  ) {
    return null;
  }

  return `${formatCardCurrency(
    card.bestSignUpBonusSpendRequired / (card.bestSignUpBonusSpendPeriodDays / 30)
  )}/mo`;
}

function formatRewardNoteLines(reward: CardDetail['rewards'][number]) {
  const note =
    reward.notes ??
    (reward.capAmount != null
      ? `Up to ${formatCardCurrency(reward.capAmount)}${
          reward.capPeriod ? `/${reward.capPeriod}` : ''
        }`
      : '');

  if (!note) return [];

  return note.split(/ and (?=\d+(?:x|X|%))/).map((line) => {
    const withoutLeadingRate = line
      .trim()
      .replace(/^\d+(?:x|X|%)\s+(?:points|miles)\s+on\s+/i, '');

    return withoutLeadingRate
      ? withoutLeadingRate.charAt(0).toUpperCase() + withoutLeadingRate.slice(1)
      : withoutLeadingRate;
  });
}

function buildCompareReason(current: CardDetail, candidate: CardRecord) {
  const sharedCategories = normalizeCategories(candidate.topCategories).filter((category) =>
    normalizeCategories(current.topCategories).includes(category)
  );

  if (sharedCategories.length > 0 && candidate.rewardType === current.rewardType) {
    return `Similar ${formatSpendCategoryLabel(sharedCategories[0])} profile with a different fee and perk mix.`;
  }

  if (candidate.annualFee === 0 && current.annualFee > 0) {
    return 'Useful no-fee alternative if you want less annual-fee drag.';
  }

  if (candidate.annualFee > 0 && current.annualFee === 0) {
    return 'Step-up option if you want more upside than a no-fee card.';
  }

  if ((candidate.foreignTxFee ?? 0) === 0 && current.foreignTxFee > 0) {
    return 'Travel-friendlier alternative with no foreign transaction fee.';
  }

  if (candidate.rewardType !== current.rewardType) {
    return 'Same use case, but with a different rewards style.';
  }

  return 'Closest alternative in the current card set.';
}

function buildCompareCandidates(current: CardDetail, cards: CardRecord[]) {
  const currentCategories = normalizeCategories(current.topCategories);

  return cards
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate): CompareCandidate => {
      const sharedCategories = normalizeCategories(candidate.topCategories).filter((category) =>
        currentCategories.includes(category)
      );
      const feeDifference = Math.abs(candidate.annualFee - current.annualFee);
      const cardTypeScore = candidate.cardType === current.cardType ? 40 : 0;
      const rewardTypeScore = candidate.rewardType === current.rewardType ? 32 : 0;
      const categoryScore = sharedCategories.length * 20;
      const feeScore = Math.max(0, 28 - Math.min(feeDifference, 280) / 10);
      const travelScore =
        (candidate.foreignTxFee ?? 0) === 0 && current.foreignTxFee === 0 ? 8 : 0;
      const compareHref = `/cards/compare?${new URLSearchParams({
        a: current.slug,
        b: candidate.slug
      }).toString()}`;

      return {
        card: candidate,
        compareHref,
        reason: buildCompareReason(current, candidate),
        score: cardTypeScore + rewardTypeScore + categoryScore + feeScore + travelScore
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function CardDetailPage({ card, cards }: CardDetailPageProps) {
  const cardImage = getCardImageDisplay({
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    imageUrl: card.imageUrl,
    imageAssetType: card.imageAssetType
  });
  const applyHref = buildApplyHref(card);
  const pointsAdvisorProgramId = getPointsAdvisorProgramFromCardSlug(card.slug);
  const pointsAdvisorHref = pointsAdvisorProgramId
    ? buildPointsAdvisorHref({ programId: pointsAdvisorProgramId })
    : null;
  const topRewards = [...card.rewards]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);
  const offsettingCredits = card.benefits.filter(isOffsettingCreditBenefit);
  const highlightedBenefits = [...card.benefits]
    .sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
    .slice(0, 4);
  const compareCandidates = buildCompareCandidates(card, cards);
  const displayCategories = normalizeCategories(card.topCategories);
  const decisionMetrics = getCardDecisionMetrics(card);
  const heroDecisionMetrics = [
    ...decisionMetrics.filter((metric) => metric.label === 'Bonus ROI'),
    ...decisionMetrics.filter(
      (metric) => metric.label !== 'Bonus ROI' && metric.label !== 'Offsetting credits'
    )
  ];
  const useSingleLineTitle = card.name.length <= 26;
  const verifiedLabel = formatCalendarDate(card.lastVerified);
  const monthlyRequiredSpend = getCardRequiredMonthlySpendLabel(card);
  const categoryFit = formatCategoryFit(displayCategories);
  const verdictTitle =
    card.annualFee >= 395
      ? 'Strong fit if your spend and credits line up'
      : card.annualFee > 0
        ? 'Worth a closer look if the benefits fit your routine'
        : 'Low-friction option if the rewards match your spend';
  const bestFitText = monthlyRequiredSpend
    ? `Best fit if ${categoryFit} is already in your budget and you can route about ${monthlyRequiredSpend} of normal spend.`
    : `Best fit if ${categoryFit} is already in your budget and the card perks match your routine.`;
  const watchoutText =
    card.annualFee > 0
      ? `${formatCardCurrency(card.annualFee)} fee only works if the benefits are useful without changing your spending behavior.`
      : 'Low fee drag, but still compare the rewards against simpler cards.';
  const hasSecondaryActions = Boolean(pointsAdvisorHref || compareCandidates[0] || applyHref);

  return (
    <div className="container-page pt-5 pb-16 md:pt-8">
      <TrackFunnelEventOnView
        event="card_detail_view"
        properties={{ source: 'card_detail_page', card_slug: card.slug, path: `/cards/${card.slug}` }}
      />

      <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <Link
                href="/cards"
                className="mb-4 inline-flex items-center text-sm font-medium text-text-muted transition hover:text-text-primary"
              >
                Back to cards
              </Link>

              <div
                className={`w-full max-w-full overflow-hidden rounded-[1.4rem] border border-white/10 shadow-[0_16px_42px_rgba(0,0,0,0.22)] ${
                  cardImage.imageAssetType === 'card_art' ? 'bg-black/20 p-0' : 'bg-black/10 p-2.5'
                }`}
              >
                <EntityImage
                  src={cardImage.src}
                  alt={cardImage.alt}
                  label={cardImage.label}
                  className="aspect-[1.586/1] rounded-[1.1rem]"
                  imgClassName={cardImage.presentation.imgClassName}
                  fallbackClassName="bg-black/10"
                  fallbackVariant={cardImage.fallbackVariant}
                  fit={cardImage.presentation.fit}
                  position={cardImage.presentation.position}
                  scale={cardImage.presentation.scale}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={buildSelectedOfferIntentHref({
                    lane: 'cards',
                    slug: card.slug,
                    audience: card.cardType === 'business' ? 'business' : undefined
                  })}
                  className="inline-flex min-h-[4.75rem] items-center justify-center rounded-full bg-brand-teal px-5 py-3.5 text-center text-lg font-semibold leading-tight text-black transition hover:opacity-90"
                >
                  <span className="block">
                    <span className="block">Build my bonus plan</span>
                    <span className="block">with this card</span>
                  </span>
                </Link>
                {hasSecondaryActions ? (
                  <details className="group rounded-[1.15rem] border border-white/8 bg-white/[0.02]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-secondary transition hover:text-text-primary [&::-webkit-details-marker]:hidden">
                      <span>Card tools</span>
                      <span className="text-base leading-none text-text-muted transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-white/8 px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {pointsAdvisorHref ? (
                          <Link
                            href={pointsAdvisorHref}
                            className="rounded-[0.9rem] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-brand-teal"
                          >
                            Run the points math
                          </Link>
                        ) : null}
                        {compareCandidates[0] ? (
                          <Link
                            href={compareCandidates[0].compareHref}
                            className="rounded-[0.9rem] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-brand-teal"
                          >
                            Compare against alternatives
                          </Link>
                        ) : null}
                        {applyHref ? (
                          <AffiliateLink
                            href={applyHref}
                            cardSlug={card.slug}
                            source="card_detail_page"
                            className="rounded-[0.9rem] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-brand-teal"
                          >
                            Go to issuer offer
                          </AffiliateLink>
                        ) : null}
                      </div>
                    </div>
                  </details>
                ) : null}
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
                {card.issuer}
              </p>
              <h1
                className={`mt-4 font-heading text-text-primary ${
                  useSingleLineTitle
                    ? 'max-w-full text-[1.4rem] leading-none tracking-[-0.03em] sm:whitespace-nowrap sm:text-[3.2rem] sm:tracking-[-0.04em] lg:text-[4.2rem] xl:text-[4.8rem]'
                    : 'max-w-[14ch] text-[2.8rem] leading-[0.94] tracking-[-0.05em] md:text-[4rem] xl:text-[4.8rem]'
                }`}
              >
                {card.name}
              </h1>
              <p className="mt-4 max-w-3xl text-[1.02rem] leading-7 text-text-secondary">
                {card.longDescription ?? card.description ?? card.headline}
              </p>

              {verifiedLabel ? (
                <p className="mt-5 text-xs leading-5 text-text-muted">
                  Last verified {verifiedLabel}. Confirm live issuer terms before applying.
                </p>
              ) : null}

              <div className="mt-6 border-y border-white/8 py-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:items-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-teal">
                      Bottom line
                    </p>
                    <p className="mt-2 text-base font-semibold leading-6 text-text-primary">
                      {verdictTitle}
                    </p>
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Best fit
                      </dt>
                      <dd className="mt-1 text-sm leading-5 text-text-secondary">{bestFitText}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Watch out
                      </dt>
                      <dd className="mt-1 text-sm leading-5 text-text-secondary">{watchoutText}</dd>
                    </div>
                  </dl>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[1.45rem] border border-white/10 bg-bg-elevated/50 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {heroDecisionMetrics.map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border border-white/8 bg-black/15 px-4 py-4 text-center"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
              <p
                className={`mt-3 whitespace-nowrap text-[1.45rem] font-semibold leading-none sm:text-[1.55rem] xl:text-[1.6rem] ${
                  stat.tone === 'positive'
                    ? 'text-brand-teal'
                    : stat.tone === 'warning'
                      ? 'text-brand-gold'
                      : stat.tone === 'negative'
                        ? 'text-brand-coral'
                        : 'text-text-primary'
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-3 text-sm leading-5 text-text-muted">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {topRewards.length > 0 ? (
        <section className="mt-4 rounded-[1.45rem] border border-white/10 bg-bg-elevated/50 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topRewards.map((reward, index) => {
              const rewardNoteLines = formatRewardNoteLines(reward);

              return (
                <div
                  key={`${reward.category}-${index}`}
                  className="flex min-h-[9.25rem] flex-col items-center rounded-xl border border-white/8 bg-black/15 px-4 py-4 text-center"
                >
                  <p className="flex min-h-8 items-center justify-center text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    {formatSpendCategoryLabel(reward.category)}
                  </p>
                  <p className="mt-2 text-[1.45rem] font-semibold leading-none text-brand-teal sm:text-[1.55rem] xl:text-[1.6rem]">
                    {formatRewardRate(reward.rate, reward.rateType)}
                  </p>
                  <p className="mt-3 text-sm leading-5 text-text-muted">
                    {rewardNoteLines.length > 0
                      ? rewardNoteLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))
                      : '\u00A0'}
                  </p>
                </div>
              );
            })}
          </div>
          {pointsAdvisorHref ? (
            <div className="mt-3 rounded-xl border border-brand-teal/15 bg-brand-teal/5 px-4 py-3 text-center">
              <p className="text-sm leading-6 text-text-secondary">
                Want to value the points side-by-side?{' '}
                <Link
                  href={pointsAdvisorHref}
                  className="font-semibold text-brand-teal transition hover:text-brand-teal/80"
                >
                  Run the points math
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          {highlightedBenefits.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Credits And Perks</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">What actually offsets the fee</h2>
              <div className="mt-4 space-y-3">
                {highlightedBenefits.map((benefit, index) => (
                  <div
                    key={`${benefit.name}-${index}`}
                    className="rounded-[1rem] border border-white/8 bg-black/15 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-text-primary">{benefit.name}</p>
                      {benefit.estimatedValue != null ? (
                        <span className="shrink-0 text-sm font-semibold text-brand-teal">
                          ~{formatCardCurrency(benefit.estimatedValue)}/yr
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">{benefit.description}</p>
                  </div>
                ))}
              </div>
              {offsettingCredits.length > 0 ? (
                <p className="mt-3 text-xs leading-5 text-text-muted">
                  {offsettingCredits.length} recurring credit{offsettingCredits.length === 1 ? '' : 's'} found in the current dataset.
                </p>
              ) : null}
            </section>
          ) : null}

        </div>

        <div className="space-y-6">
          {card.pros && card.pros.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400">Good Fit If</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Why you would choose it</h2>
              <ul className="mt-4 space-y-2">
                {card.pros.slice(0, 5).map((pro, index) => (
                  <li
                    key={`${pro}-${index}`}
                    className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {pro}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {card.cons && card.cons.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-red-400">Think Twice If</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Where it can disappoint</h2>
              <ul className="mt-4 space-y-2">
                {card.cons.slice(0, 5).map((con, index) => (
                  <li
                    key={`${con}-${index}`}
                    className="flex items-start gap-2 text-sm leading-6 text-text-secondary"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {con}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {card.transferPartners.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Transfer Partners</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Where the points can go</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {card.transferPartners.map((partner) => (
                  <span
                    key={`${partner.partnerName}-${partner.partnerType}`}
                    className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-sm text-text-secondary"
                  >
                    {partner.partnerName} {partner.transferRatio !== 1 ? `(${partner.transferRatio}:1)` : ''}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {applyHref ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Issuer Offer</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Check the live terms before applying</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Confirm the welcome offer, annual fee, credits, and eligibility rules on the issuer site.
              </p>
              <AffiliateLink
                href={applyHref}
                cardSlug={card.slug}
                source="card_detail_page"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-brand-gold/25 px-4 py-2.5 text-sm font-semibold text-brand-gold transition hover:border-brand-gold/50 hover:text-brand-gold/80"
              >
                Go to issuer offer
              </AffiliateLink>
            </section>
          ) : null}

        </div>
      </div>

      {compareCandidates.length > 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Compare Next</p>
          <h2 className="mt-2 font-heading text-2xl text-text-primary">
            Pressure-test this card against real alternatives
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {compareCandidates.map((candidate) => {
              const candidateImage = getCardImageDisplay({
                slug: candidate.card.slug,
                name: candidate.card.name,
                issuer: candidate.card.issuer,
                imageUrl: candidate.card.imageUrl,
                imageAssetType: candidate.card.imageAssetType
              });

              return (
                <article
                  key={candidate.card.slug}
                  className="flex h-full flex-col rounded-[1.2rem] border border-white/8 bg-black/15 p-4"
                >
                  <EntityImage
                    src={candidateImage.src}
                    alt={candidateImage.alt}
                    label={candidateImage.label}
                    className="aspect-[1.586/1] rounded-[1rem]"
                    imgClassName={candidateImage.presentation.imgClassName}
                    fallbackClassName="bg-black/10"
                    fallbackVariant={candidateImage.fallbackVariant}
                    fit={candidateImage.presentation.fit}
                    position={candidateImage.presentation.position}
                    scale={candidateImage.presentation.scale}
                  />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    {candidate.card.issuer}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">{candidate.card.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{candidate.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
                    <span className="rounded-full border border-white/10 px-2.5 py-1">
                      {candidate.card.annualFee === 0 ? 'No fee' : formatCardCurrency(candidate.card.annualFee)}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">
                      {candidate.card.bestSignUpBonusValue
                        ? `${formatCardCurrency(candidate.card.bestSignUpBonusValue)} bonus`
                        : 'No listed bonus'}
                    </span>
                  </div>
                  <Link
                    href={candidate.compareHref}
                    className="mt-auto inline-flex pt-4 text-sm font-semibold text-brand-teal transition hover:underline"
                  >
                    Compare these cards
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
