import Link from 'next/link';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { ProofPoints } from '@/components/proof-points';
import { HeroOffersCarousel, type HeroOffer } from '@/components/hero-offers-carousel';
import { PlanComparison } from '@/components/plan-comparison';
import { HowItWorksSteps } from '@/components/how-it-works-steps';
import { FaqAccordion } from '@/components/faq-accordion';
import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';

const SITE_URL = 'https://thestackhq.com';
const LOGO_URL = `${SITE_URL}/icon.png`;
const SITE_DESCRIPTION =
  'Build a personalized 6-month card and bank bonus plan with practical next-step guidance.';

const faqs = [
  {
    question: 'Is The Stack free?',
    answer:
      'Yes, the site, the Bonus Planner, and the comparison tools are free to use. You can run the quiz, review your results, and explore the site without paying a fee.'
  },
  {
    question: 'How long does the Bonus Planner take?',
    answer:
      'About 2 minutes for most people. We ask enough to make the recommendations useful without turning it into a long intake form.'
  },
  {
    question: 'Does the Bonus Planner cover bank bonuses too?',
    answer:
      'Yes. The full Bonus Planner can include both card bonuses and bank account bonuses when they fit your profile and timing.'
  },
  {
    question: 'Do I need excellent credit?',
    answer:
      'No. Some offers are best for excellent credit, but the planner also filters for what is more realistic based on the credit profile you choose.'
  },
  {
    question: 'How do you estimate value?',
    answer:
      'We use the bonus value, annual fee, and practical assumptions around offer quality and fit so the ranking is more grounded than a raw points headline.'
  },
  {
    question: 'Will applying hurt my credit?',
    answer:
      'New applications can create a small temporary dip, so the Bonus Planner is best used by people who already pay on time and are comfortable opening accounts deliberately to earn sign-up bonuses and reward points.'
  },
  {
    question: 'Do I need a spreadsheet to use this?',
    answer:
      'No. We built The Stack specifically to kill the manual spreadsheet. We handle the tracking, the rules, and the deadlines so you can focus on the profit.'
  }
] as const;

const howItWorksSteps = [
  {
    step: '01',
    title: 'Answer a few questions',
    summary: 'A 2-minute quiz about your spend, credit, and goals.',
    description:
      'We ask about your monthly spend, credit score range, and what you want from bonuses — cash back, travel, or both. No SSN, no bank login, no credit card numbers.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    step: '02',
    title: 'Get a personalized bonus plan',
    summary: 'See your best card and bank bonuses in order.',
    description:
      'Your plan shows each bonus ranked by real dollar value, the spend or deposit needed to earn it, and which one to open first based on timing and issuer rules.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M3 17h4v4H3zM10 11h4v10h-4zM17 5h4v16h-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 13l5-5 4 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    step: '03',
    title: 'Execute and earn',
    summary: 'Each move has dates, deadlines, and where to apply.',
    description:
      'Your plan tells you exactly when to apply, how long you have to hit the spend or deposit requirement, and when to expect the bonus — so you never miss a deadline.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
] as const;

const differentiationCards = [
  {
    title: 'Real dollar amounts, not points math',
    description:
      'Every bonus is shown as a cash value after fees — no inflated point valuations or guesswork.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 8v4m-1.5-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Filtered to what you qualify for',
    description:
      'Your monthly spend, credit score, and goals determine which bonuses show up — so every recommendation is one you can actually earn.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4.5 14.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15.5 6.5 17 8l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Tells you what to open and when',
    description:
      'Your plan is ordered to maximize real dollar value while respecting issuer rules and cooldown periods.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 6h8M6 10h6M6 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 10l-1.5 1.5L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Optimize spend, don\u2019t increase it',
    description:
      'We don\u2019t want you to spend more — we want you to spend smarter. The Stack maps bonuses to your existing budget, not unnecessary purchases.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 7h8M6 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
] as const;

const privacyPoints = [
  {
    label: 'No SSN Required',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M10 2.5 4 5.5v4c0 4.14 2.56 7.02 6 8 3.44-.98 6-3.86 6-8v-4L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m7.5 10 1.5 1.5L12 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'No Bank Login',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="4.5" y="9" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: 'No Credit Card #s',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 9h15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 16 16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: 'No Data Shared',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 17 17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
] as const;

const sampleReviews = [
  {
    name: 'Ashley P.',
    quote:
      'I was overwhelmed by card lists. The Stack gave me a clear order, and I ended up earning just over $6,300 in my first 12 months.',
    resultAmount: '$6,300+',
    resultDetail: 'earned in the first year'
  },
  {
    name: 'Marcus T.',
    quote:
      'I had a rough idea of what cards I wanted, but no idea what order to open them in. The Stack laid it out step by step with deadlines I could actually follow.',
    resultAmount: '$5,800',
    resultDetail: 'in bonuses with a clear sequencing strategy'
  },
  {
    name: 'Priya R.',
    quote:
      'I liked that it included a bank bonus too. It felt like an actual plan, and I crossed $6,000 without needing a spreadsheet to keep up with it.',
    resultAmount: '$6,050',
    resultDetail: 'across cards and bank bonuses'
  },
  {
    name: 'Daniel K.',
    quote:
      'I already knew the cards I wanted. What surprised me was the order — it flagged a Chase 5/24 conflict I hadn\'t considered.',
    resultAmount: '$7,200',
    resultDetail: 'earned while avoiding a 5/24 mistake'
  },
  {
    name: 'Lauren S.',
    quote:
      'I used to spend hours comparing cards in browser tabs. This just told me which one to get now and which to wait on. Saved me a ton of time.',
    resultAmount: '$6,400',
    resultDetail: 'earned with far less research time'
  }
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'The Stack',
      url: SITE_URL,
      description: SITE_DESCRIPTION
    },
    {
      '@type': 'Organization',
      name: 'The Stack',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
        width: 512,
        height: 512
      }
    }
  ]
};

