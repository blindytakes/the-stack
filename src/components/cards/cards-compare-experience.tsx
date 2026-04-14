'use client';

import Link from 'next/link';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';
import { CardVsCardComparison } from '@/components/tools/card-vs-card-sections';
import { CardPicker } from '@/components/ui/card-picker';
import { Button } from '@/components/ui/button';
import { EntityImage } from '@/components/ui/entity-image';
import { fetchCardDetail } from '@/lib/cards-client';
import type { CardDetail, CardRecord } from '@/lib/cards';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import {
  buildCardComparison,
  cardComparisonSpendCategories,
  defaultCardComparisonAssumptions,
  normalizeCardComparisonAssumptions,
  type CardComparisonCardSummary,
  type CardComparisonSpendCategory
} from '@/lib/card-compare';
import { buildSelectedOfferIntentHref } from '@/lib/selected-offer-intent';
import { formatCardCreditTier } from '@/lib/cards/presentation-metrics';

type CardsCompareExperienceProps = {
  cards: CardRecord[];
  initialSlugA: string | null;
  initialSlugB: string | null;
  initialCardA: CardDetail | null;
  initialCardB: CardDetail | null;
};

type AssumptionPreset = {
  id: string;
  label: string;
  pointValueCents: number;
  creditUsagePercent: number;
  monthlySpend: typeof defaultCardComparisonAssumptions.monthlySpend;
};

const spendLabels: Record<CardComparisonSpendCategory, string> = {
  dining: 'Dining',
  groceries: 'Groceries',
  travel: 'Travel',
  gas: 'Gas',
  online_shopping: 'Online Shopping',
  streaming: 'Streaming',
  general: 'General'
};

const assumptionPresets: AssumptionPreset[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    pointValueCents: 1.5,
    creditUsagePercent: 70,
    monthlySpend: defaultCardComparisonAssumptions.monthlySpend
  },
  {
    id: 'traveler',
    label: 'Traveler',
    pointValueCents: 1.8,
    creditUsagePercent: 85,
    monthlySpend: {
      dining: 500,
      groceries: 450,
      travel: 700,
      gas: 120,
      online_shopping: 180,
      streaming: 40,
      general: 650
    }
  },
  {
    id: 'everyday',
    label: 'Everyday',
    pointValueCents: 1.2,
    creditUsagePercent: 55,
    monthlySpend: {
      dining: 350,
      groceries: 850,
      travel: 120,
      gas: 220,
      online_shopping: 260,
      streaming: 45,
      general: 900
    }
  }
];

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function buildComparisonHref(slugA: string, slugB: string) {
  return `/cards/compare?${new URLSearchParams({ a: slugA, b: slugB }).toString()}`;
}

function winnerTone(
  side: 'a' | 'b',
  winner: 'a' | 'b' | 'tie',
  options?: {
    inactive?: string;
    active?: string;
  }
) {
  const inactive = options?.inactive ?? 'text-text-secondary';
  const active = options?.active ?? 'text-brand-teal';
  if (winner === 'tie') return 'text-text-primary';
  return winner === side ? active : inactive;
}

function effortLabel(summary: CardComparisonCardSummary) {
  if (summary.bonusEffort === 'none' || !summary.monthlySpendNeededForBonus) {
    return 'No listed hurdle';
  }

  const spendNeeded = formatMoney(summary.monthlySpendNeededForBonus);
  if (summary.bonusEffort === 'easy') {
    return `${spendNeeded}/mo feels comfortable`;
  }
  if (summary.bonusEffort === 'manageable') {
    return `${spendNeeded}/mo is doable`;
  }
  return `${spendNeeded}/mo is a stretch`;
}

function toneForBonusEffort(summary: CardComparisonCardSummary) {
  if (summary.bonusEffort === 'easy') return 'text-brand-teal';
  if (summary.bonusEffort === 'manageable') return 'text-brand-gold';
  if (summary.bonusEffort === 'stretch') return 'text-brand-coral';
  return 'text-text-secondary';
}

