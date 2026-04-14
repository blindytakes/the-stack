import Link from 'next/link';
import { AffiliateLink } from '@/components/analytics/affiliate-link';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingAccountType,
  formatBankingCustomerType,
  formatBankingCurrency,
  getBankingOfferAvailabilityLabel,
  getBankingOfferBestFit,
  getBankingOfferChecklist,
  getBankingOfferExecutionSummary,
  getBankingOfferGotchas,
  getBankingOfferPrimaryConstraint,
  getBankingOfferPrimaryRequirement,
  getBankingOfferRequirements,
  getBankingOfferThinkTwiceIf,
  getBankingOfferWhyInteresting,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import {
  extractActivityRequirement,
  formatBankingHoldPeriod,
  getBankingDecisionMetrics,
  getBankingRequiredDirectDepositAmount,
  getBankingRequiredFundingAmount
} from '@/lib/banking/presentation-metrics';
import {
  getBankingOfferCashRequirementLevel,
  getBankingOfferDifficulty,
  getBankingOfferTimeline,
  getBankingOfferTimelineBucket
} from '@/lib/banking/scoring';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type BankingDetailPageProps = {
  offer: BankingBonusListItem;
  offers: BankingBonusListItem[];
};

type RelatedOffer = {
  offer: BankingBonusListItem;
  href: string;
  reason: string;
  score: number;
};

function formatCalendarDate(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function summarizeDetail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const firstSentenceMatch = trimmed.match(/^.*?[.?!](?:\s|$)/);
  const firstSentence = firstSentenceMatch?.[0]?.trim() ?? trimmed;

  if (firstSentence.length <= 150) return firstSentence;
  return `${firstSentence.slice(0, 147).trimEnd()}...`;
}

function formatCashRequirementLabel(level: ReturnType<typeof getBankingOfferCashRequirementLevel>) {
  if (level === 'none') return 'Low cash drag';
  if (level === 'light') return 'Light cash need';
  if (level === 'medium') return 'Meaningful cash need';
  return 'Heavy cash lockup';
}

function buildRelatedOfferReason(current: BankingBonusListItem, candidate: BankingBonusListItem) {
  if (candidate.directDeposit.required !== current.directDeposit.required) {
    return candidate.directDeposit.required
      ? 'Higher-friction alternative if you can route qualifying direct deposit.'
      : 'Lower-friction alternative if you want to avoid moving direct deposit.';
  }

  if (candidate.accountType !== current.accountType) {
    return candidate.accountType === 'bundle'
      ? 'Bundle alternative with more moving parts but potentially more payout density.'
      : candidate.accountType === 'savings'
        ? 'Savings-based alternative if you would rather park cash than change banking behavior.'
        : 'Checking-based alternative with a different activity profile.';
  }

  if (candidate.customerType !== current.customerType) {
    return 'Closest match on requirements, but for a different customer type.';
  }

  if ((candidate.stateRestrictions?.length ?? 0) > 0 || (current.stateRestrictions?.length ?? 0) > 0) {
    return 'Nearby alternative if geography or state availability changes the decision.';
  }

  if (candidate.estimatedNetValue > current.estimatedNetValue) {
    return 'Higher modeled net value with a comparable qualification profile.';
  }

  if (candidate.estimatedNetValue < current.estimatedNetValue) {
    return 'Lower modeled payout, but potentially cleaner execution for the same use case.';
  }

  return 'Closest alternative in the current banking offer set.';
}