const MAX_HERO_OFFERS = 12;

export const dynamic = 'force-dynamic';

function isPreferredCapitalOneVentureOffer(offer: HeroOffer) {
  const slug = offer.slug.toLowerCase();
  const name = offer.name.toLowerCase();
  const issuer = offer.issuer.toLowerCase();

  return (
    offer.type === 'card' &&
    issuer === 'capital one' &&
    (slug === 'capital-one-venture-rewards' ||
      (name.includes('venture rewards') && !name.includes('business')))
  );
}

function isNonBusinessCapitalOneVentureOffer(offer: HeroOffer) {
  const slug = offer.slug.toLowerCase();
  const name = offer.name.toLowerCase();
  const issuer = offer.issuer.toLowerCase();

  return (
    offer.type === 'card' &&
    issuer === 'capital one' &&
    !slug.includes('business') &&
    !name.includes('business') &&
    (slug.includes('venture') || name.includes('venture'))
  );
}

function moveMatchingOffer<T>(
  offers: T[],
  predicate: (offer: T) => boolean,
  targetIndex: number
) {
  const currentIndex = offers.findIndex(predicate);
  if (currentIndex < 0 || currentIndex === targetIndex) {
    return offers;
  }

  const reordered = [...offers];
  const [match] = reordered.splice(currentIndex, 1);
  reordered.splice(Math.max(0, Math.min(targetIndex, reordered.length)), 0, match);
  return reordered;
}

