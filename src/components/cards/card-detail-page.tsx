import Link from 'next/link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { EntityImage } from '@/components/ui/entity-image';
import { DetailPageDismissButton } from '@/components/ui/detail-page-dismiss-button';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import {
  buildCardComparisonCardSummary,
  defaultCardComparisonAssumptions
} from '@/lib/card-compare';
import type { CardDetail, CardRecord, SpendingCategoryValue } from '@/lib/cards';
import {
  formatCardCreditTier,
  formatCardCurrency,
  formatCardSpendWindow,
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

function formatRewardTypeLabel(rewardType: CardDetail['rewardType']) {
  if (rewardType === 'cashback') return 'Cash back';
  if (rewardType === 'miles') return 'Miles';
  return 'Points';
}

function formatCardTypeLabel(cardType: CardDetail['cardType']) {
  if (cardType === 'business') return 'Business card';
  if (cardType === 'student') return 'Student card';
  if (cardType === 'secured') return 'Secured card';
  return 'Personal card';
}

function normalizeCategories(categories: SpendingCategoryValue[]) {
  return categories.filter((category) => category !== 'other');
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
  const summary = buildCardComparisonCardSummary(card, defaultCardComparisonAssumptions);
  const activeBonuses = card.signUpBonuses.filter((bonus) => bonus.isCurrentOffer !== false);
  const bonusCandidates = activeBonuses.length > 0 ? activeBonuses : card.signUpBonuses;
  const primaryBonus = [...bonusCandidates].sort((a, b) => b.bonusValue - a.bonusValue)[0];
  const applyHref = buildApplyHref(card);
  const pointsAdvisorProgramId = getPointsAdvisorProgramFromCardSlug(card.slug);
  const pointsAdvisorHref = pointsAdvisorProgramId
    ? buildPointsAdvisorHref({ programId: pointsAdvisorProgramId })
    : null;
  const assumptionMonthlySpend = Object.values(defaultCardComparisonAssumptions.monthlySpend).reduce(
    (sum, value) => sum + value,
    0
  );
  const topRewards = [...card.rewards]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);
  const offsettingCredits = card.benefits.filter(isOffsettingCreditBenefit);
  const highlightedBenefits = [...card.benefits]
    .sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
    .slice(0, 4);
  const compareCandidates = buildCompareCandidates(card, cards);
  const displayCategories = normalizeCategories(card.topCategories);

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="card_detail_view"
        properties={{ source: 'card_detail_page', card_slug: card.slug, path: `/cards/${card.slug}` }}
      />

      <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative">
          <DetailPageDismissButton
            fallbackHref="/cards"
            ariaLabel="Close card details"
            className="absolute right-0 top-0 z-10"
          />

          <Link
            href="/cards"
            className="inline-flex items-center text-sm font-medium text-text-muted transition hover:text-text-primary"
          >
            Back to cards
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            <div>
              <div
                className={`overflow-hidden rounded-[1.4rem] border border-white/10 shadow-[0_16px_42px_rgba(0,0,0,0.22)] ${
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
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-3.5 text-base font-semibold text-black transition hover:opacity-90"
                >
                  Build my plan with this card
                </Link>
                {pointsAdvisorHref ? (
                  <Link
                    href={pointsAdvisorHref}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3.5 text-base font-semibold text-text-primary transition hover:border-white/30 hover:text-brand-teal"
                  >
                    See best use for these points
                  </Link>
                ) : null}
                {compareCandidates[0] ? (
                  <Link
                    href={compareCandidates[0].compareHref}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3.5 text-base font-semibold text-text-primary transition hover:border-white/30 hover:text-brand-teal"
                  >
                    Compare this card
                  </Link>
                ) : null}
                {applyHref ? (
                  <AffiliateLink
                    href={applyHref}
                    cardSlug={card.slug}
                    source="card_detail_page"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3.5 text-base font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    View current offer
                  </AffiliateLink>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
                {card.issuer}
              </p>
              <h1 className="mt-4 max-w-[14ch] font-heading text-[clamp(2.8rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.05em] text-text-primary">
                {card.name}
              </h1>
              <p className="mt-4 max-w-3xl text-[1.02rem] leading-7 text-text-secondary">
                {card.longDescription ?? card.description ?? card.headline}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {displayCategories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-[11px] text-brand-teal"
                  >
                    Best for {formatSpendCategoryLabel(category)}
                  </span>
                ))}
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {formatRewardTypeLabel(card.rewardType)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {formatCardTypeLabel(card.cardType)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {formatCardCreditTier(card.creditTierMin)} credit
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.15rem] border border-brand-gold/20 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Year-one value</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-brand-gold">
                    {formatCardCurrency(summary.firstYearValue)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    Balanced assumption model with the welcome offer included.
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Ongoing value</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {formatCardCurrency(summary.ongoingValue)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    Rewards plus usable credits minus the annual fee.
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Welcome offer</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {summary.welcomeOfferValue > 0 ? formatCardCurrency(summary.welcomeOfferValue) : 'None'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {primaryBonus
                      ? `${formatCardCurrency(primaryBonus.spendRequired)} in ${formatCardSpendWindow(primaryBonus.spendPeriodDays, { abbreviated: false }) ?? 'the issuer window'}`
                      : 'No active welcome-offer hurdle in the dataset.'}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Usable credits</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {summary.usedCreditsValue > 0 ? formatCardCurrency(summary.usedCreditsValue) : 'None'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    Assumes {defaultCardComparisonAssumptions.creditUsagePercent}% real-world usage.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-text-secondary">
                Modeled on a balanced {formatCardCurrency(assumptionMonthlySpend)}/month spend mix,{' '}
                {defaultCardComparisonAssumptions.pointValueCents.toFixed(1)} cpp point valuation, and{' '}
                {defaultCardComparisonAssumptions.creditUsagePercent}% credit usage.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {getCardDecisionMetrics(card).map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-bg-elevated/70 px-3.5 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
            <p
              className={`mt-1 text-sm font-semibold ${
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
            <p className="mt-1 text-[11px] leading-4 text-text-muted">{stat.detail}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          {topRewards.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">How You Earn</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Where this card pays you back</h2>
              <div className="mt-4 space-y-3">
                {topRewards.map((reward, index) => (
                  <div
                    key={`${reward.category}-${index}`}
                    className="flex items-start justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/15 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatSpendCategoryLabel(reward.category)}
                      </p>
                      {(reward.notes || reward.capAmount != null) ? (
                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                          {reward.notes ??
                            `Up to ${formatCardCurrency(reward.capAmount ?? 0)}${
                              reward.capPeriod ? `/${reward.capPeriod}` : ''
                            }`}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-base font-semibold text-brand-teal">
                      {formatRewardRate(reward.rate, reward.rateType)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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

          {compareCandidates.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Compare Next</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Pressure-test this card against real alternatives</h2>
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
                      className="rounded-[1.2rem] border border-white/8 bg-black/15 p-4"
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
                        className="mt-4 inline-flex items-center text-sm font-semibold text-brand-teal transition hover:underline"
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

          <section className="rounded-[1.6rem] border border-brand-teal/20 bg-brand-teal/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Next Move</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">Turn this card into an actual plan</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {pointsAdvisorHref
                ? "If you already earn this card's points, either build the full card plan or jump straight into the redemption advisor to see the strongest use for the balance."
                : 'If this is the card you want to anchor around, send it straight into the planner and let the sequencing logic decide whether it should be first, later, or skipped.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={buildSelectedOfferIntentHref({
                  lane: 'cards',
                  slug: card.slug,
                  audience: card.cardType === 'business' ? 'business' : undefined
                })}
                className="inline-flex items-center rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Build my plan with this card
              </Link>
              {pointsAdvisorHref ? (
                <Link
                  href={pointsAdvisorHref}
                  className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-white/30 hover:text-text-primary"
                >
                  See best use for these points
                </Link>
              ) : compareCandidates[0] ? (
                <Link
                  href={compareCandidates[0].compareHref}
                  className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-white/30 hover:text-text-primary"
                >
                  Compare first
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