function buildRelatedOffers(current: BankingBonusListItem, offers: BankingBonusListItem[]): RelatedOffer[] {
  const currentCashLevel = getBankingOfferCashRequirementLevel(current);
  const currentTimeline = getBankingOfferTimelineBucket(current);
  const currentDifficulty = getBankingOfferDifficulty(current).level;
  const currentHasStateRestriction = (current.stateRestrictions?.length ?? 0) > 0;

  return offers
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      const candidateCashLevel = getBankingOfferCashRequirementLevel(candidate);
      const candidateTimeline = getBankingOfferTimelineBucket(candidate);
      const candidateDifficulty = getBankingOfferDifficulty(candidate).level;
      const candidateHasStateRestriction = (candidate.stateRestrictions?.length ?? 0) > 0;
      const bonusDifference = Math.abs(candidate.bonusAmount - current.bonusAmount);
      const netDifference = Math.abs(candidate.estimatedNetValue - current.estimatedNetValue);
      const score =
        (candidate.customerType === current.customerType ? 40 : 0) +
        (candidate.accountType === current.accountType ? 34 : 0) +
        (candidate.directDeposit.required === current.directDeposit.required ? 26 : 0) +
        (candidateCashLevel === currentCashLevel ? 18 : 0) +
        (candidateTimeline === currentTimeline ? 12 : 0) +
        (candidateDifficulty === currentDifficulty ? 10 : 0) +
        (candidateHasStateRestriction === currentHasStateRestriction ? 6 : 0) +
        Math.max(0, 20 - bonusDifference / 30) +
        Math.max(0, 18 - netDifference / 25);

      return {
        offer: candidate,
        href: `/banking/${candidate.slug}`,
        reason: buildRelatedOfferReason(current, candidate),
        score
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function BankingDetailPage({ offer, offers }: BankingDetailPageProps) {
  const imagePresentation = getBankingImagePresentation(offer.bankName);
  const checklistSteps = getBankingOfferChecklist(offer);
  const availabilityLabel = getBankingOfferAvailabilityLabel(offer);
  const verifiedLabel = formatCalendarDate(offer.lastVerified);
  const expiryLabel = formatCalendarDate(offer.expiresAt);
  const apyAsOfLabel = formatCalendarDate(offer.apyAsOf);
  const isExpired = Boolean(offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now());
  const showApy = Boolean(offer.apyDisplay) && offer.bankName.trim().toLowerCase() !== 'chase';
  const relatedOffers = buildRelatedOffers(offer, offers);
  const statCards = getBankingDecisionMetrics(offer);
  const difficulty = getBankingOfferDifficulty(offer);
  const timeline = getBankingOfferTimeline(offer);
  const requirements = getBankingOfferRequirements(offer);
  const whyInteresting = getBankingOfferWhyInteresting(offer);
  const bestFit = getBankingOfferBestFit(offer);
  const thinkTwice = getBankingOfferThinkTwiceIf(offer);
  const gotchas = getBankingOfferGotchas(offer);
  const primaryRequirement = getBankingOfferPrimaryRequirement(offer);
  const primaryConstraint = getBankingOfferPrimaryConstraint(offer);
  const executionSummary = getBankingOfferExecutionSummary(offer);
  const requiredFundingAmount = getBankingRequiredFundingAmount(offer);
  const directDepositMinimum = getBankingRequiredDirectDepositAmount(offer);
  const activityRequirement = extractActivityRequirement(offer);
  const sourcePath = `/banking/${offer.slug}`;
  const outboundOfferUrl = offer.affiliateUrl ?? offer.offerUrl;

  return (
    <div className="container-page pt-12 pb-16">
      <TrackFunnelEventOnView
        event="banking_detail_view"
        properties={{ source: 'banking_detail_page', bank_slug: offer.slug, path: `/banking/${offer.slug}` }}
      />

      <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative">
          <Link
            href="/banking"
            className="inline-flex items-center text-sm font-medium text-text-muted transition hover:text-text-primary"
          >
            Back to banking
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
            <aside>
              <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/10 p-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.22)]">
                <EntityImage
                  src={offer.imageUrl}
                  alt={`${offer.bankName} logo`}
                  label={offer.bankName}
                  className="aspect-[1.9/1] rounded-[1.05rem]"
                  imgClassName={imagePresentation?.imgClassName ?? 'bg-black/10 px-6 py-4'}
                  fallbackClassName="bg-black/10"
                  fallbackVariant="wordmark"
                  fallbackTextClassName="px-3 text-xl"
                  fit={imagePresentation?.fit}
                  position={imagePresentation?.position}
                  scale={imagePresentation?.scale ?? 1.04}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={buildSelectedOfferIntentHref({
                    lane: 'banking',
                    slug: offer.slug,
                    audience: offer.customerType === 'business' ? 'business' : undefined,
                    sourcePath
                  })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal px-5 py-3.5 text-base font-semibold text-black transition hover:opacity-90"
                >
                  Build my plan with this offer
                </Link>
                {outboundOfferUrl && !isExpired ? (
                  <AffiliateLink
                    href={outboundOfferUrl}
                    bankSlug={offer.slug}
                    source="banking_detail_page"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3.5 text-base font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    Go to bank offer
                  </AffiliateLink>
                ) : null}
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-brand-gold/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Modeled net value</p>
                <p className="mt-2 text-[2.05rem] font-semibold leading-none text-brand-gold">
                  {formatBankingCurrency(offer.estimatedNetValue)}
                </p>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  {formatBankingCurrency(offer.bonusAmount)} gross bonus less about {formatBankingCurrency(offer.estimatedFees)} in modeled fees.
                </p>
              </div>

              {(verifiedLabel || expiryLabel || (showApy && offer.apySourceUrl)) ? (
                <div className="mt-4 space-y-2 text-xs leading-5 text-text-muted">
                  {verifiedLabel ? <p>Last verified {verifiedLabel}. Confirm live terms before opening.</p> : null}
                  {expiryLabel ? <p>{isExpired ? `Offer expired ${expiryLabel}.` : `Offer ends ${expiryLabel}.`}</p> : null}
                  {showApy && offer.apySourceUrl ? (
                    <p>
                      {offer.apyDisplay ? `${offer.apyDisplay} APY` : 'APY source available'}
                      {apyAsOfLabel ? ` · Rate as of ${apyAsOfLabel}` : ''}
                    </p>
                  ) : null}
                  {showApy && offer.apySourceUrl ? (
                    <p>
                      <a
                        href={offer.apySourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold transition hover:text-brand-gold/80"
                      >
                        View APY source
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </aside>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
                {offer.bankName}
              </p>
              <h1 className="mt-4 max-w-[16ch] font-heading text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.94] tracking-[-0.05em] text-text-primary">
                {offer.offerName}
              </h1>
              <p className="mt-4 max-w-3xl text-[1.02rem] leading-7 text-text-secondary">
                {offer.headline}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
                {whyInteresting}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {formatBankingCustomerType(offer.customerType)}
                </span>
                <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-[11px] text-brand-teal">
                  {formatBankingAccountType(offer.accountType)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {offer.directDeposit.required ? 'Direct deposit required' : 'No direct deposit'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {availabilityLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
                  {difficulty.shortLabel}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.15rem] border border-brand-gold/20 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Gross bonus</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-brand-gold">
                    {formatBankingCurrency(offer.bonusAmount)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    Headline payout before any modeled fee drag.
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Funding threshold</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {requiredFundingAmount != null ? formatBankingCurrency(requiredFundingAmount) : 'Low'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {offer.directDeposit.required
                      ? directDepositMinimum != null
                        ? `${formatBankingCurrency(directDepositMinimum)}+ qualifying direct deposit`
                        : 'Qualifying direct deposit required'
                      : typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
                        ? `${formatBankingCurrency(offer.minimumOpeningDeposit)} opening deposit`
                        : 'No large upfront funding listed'}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Time to clear</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {timeline.shortLabel}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">{timeline.detail}</p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-muted">Friction</p>
                  <p className="mt-2 text-[2.05rem] font-semibold leading-none text-text-primary">
                    {difficulty.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">
                    {activityRequirement
                      ? `${activityRequirement}. ${difficulty.detail}`
                      : difficulty.detail}
                  </p>
                </div>
              </div>

              {requirements.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {requirements.slice(0, 6).map((requirement) => (
                    <span
                      key={requirement}
                      className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-text-secondary"
                    >
                      {requirement}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => (
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
          <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Execution Summary</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">What actually decides this offer</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1rem] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Primary requirement</p>
                <p className="mt-2 text-sm leading-6 text-text-primary">{primaryRequirement}</p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Primary constraint</p>
                <p className="mt-2 text-sm leading-6 text-text-primary">{primaryConstraint}</p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Execution model</p>
                <p className="mt-2 text-sm leading-6 text-text-primary">{executionSummary}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/15 px-4 py-3 text-sm leading-6 text-text-secondary">
              Cash profile: {formatCashRequirementLabel(getBankingOfferCashRequirementLevel(offer))}. Hold period:{' '}
              {formatBankingHoldPeriod(offer.holdingPeriodDays)}.
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Checklist</p>
                <h2 className="mt-2 font-heading text-2xl text-text-primary">How to complete it cleanly</h2>
              </div>
              <p className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">
                {checklistSteps.length} steps
              </p>
            </div>

            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {checklistSteps.map((step, index) => (
                <li
                  key={`${step.timing}-${step.title}-${index}`}
                  className="rounded-[1.05rem] border border-white/8 bg-bg/40 p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-[10px] font-semibold text-text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="inline-flex rounded-full border border-brand-teal/15 bg-brand-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-brand-teal">
                        {step.timing}
                      </p>
                      <h3 className="mt-2 text-sm font-semibold leading-5 text-text-primary">{step.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{summarizeDetail(step.detail)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400">Good Fit If</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">Who should actually do this</h2>
            <ul className="mt-4 space-y-2">
              {bestFit.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-secondary">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-red-400">Think Twice If</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">Where this can get annoying</h2>
            <ul className="mt-4 space-y-2">
              {thinkTwice.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-secondary">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Watch For</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">Failure points before you start</h2>
            <ul className="mt-4 space-y-2">
              {gotchas.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-secondary">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {relatedOffers.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/10 bg-bg-elevated/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Related Offers</p>
              <h2 className="mt-2 font-heading text-2xl text-text-primary">Other bank bonuses in the same neighborhood</h2>
              <div className="mt-4 space-y-3">
                {relatedOffers.map((item) => {
                  const relatedImage = getBankingImagePresentation(item.offer.bankName);

                  return (
                    <article
                      key={item.offer.slug}
                      className="rounded-[1.1rem] border border-white/8 bg-black/15 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <EntityImage
                          src={item.offer.imageUrl}
                          alt={`${item.offer.bankName} logo`}
                          label={item.offer.bankName}
                          className="h-[4.15rem] w-[6rem] shrink-0 rounded-[0.9rem]"
                          imgClassName={relatedImage?.imgClassName ?? 'bg-black/10 px-4 py-3'}
                          fallbackClassName="bg-black/10"
                          fallbackVariant="wordmark"
                          fallbackTextClassName="px-3 text-sm"
                          fit={relatedImage?.fit}
                          position={relatedImage?.position}
                          scale={relatedImage?.scale ?? 1.04}
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                            {item.offer.bankName}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-text-primary">{item.offer.offerName}</h3>
                          <p className="mt-2 text-sm leading-6 text-text-secondary">{item.reason}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
                            <span className="rounded-full border border-white/10 px-2.5 py-1">
                              Net {formatBankingCurrency(item.offer.estimatedNetValue)}
                            </span>
                            <span className="rounded-full border border-white/10 px-2.5 py-1">
                              {getBankingOfferDifficulty(item.offer).shortLabel}
                            </span>
                          </div>
                          <Link
                            href={item.href}
                            className="mt-4 inline-flex items-center text-sm font-semibold text-brand-teal transition hover:underline"
                          >
                            View offer
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.6rem] border border-brand-teal/20 bg-brand-teal/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Next Move</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">Turn this offer into an actual plan</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              If this offer is the one you want to anchor around, send it straight into the planner and let it decide whether this bank bonus should be first, deferred, or left out.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={buildSelectedOfferIntentHref({
                  lane: 'banking',
                  slug: offer.slug,
                  audience: offer.customerType === 'business' ? 'business' : undefined,
                  sourcePath
                })}
                className="inline-flex items-center rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Build my plan with this offer
              </Link>
              <Link
                href="/banking"
                className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-white/30 hover:text-text-primary"
              >
                Back to banking
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