async function getHeroOffers(): Promise<HeroOffer[]> {
  const offers: HeroOffer[] = [];

  try {
    const { cards } = await getCardsData();
    for (const card of cards) {
      if (card.bestSignUpBonusValue && card.bestSignUpBonusValue > 0) {
        const pres = getCardImagePresentation(card.slug, card.imageUrl);
        offers.push({
          name: card.name,
          issuer: card.issuer,
          type: 'card',
          bonusValue: card.bestSignUpBonusValue,
          requirement: card.bestSignUpBonusSpendRequired
            ? `Spend $${(card.bestSignUpBonusSpendRequired / 1000).toFixed(0)}k in ${Math.round((card.bestSignUpBonusSpendPeriodDays ?? 90) / 30)} months`
            : 'See requirements',
          slug: card.slug,
          imageUrl: card.imageUrl,
          imagePresentation: pres ?? undefined,
        });
      }
    }
  } catch {
    // Cards unavailable — continue with banking only
  }

  try {
    const { bonuses } = await getBankingBonusesData();
    for (const bonus of bonuses) {
      if (bonus.bonusAmount > 0 && bonus.isActive) {
        const pres = getBankingImagePresentation(bonus.bankName);
        offers.push({
          name: bonus.offerName,
          issuer: bonus.bankName,
          type: 'bank',
          bonusValue: bonus.bonusAmount,
          requirement: bonus.directDeposit.required
            ? `Direct deposit${bonus.directDeposit.minimumAmount ? ` $${(bonus.directDeposit.minimumAmount / 1000).toFixed(0)}k` : ''}`
            : bonus.requiredActions[0] ?? 'See requirements',
          slug: bonus.slug,
          imageUrl: bonus.imageUrl,
          imagePresentation: pres ?? undefined,
        });
      }
    }
  } catch {
    // Banking unavailable — continue with cards only
  }

  // Sort by bonus value descending, then interleave card/bank
  const sortedCards = offers.filter(o => o.type === 'card').sort((a, b) => b.bonusValue - a.bonusValue);
  const sortedBanks = offers.filter(o => o.type === 'bank').sort((a, b) => b.bonusValue - a.bonusValue);
  const interleaved: HeroOffer[] = [];
  const maxLen = Math.max(sortedCards.length, sortedBanks.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < sortedCards.length) interleaved.push(sortedCards[i]);
    if (i < sortedBanks.length) interleaved.push(sortedBanks[i]);
  }
  const hasPreferredCapitalOneVenture = interleaved.some(isPreferredCapitalOneVentureOffer);

  const featuredOffers = moveMatchingOffer(
    interleaved,
    (offer) =>
      isPreferredCapitalOneVentureOffer(offer) ||
      (!hasPreferredCapitalOneVenture &&
        isNonBusinessCapitalOneVentureOffer(offer)),
    interleaved.length > 1 ? 1 : 0
  );

  return featuredOffers.slice(0, MAX_HERO_OFFERS);
}

