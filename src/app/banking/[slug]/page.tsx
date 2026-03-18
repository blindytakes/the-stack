import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BankingOfferCard } from '@/components/banking/banking-offer-card';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingAccountType,
  formatBankingCurrency,
  getAllBankingBonusSlugs,
  getBankingBonusBySlug,
  getBankingBonusesData,
  getBankingOfferAvailabilityLabel,
  getBankingOfferBestFit,
  getBankingOfferChecklist,
  getBankingOfferDifficulty,
  getBankingOfferExecutionSummary,
  getBankingOfferGotchas,
  getBankingOfferThinkTwiceIf,
  getBankingOfferTimeline,
  getBankingOfferWhyInteresting,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllBankingBonusSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getBankingBonusBySlug(slug);
  if (!offer) return { title: 'Banking Offer Not Found' };

  return {
    title: `${offer.offerName} | ${offer.bankName}`,
    description: offer.headline
  };
}

function formatVerifiedDate(value?: string) {
  if (!value) return 'Recently';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function getRelatedOfferScore(currentOffer: BankingBonusListItem, candidate: BankingBonusListItem) {
  let score = 0;

  if (candidate.accountType === currentOffer.accountType) score += 5;
  if (candidate.directDeposit.required === currentOffer.directDeposit.required) score += 3;
  if (getBankingOfferDifficulty(candidate).level === getBankingOfferDifficulty(currentOffer).level) {
    score += 2;
  }
  if (Boolean(candidate.stateRestrictions?.length) === Boolean(currentOffer.stateRestrictions?.length)) {
    score += 1;
  }

  score -= Math.abs(candidate.estimatedNetValue - currentOffer.estimatedNetValue) / 100;
  return score;
}

export default async function BankingOfferDetailPage({ params }: Props) {
  const { slug } = await params;
  const offer = await getBankingBonusBySlug(slug);
  if (!offer) notFound();

  const outboundOfferUrl = offer.affiliateUrl ?? offer.offerUrl;
  const timeline = getBankingOfferTimeline(offer);
  const difficulty = getBankingOfferDifficulty(offer);
  const executionSummary = getBankingOfferExecutionSummary(offer);
  const whyInteresting = getBankingOfferWhyInteresting(offer);
  const checklist = getBankingOfferChecklist(offer);
  const gotchas = getBankingOfferGotchas(offer);
  const bestFitBullets = getBankingOfferBestFit(offer);
  const cautionBullets = getBankingOfferThinkTwiceIf(offer);
  const openingDepositLabel =
    typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
      ? formatBankingCurrency(offer.minimumOpeningDeposit)
      : 'No large minimum listed';
  const directDepositLabel = offer.directDeposit.required
    ? typeof offer.directDeposit.minimumAmount === 'number'
      ? `Required, at least ${formatBankingCurrency(offer.directDeposit.minimumAmount)}`
      : 'Required'
    : 'Not required';
  const relatedOffers = (await getBankingBonusesData()).bonuses
    .filter((item) => item.slug !== offer.slug)
    .sort((a, b) => getRelatedOfferScore(offer, b) - getRelatedOfferScore(offer, a))
    .slice(0, 3);
  const keyFacts = [
    { label: 'Account type', value: formatBankingAccountType(offer.accountType) },
    { label: 'Direct deposit', value: directDepositLabel },
    { label: 'Opening deposit', value: openingDepositLabel },
    { label: 'Availability', value: getBankingOfferAvailabilityLabel(offer) }
  ];

  return (
    <div className="container-page pt-12 pb-16">
      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/banking" className="transition hover:text-text-secondary">
          Banking Bonuses
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{offer.offerName}</span>
      </nav>

      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-elevated p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs text-brand-gold">
                {formatBankingAccountType(offer.accountType)}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  difficulty.level === 'low'
                    ? 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal'
                    : difficulty.level === 'high'
                      ? 'border-brand-coral/20 bg-brand-coral/10 text-brand-coral'
                      : 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
                }`}
              >
                {difficulty.label}
              </span>
              <span className="rounded-full border border-white/10 bg-bg/40 px-3 py-1 text-xs text-text-secondary">
                {offer.directDeposit.required ? 'Payroll reroute required' : 'No payroll reroute'}
              </span>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-brand-gold">{offer.bankName}</p>
            <h1 className="mt-2 font-heading text-4xl text-text-primary">{offer.offerName}</h1>
            <p className="mt-3 text-lg text-text-secondary">{offer.headline}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
              {executionSummary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {keyFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{fact.label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Execution Snapshot</p>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-bg/70 p-3">
              <EntityImage
                src={offer.imageUrl}
                alt={`${offer.bankName} logo`}
                label={offer.bankName}
                className="aspect-[2.3/1] rounded-[1.25rem]"
                imgClassName="bg-black/10 p-4"
                fallbackClassName="bg-black/10"
                fallbackVariant="wordmark"
                fallbackTextClassName="px-2 text-2xl"
                priority
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-bg-surface p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Cash bonus</p>
              <p className="mt-2 text-4xl font-semibold text-brand-gold">
                {formatBankingCurrency(offer.bonusAmount)}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-text-muted">Net estimate</p>
              <p className="mt-1 text-2xl font-semibold text-brand-teal">
                {formatBankingCurrency(offer.estimatedNetValue)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Timeline</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{timeline.label}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Friction</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{difficulty.label}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Direct deposit</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {offer.directDeposit.required ? 'Required' : 'Not required'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Opening deposit</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{openingDepositLabel}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-bg/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Main caveats</p>
              <ul className="mt-3 space-y-2">
                {gotchas.slice(0, 2).map((item) => (
                  <li key={item} className="text-sm leading-6 text-text-secondary">
                    <span className="mr-2 text-brand-coral">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {outboundOfferUrl ? (
              <>
                <a
                  href={outboundOfferUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Check Current Offer
                </a>
                <p className="mt-2 text-xs text-text-muted">
                  Last verified {formatVerifiedDate(offer.lastVerified)}. Confirm live terms before
                  you open the account.
                </p>
              </>
            ) : null}

            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/banking" className="text-text-secondary transition hover:text-text-primary">
                Back to banking directory
              </Link>
            </div>
          </aside>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Why It&apos;s Interesting</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary">{whyInteresting}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Headline bonus</p>
                <p className="mt-2 text-xl font-semibold text-brand-gold">
                  {formatBankingCurrency(offer.bonusAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Estimated fees</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">
                  {formatBankingCurrency(offer.estimatedFees)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Net value estimate</p>
                <p className="mt-2 text-xl font-semibold text-brand-teal">
                  {formatBankingCurrency(offer.estimatedNetValue)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">What You Need To Do</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {checklist.map((step, index) => (
                <div
                  key={`${step.timing}-${step.title}`}
                  className="rounded-[1.75rem] border border-white/10 bg-bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{step.timing}</p>
                      <h3 className="mt-2 text-lg font-semibold text-text-primary">
                        {index + 1}. {step.title}
                      </h3>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-teal/20 bg-brand-teal/10 text-sm font-semibold text-brand-teal">
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Friction / Risks / Gotchas</h2>
            <div className="mt-4 grid gap-3">
              {gotchas.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg-surface px-4 py-4"
                >
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-coral" aria-hidden />
                  <p className="text-sm leading-7 text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {relatedOffers.length > 0 ? (
            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Related Banking Offers</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Similar execution profiles or nearby value ranges, chosen to make the comparison
                    feel deliberate rather than random.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {relatedOffers.map((item) => (
                  <BankingOfferCard
                    key={item.slug}
                    offer={item}
                    variant="compact"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-2xl border border-white/10 bg-bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Best Fit If</p>
            <ul className="mt-3 space-y-2">
              {bestFitBullets.map((bullet) => (
                <li key={bullet} className="text-sm leading-7 text-text-secondary">
                  <span className="mr-2 text-brand-teal">•</span>
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-text-muted">Think Twice If</p>
            <ul className="mt-3 space-y-2">
              {cautionBullets.map((bullet) => (
                <li key={bullet} className="text-sm leading-7 text-text-secondary">
                  <span className="mr-2 text-brand-coral">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Need A Ranked Sequence?</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Use the full planner when this offer needs to be sequenced against card bonuses,
              direct-deposit capacity, and other banking timelines.
            </p>
            <div className="mt-4 space-y-2">
              <Link
                href={buildSelectedOfferIntentHref({ lane: 'banking', slug: offer.slug })}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Build Full Bonus Plan
              </Link>
              <Link
                href="/banking"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Browse More Banking Offers
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