function useCompareCardDetail(
  slug: string | null,
  initialCard: CardDetail | null
) {
  const [card, setCard] = useState<CardDetail | null>(
    slug && initialCard?.slug === slug ? initialCard : null
  );
  const [loading, setLoading] = useState(Boolean(slug) && !initialCard);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setCard(null);
      setLoading(false);
      setError('');
      return;
    }

    if (initialCard?.slug === slug) {
      setCard(initialCard);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchCardDetail(slug)
      .then((result) => {
        if (!cancelled) {
          setCard(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load card details.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, initialCard]);

  return { card, loading, error };
}

function AssumptionInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      <div className="mt-2 flex items-center rounded-full border border-white/10 bg-bg px-3">
        <span className="text-sm text-text-muted">$</span>
        <input
          type="number"
          min={0}
          step={25}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-full bg-transparent px-2 py-2.5 text-sm text-text-primary outline-none"
        />
        <span className="text-xs text-text-muted">/mo</span>
      </div>
    </label>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  tone = 'text-text-primary'
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-black/15 px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{detail}</p>
    </div>
  );
}

function ComparisonCardHero({
  side,
  summary,
  compareSourcePath,
  firstYearWinner,
  ongoingWinner
}: {
  side: 'a' | 'b';
  summary: CardComparisonCardSummary;
  compareSourcePath?: string | null;
  firstYearWinner: 'a' | 'b' | 'tie';
  ongoingWinner: 'a' | 'b' | 'tie';
}) {
  const cardImage = getCardImageDisplay({
    slug: summary.card.slug,
    name: summary.card.name,
    issuer: summary.card.issuer,
    imageUrl: summary.card.imageUrl,
    imageAssetType: summary.card.imageAssetType
  });

  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.96),rgba(12,16,25,0.98))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-teal">
            {summary.card.issuer}
          </p>
          <h2 className="mt-2 max-w-[16ch] font-heading text-[2.1rem] leading-[0.94] text-text-primary">
            {summary.card.name}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-[11px] text-brand-teal">
              {summary.fitLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary">
              {summary.card.cardType === 'business' ? 'Business' : 'Personal'}
            </span>
          </div>
        </div>

        <EntityImage
          src={cardImage.src}
          alt={cardImage.alt}
          label={cardImage.label}
          className="h-[7rem] w-[10.75rem] shrink-0 rounded-[1.25rem]"
          imgClassName={cardImage.presentation.imgClassName}
          fallbackClassName="bg-black/10"
          fallbackVariant={cardImage.fallbackVariant}
          fit={cardImage.presentation.fit}
          position={cardImage.presentation.position}
          scale={cardImage.presentation.scale}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SummaryMetric
          label="Year One"
          value={formatMoney(summary.firstYearValue)}
          detail="Welcome offer + annual rewards + usable credits - fee"
          tone={winnerTone(side, firstYearWinner)}
        />
        <SummaryMetric
          label="Ongoing Year"
          value={formatMoney(summary.ongoingValue)}
          detail="Annual rewards + usable credits - fee"
          tone={winnerTone(side, ongoingWinner)}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Annual Rewards"
          value={formatMoney(summary.annualRewardsValue)}
          detail={`${summary.effectiveReturnPercent.toFixed(2)}% effective return`}
        />
        <SummaryMetric
          label="Welcome Offer"
          value={summary.welcomeOfferValue > 0 ? formatMoney(summary.welcomeOfferValue) : 'None'}
          detail="Current listed first-year bonus value"
        />
        <SummaryMetric
          label="Usable Credits"
          value={summary.usedCreditsValue > 0 ? formatMoney(summary.usedCreditsValue) : 'None'}
          detail="Discounted by your credit-usage assumption"
        />
        <SummaryMetric
          label="Bonus Hurdle"
          value={effortLabel(summary)}
          detail={`Needs ${formatCardCreditTier(summary.card.creditTierMin)} credit`}
          tone={toneForBonusEffort(summary)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Why it wins</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
            {summary.strengths.length > 0 ? (
              summary.strengths.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• No standout edge under the current assumptions.</li>
            )}
          </ul>
        </div>
        <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Watch for</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
            {summary.cautions.length > 0 ? (
              summary.cautions.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• No major red flag surfaced from the current math.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={buildSelectedOfferIntentHref({
            lane: 'cards',
            slug: summary.card.slug,
            audience: summary.card.cardType === 'business' ? 'business' : undefined,
            sourcePath: compareSourcePath
          })}
          className="inline-flex items-center rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Build a plan around this card
        </Link>
        <Link
          href={`/cards/${summary.card.slug}`}
          className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
        >
          View offer details
        </Link>
      </div>
    </article>
  );
}

function CategoryTable({
  summaryA,
  summaryB
}: {
  summaryA: CardComparisonCardSummary;
  summaryB: CardComparisonCardSummary;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,30,0.98),rgba(10,14,22,0.98))] p-5 md:p-6">
      <div className="max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Spend Mix Math</p>
        <h3 className="mt-2 font-heading text-2xl text-text-primary">Where the value actually comes from</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Category returns are based on the spend mix you entered, your point-value assumption, and
          a discounted view of recurring credits.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/8 bg-black/15">
        <div className="grid grid-cols-[1.2fr_0.7fr_1fr_1fr] gap-3 border-b border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          <span>Category</span>
          <span>Annual Spend</span>
          <span>{summaryA.card.name}</span>
          <span>{summaryB.card.name}</span>
        </div>
        {summaryA.categoryBreakdown.map((rowA) => {
          const rowB = summaryB.categoryBreakdown.find((item) => item.category === rowA.category);
          const winner =
            rowB == null ? 'tie' : rowA.annualValue === rowB.annualValue ? 'tie' : rowA.annualValue > rowB.annualValue ? 'a' : 'b';

          return (
            <div
              key={rowA.category}
              className="grid grid-cols-[1.2fr_0.7fr_1fr_1fr] gap-3 border-t border-white/6 px-4 py-4 text-sm"
            >
              <div>
                <p className="font-semibold text-text-primary">{spendLabels[rowA.category]}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">{rowA.rewardLabel}</p>
              </div>
              <div className="text-text-secondary">{formatMoney(rowA.annualSpend)}</div>
              <div>
                <p className={`font-semibold ${winnerTone('a', winner)}`}>{formatMoney(rowA.annualValue)}</p>
                <p className="mt-1 text-xs text-text-muted">{rowA.effectiveReturnPercent.toFixed(2)}%</p>
              </div>
              <div>
                <p className={`font-semibold ${winnerTone('b', winner)}`}>{formatMoney(rowB?.annualValue ?? 0)}</p>
                <p className="mt-1 text-xs text-text-muted">{(rowB?.effectiveReturnPercent ?? 0).toFixed(2)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CardsCompareExperience({
  cards,
  initialSlugA,
  initialSlugB,
  initialCardA,
  initialCardB
}: CardsCompareExperienceProps) {
  const [slugA, setSlugA] = useState<string | null>(initialSlugA);
  const [slugB, setSlugB] = useState<string | null>(initialSlugB);
  const [assumptions, setAssumptions] = useState(defaultCardComparisonAssumptions);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const detailA = useCompareCardDetail(slugA, initialCardA);
  const detailB = useCompareCardDetail(slugB, initialCardB);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextUrl = new URL(window.location.href);

    if (slugA) nextUrl.searchParams.set('a', slugA);
    else nextUrl.searchParams.delete('a');

    if (slugB) nextUrl.searchParams.set('b', slugB);
    else nextUrl.searchParams.delete('b');

    window.history.replaceState(window.history.state, '', nextUrl.toString());
  }, [slugA, slugB]);

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const comparison = useMemo(() => {
    if (!detailA.card || !detailB.card) return null;
    return buildCardComparison(detailA.card, detailB.card, assumptions);
  }, [assumptions, detailA.card, detailB.card]);

  function handleSelectA(nextSlug: string) {
    if (nextSlug === slugB) {
      setSlugB(slugA);
    }
    setSlugA(nextSlug);
  }

  function handleSelectB(nextSlug: string) {
    if (nextSlug === slugA) {
      setSlugA(slugB);
    }
    setSlugB(nextSlug);
  }

  function handleSpendChange(category: CardComparisonSpendCategory, value: number) {
    startTransition(() => {
      setAssumptions((current) =>
        normalizeCardComparisonAssumptions({
          ...current,
          monthlySpend: {
            ...current.monthlySpend,
            [category]: value
          }
        })
      );
    });
  }

  function applyPreset(preset: AssumptionPreset) {
    startTransition(() => {
      setAssumptions(
        normalizeCardComparisonAssumptions({
          monthlySpend: preset.monthlySpend,
          pointValueCents: preset.pointValueCents,
          creditUsagePercent: preset.creditUsagePercent
        })
      );
    });
  }

  async function copyLink() {
    if (typeof window === 'undefined') return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  const loading = detailA.loading || detailB.loading;
  const error = detailA.error || detailB.error;
  const compareSourcePath = slugA && slugB ? buildComparisonHref(slugA, slugB) : null;
  const winningSummary =
    comparison?.overallWinner === 'a'
      ? comparison.a
      : comparison?.overallWinner === 'b'
        ? comparison.b
        : null;
  const primaryPlanHref = winningSummary
    ? buildSelectedOfferIntentHref({
        lane: 'cards',
        slug: winningSummary.card.slug,
        audience: winningSummary.card.cardType === 'business' ? 'business' : undefined,
        sourcePath: compareSourcePath
      })
    : '/tools/card-finder?mode=full';
  const primaryPlanLabel = winningSummary
    ? `Build around ${winningSummary.card.name}`
    : 'Build a bonus plan';

  return (
    <div className="space-y-8">
      <TrackFunnelEventOnView
        event="tool_started"
        properties={{ source: 'page_view', tool: 'cards_compare', path: '/cards/compare' }}
      />

      <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-10 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
                Compare Cards
              </p>
              <h1 className="mt-4 font-heading text-[clamp(2.7rem,5vw,4.9rem)] leading-[0.94] tracking-[-0.05em] text-text-primary">
                See which card actually wins for your spend.
              </h1>
              <p className="mt-4 max-w-2xl text-[1.02rem] leading-7 text-text-secondary">
                This page compares year-one value, ongoing value, welcome-offer difficulty, usable credits,
                and transfer flexibility under your own assumptions instead of generic rankings.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={copyLink} className="px-4 py-2.5">
                {copyState === 'copied'
                  ? 'Link copied'
                  : copyState === 'error'
                    ? 'Copy failed'
                    : 'Copy compare link'}
              </Button>
              <Link
                href={primaryPlanHref}
                className="inline-flex items-center rounded-full bg-brand-teal px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                {primaryPlanLabel}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
            <CardPicker cards={cards} selectedSlug={slugA} onSelect={handleSelectA} label="Card A" />
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setSlugA(slugB);
                  setSlugB(slugA);
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Swap
              </button>
            </div>
            <CardPicker cards={cards} selectedSlug={slugB} onSelect={handleSelectB} label="Card B" />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Assumptions</p>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">Pressure-test the math</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Rewards use your annual spend mix. Credits are discounted by your usage slider. Points and miles use
                  your valuation assumption.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {assumptionPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-white/25 hover:text-text-primary"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {cardComparisonSpendCategories.map((category) => (
                <AssumptionInput
                  key={category}
                  label={spendLabels[category]}
                  value={assumptions.monthlySpend[category]}
                  onChange={(value) => handleSpendChange(category, value)}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Point Value
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {assumptions.pointValueCents.toFixed(1)} cpp
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.1}
                  value={assumptions.pointValueCents}
                  onChange={(event) =>
                    setAssumptions((current) =>
                      normalizeCardComparisonAssumptions({
                        ...current,
                        pointValueCents: Number(event.target.value)
                      })
                    )
                  }
                  className="mt-4 w-full accent-brand-teal"
                />
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  Used for points and miles cards. Cash-back cards stay fixed.
                </p>
              </label>

              <label className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Credit Usage
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {assumptions.creditUsagePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={assumptions.creditUsagePercent}
                  onChange={(event) =>
                    setAssumptions((current) =>
                      normalizeCardComparisonAssumptions({
                        ...current,
                        creditUsagePercent: Number(event.target.value)
                      })
                    )
                  }
                  className="mt-4 w-full accent-brand-gold"
                />
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  This discounts recurring credits so the page does not assume perfect usage.
                </p>
              </label>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-brand-coral/20 bg-brand-coral/10 p-6 text-sm text-brand-coral">
          {error}
        </div>
      ) : null}

      {loading && (
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2].map((index) => (
            <div key={index} className="h-[26rem] animate-pulse rounded-[1.8rem] bg-bg-elevated" />
          ))}
        </div>
      )}

      {comparison ? (
        <>
          <section className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(24,18,20,0.96),rgba(12,12,18,0.94))] px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.32)] md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-gold">Verdict</p>
                <h2 className="mt-2 font-heading text-3xl text-text-primary">{comparison.verdictTitle}</h2>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  {comparison.verdictSummary}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.1rem] border border-white/10 bg-black/15 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Year One Winner</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {comparison.firstYearWinner === 'tie'
                      ? 'Tie'
                      : comparison.firstYearWinner === 'a'
                        ? comparison.a.card.name
                        : comparison.b.card.name}
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-white/10 bg-black/15 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Keeper Winner</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {comparison.ongoingWinner === 'tie'
                      ? 'Tie'
                      : comparison.ongoingWinner === 'a'
                        ? comparison.a.card.name
                        : comparison.b.card.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/10 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{comparison.a.card.name}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
                  {comparison.reasonsForA.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{comparison.b.card.name}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
                  {comparison.reasonsForB.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {comparison.breakevenAnnualSpend != null ? (
              <p className="mt-4 text-sm leading-6 text-text-secondary">
                Long-term breakeven: the higher-reward option needs roughly{' '}
                <span className="font-semibold text-text-primary">
                  {formatMoney(comparison.breakevenAnnualSpend)}
                </span>{' '}
                per year in this spend mix to overcome the fee and credit gap.
              </p>
            ) : null}
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <ComparisonCardHero
              side="a"
              summary={comparison.a}
              compareSourcePath={compareSourcePath}
              firstYearWinner={comparison.firstYearWinner}
              ongoingWinner={comparison.ongoingWinner}
            />
            <ComparisonCardHero
              side="b"
              summary={comparison.b}
              compareSourcePath={compareSourcePath}
              firstYearWinner={comparison.firstYearWinner}
              ongoingWinner={comparison.ongoingWinner}
            />
          </div>

          <CategoryTable summaryA={comparison.a} summaryB={comparison.b} />

          <section className="rounded-[1.8rem] border border-white/10 bg-bg-elevated p-5 md:p-6">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Raw Breakdown</p>
              <h3 className="mt-2 font-heading text-2xl text-text-primary">Full side-by-side details</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Use the spec table below when you want the literal field-by-field differences in rewards, benefits,
                transfer partners, fees, and approval profile.
              </p>
            </div>

            <CardVsCardComparison a={comparison.a.card} b={comparison.b.card} />
          </section>
        </>
      ) : null}
    </div>
  );
}