export default async function HomePage() {
  const heroOffers = await getHeroOffers();
  const preferredOpeningSlug =
    heroOffers.find(isPreferredCapitalOneVentureOffer)?.slug ??
    heroOffers.find(isNonBusinessCapitalOneVentureOffer)?.slug;
  const featuredReview = sampleReviews[0];
  const supportingReviews = sampleReviews.slice(1, 4);

  return (
    <div className="container-page pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackFunnelEventOnView
        event="landing_view"
        properties={{ source: 'homepage', path: '/' }}
      />
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-base font-medium uppercase tracking-[0.25em] text-brand-teal md:text-lg">
            Free Personalized Bonus Plan
          </p>
          <h1 className="font-heading text-4xl leading-tight text-text-primary md:text-6xl lg:text-[66px]">
            Make Banks Work For You.
          </h1>
          <p className="max-w-[48ch] text-lg font-medium leading-relaxed text-text-secondary md:text-xl lg:max-w-[58ch]">
            Your personalized roadmap to maximum sign-up bonuses. Stop guessing which cards to
            open. The Stack gives you a step-by-step plan — timed perfectly, optimized for your
            spend, and built to capture every bonus.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tools/card-finder?mode=full"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-teal px-9 py-4 text-lg font-semibold text-black shadow-[0_12px_30px_rgba(45,212,191,0.25),0_0_60px_rgba(45,212,191,0.12)] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_40px_rgba(45,212,191,0.35),0_0_80px_rgba(45,212,191,0.18)] hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:px-10 md:py-5 md:text-xl"
            >
              <span>Start My Bonus Plan</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
              >
                <path
                  d="M3.5 8h8m0 0-3-3m3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
        <HeroOffersCarousel
          offers={heroOffers}
          preferredOpeningSlug={preferredOpeningSlug}
        />
      </section>

      <ProofPoints className="mt-12" variant="trust-bar" />

      <section className="mt-14">
        <PlanComparison />

        {/* Privacy reassurance */}
        <div className="mt-10 flex items-center justify-center gap-x-10 gap-y-4">
          {privacyPoints.map((point) => (
            <div key={point.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal shadow-[0_0_12px_rgba(45,212,191,0.15)]">
                {point.icon}
              </div>
              <p className="text-xl font-medium text-text-primary md:text-2xl">{point.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_8px_60px_rgba(45,212,191,0.06),0_2px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(212,168,83,0.06),transparent_40%)]" />
          <div className="relative max-w-3xl">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
              How it works
            </p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Three steps to your first bonus.
            </h2>
          </div>

          <HowItWorksSteps steps={howItWorksSteps} />
        </div>
      </section>

      {/* Why The Stack Is Different */}
      <section className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_8px_60px_rgba(45,212,191,0.06),0_2px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.08),transparent_45%),radial-gradient(circle_at_top_right,rgba(212,168,83,0.06),transparent_40%)]" />
        <div className="relative max-w-3xl">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
            Why The Stack Is Different
          </p>
          <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
            How The Stack helps you earn more.
          </h2>
        </div>
        <div className="relative mt-8 grid gap-5 md:grid-cols-2">
          {differentiationCards.map((card) => (
            <div
              key={card.title}
              className="h-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-7"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-brand-teal/10 text-brand-teal shadow-[0_0_12px_rgba(45,212,191,0.15)]">
                {card.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-text-primary">
                {card.title}
              </h3>
              <p className="mt-3 max-w-[40ch] text-base leading-7 text-text-secondary">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof Band */}
      <section className="relative mt-16 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(29,18,20,0.96),rgba(12,12,18,0.94))] px-6 py-8 shadow-[0_20px_80px_rgba(0,0,0,0.32)] md:px-10 md:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,99,74,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,168,83,0.16),transparent_40%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">
              Proof
            </p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Real reviews from Stackers.
            </h2>
            <blockquote className="mt-8 max-w-[24ch] font-heading text-3xl leading-tight text-text-primary md:text-5xl">
              &ldquo;{featuredReview.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-[1.35rem] border border-brand-coral/30 bg-brand-coral/10 px-4 py-3">
                <p className="font-heading text-2xl leading-none text-brand-coral md:text-[2.2rem]">
                  {featuredReview.resultAmount}
                </p>
                <p className="mt-1 text-sm font-medium text-brand-coral/90">
                  {featuredReview.resultDetail}
                </p>
              </div>
              <span className="text-sm font-medium text-text-secondary">
                {featuredReview.name}
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            {supportingReviews.map((review) => (
              <article
                key={review.name}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 backdrop-blur-sm"
              >
                <div>
                  <p className="font-heading text-[1.9rem] leading-none text-brand-gold md:text-[2.25rem]">
                    {review.resultAmount}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-gold/85">
                    {review.resultDetail}
                  </p>
                </div>
                <p className="mt-3 text-lg leading-8 text-text-primary">
                  &ldquo;{review.quote}&rdquo;
                </p>
                <p className="mt-4 text-sm font-medium text-text-secondary">
                  {review.name}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-base font-medium uppercase tracking-[0.24em] text-brand-gold">FAQ</p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="mt-10">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.98)_0%,rgba(10,10,15,0.98)_100%)] px-6 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)] md:px-10 md:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,168,83,0.08),transparent_34%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:items-center lg:gap-10">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-teal">
              Newsletter
            </p>
            <h2 className="mt-3 font-heading text-3xl text-text-primary md:text-4xl">
              Get bonus plays in your inbox.
            </h2>
            <p className="mt-3 text-sm text-text-muted">Free. Unsubscribe anytime.</p>
          </div>
          <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm md:p-5 lg:w-full lg:max-w-none lg:justify-self-end">
            <NewsletterSignup source="homepage" compact size="large" submitLabel="Get bonus plays" />
          </div>
        </div>
      </section>

      <section className="mt-12 text-center">
        <h2 className="mb-5 font-heading text-3xl text-text-primary md:text-4xl">Ready to start?</h2>
        <Link
          href="/tools/card-finder?mode=full"
          className="inline-flex items-center justify-center rounded-full bg-brand-teal px-7 py-3 text-base font-semibold text-black shadow-[0_12px_30px_rgba(45,212,191,0.18)] transition-all duration-200 hover:scale-105 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:px-8 md:py-3.5 md:text-lg"
        >
          Start My Bonus Plan
        </Link>
      </section>
    </div>
  );
}
