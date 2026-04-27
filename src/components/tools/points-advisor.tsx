'use client';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  startTransition,
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties
} from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import {
  buildPointsAdvisorResult,
  pointsEffortOptions,
  pointsGoalOptions,
  pointsProgramProfiles,
  pointsTimeHorizonOptions,
  type PointsAdvisorInput,
  type PointsEffortId,
  type PointsGoalId,
  type PointsProgramId,
  type PointsTimeHorizonId,
  type RankedPointsRecommendation
} from '@/lib/points-advisor';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

const defaultInput: PointsAdvisorInput = {
  programId: 'chase-sapphire-reserve',
  pointsBalance: 100000,
  goal: 'simple_travel',
  timeHorizon: 'soon',
  effortTolerance: 'medium'
};

const panelClassName =
  'relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] shadow-[0_28px_90px_rgba(0,0,0,0.3)]';
const sectionCardClassName =
  'relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,27,0.98),rgba(8,12,20,0.98))] shadow-[0_22px_80px_rgba(0,0,0,0.26)]';
const insetPanelClassName =
  'rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))]';
const activeSurfaceClassName =
  'border-[rgb(var(--points-accent-rgb)/0.42)] bg-[linear-gradient(180deg,rgba(16,22,35,0.98),rgba(11,15,24,0.98),rgb(var(--points-accent-rgb)/0.12))] shadow-[0_24px_80px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]';
const inactiveSurfaceClassName =
  'border-white/10 bg-[linear-gradient(180deg,rgba(14,19,30,0.9),rgba(9,13,22,0.92))] hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(16,22,35,0.94),rgba(11,15,24,0.96))]';
const activeChipClassName =
  'border-[rgb(var(--points-accent-rgb)/0.48)] bg-[rgb(var(--points-accent-rgb)/0.12)] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';
const inactiveChipClassName =
  'border-white/10 bg-white/[0.04] text-text-secondary hover:border-white/16 hover:bg-white/[0.06] hover:text-text-primary';

type ProgramVisual = {
  accentRgb: string;
  highlightRgb?: string;
  accentClassName: string;
  accentBarClassName: string;
  laneLabel: string;
  selectorSummary: string;
  artUrl: string;
  artScale?: number;
  artPosition?: string;
};

const programVisuals: Record<PointsProgramId, ProgramVisual> = {
  'chase-sapphire-reserve': {
    accentRgb: '90 224 255',
    accentClassName: 'text-[#5ae0ff]',
    accentBarClassName: 'bg-[#5ae0ff]',
    laneLabel: 'Travel-first',
    selectorSummary: 'Best when you want a premium travel currency with both floor value and real transfer upside.',
    artUrl:
      'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/sapphire_reserve_card_Halo.png',
    artScale: 1.08,
    artPosition: 'center 53%'
  },
  'amex-membership-rewards': {
    accentRgb: '214 229 255',
    accentClassName: 'text-[#d6e5ff]',
    accentBarClassName: 'bg-[#d6e5ff]',
    laneLabel: 'High-touch',
    selectorSummary: 'Best when you are willing to avoid weak cash redemptions and wait for better transfer value.',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png',
    artScale: 1.03
  },
  'capital-one-venture-x': {
    accentRgb: '255 75 58',
    accentClassName: 'text-[#ff4b3a]',
    accentBarClassName: 'bg-[#ff4b3a]',
    laneLabel: 'Low-lift',
    selectorSummary: 'Best when you want a simple travel floor first and transfer upside only when it is clearly worth it.',
    artUrl: 'https://ecm.capitalone.com/WCM/card/products/venture-x-card-art.png',
    artScale: 1.04
  }
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPoints(value: number) {
  return numberFormatter.format(value);
}

function formatCpp(value: number) {
  return `${value.toFixed(1)} cpp`;
}

function formatCppRange(minCpp: number, maxCpp: number) {
  return minCpp === maxCpp ? formatCpp(minCpp) : `${minCpp.toFixed(1)} to ${maxCpp.toFixed(1)} cpp`;
}

function getGoalLabel(value: PointsGoalId) {
  return pointsGoalOptions.find((option) => option.id === value)?.label ?? value;
}

function getEffortLabel(value: PointsEffortId) {
  return pointsEffortOptions.find((option) => option.id === value)?.label ?? value;
}

function getTimeHorizonLabel(value: PointsTimeHorizonId) {
  return pointsTimeHorizonOptions.find((option) => option.id === value)?.label ?? value;
}

function getAssumptionSummary(input: PointsAdvisorInput) {
  return `${getGoalLabel(input.goal)} · ${getTimeHorizonLabel(input.timeHorizon)} · ${getEffortLabel(input.effortTolerance)}`;
}

function getAccentStyle(visual: ProgramVisual): CSSProperties {
  return {
    '--points-accent-rgb': visual.accentRgb,
    '--points-highlight-rgb': visual.highlightRgb ?? visual.accentRgb
  } as CSSProperties;
}

function isPointsProgramId(value: string | null): value is PointsProgramId {
  return Boolean(value && value in programVisuals);
}

function parsePointsSearchValue(value: string | null) {
  if (!value) return null;

  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;

  const nextValue = Number(digitsOnly);
  return Number.isFinite(nextValue) && nextValue >= 0 ? Math.round(nextValue) : null;
}

function getRecommendationGuidance(
  programId: PointsProgramId,
  recommendation: RankedPointsRecommendation
) {
  if (programId === 'chase-sapphire-reserve') {
    if (recommendation.id === 'csr-points-boost') {
      return {
        example: 'A Chase Travel hotel or flight that is explicitly marked for Points Boost.',
        nextStep: 'Check Chase Travel first and confirm the booking shows the boosted rate before you redeem.'
      };
    }

    if (recommendation.id === 'csr-airline-transfer') {
      return {
        example: 'A premium-cabin or international partner flight where cash pricing is high.',
        nextStep: 'Find the award first, then transfer only the exact number of points you need.'
      };
    }

    if (recommendation.id === 'csr-hotel-transfer') {
      return {
        example: 'A Hyatt-style stay where the transfer rate clearly beats the portal price.',
        nextStep: 'Compare the partner award cost against both the cash rate and the boosted portal option.'
      };
    }

    if (recommendation.id === 'csr-hold') {
      return {
        example: 'You do not have a trip lined up yet and do not want to settle for the 1 cent floor.',
        nextStep: 'Wait until you see either a clear transfer win or a real Points Boost booking worth using.'
      };
    }

    return {
      example: 'A statement credit or ordinary portal booking when you just want the guaranteed floor.',
      nextStep: 'Treat this as the fallback and check for a boosted booking before you spend the points.'
    };
  }

  if (programId === 'amex-membership-rewards') {
    if (recommendation.id === 'amex-airline-transfer') {
      return {
        example: 'A business-class or international itinerary booked through an airline partner.',
        nextStep: 'Search award space before transferring because the transfer is the irreversible part.'
      };
    }

    if (recommendation.id === 'amex-travel') {
      return {
        example: 'A simple flight or hotel booking where you want a fixed-value exit without transfer work.',
        nextStep: 'Compare against the cash price first and use points only if the simplicity is worth it to you.'
      };
    }

    if (recommendation.id === 'amex-gift-cards') {
      return {
        example: 'A retail gift card when you want something easy and are not planning travel.',
        nextStep: 'Use this only if you are comfortable giving up the airline-transfer upside.'
      };
    }

    if (recommendation.id === 'amex-hold') {
      return {
        example: 'No flight is on the calendar yet, so you keep the transfer upside intact.',
        nextStep: 'Wait for a specific flight or transfer bonus and only then decide whether to move the points.'
      };
    }

    return {
      example: 'An immediate cash-like exit when convenience matters more than redemption quality.',
      nextStep: 'Treat this as the emergency floor, not the normal way you want to use MR points.'
    };
  }

  if (recommendation.id === 'vx-airline-transfer') {
    return {
      example: 'An award flight where partner pricing clearly beats the fixed 1 cent floor.',
      nextStep: 'Verify the award can actually be booked before you transfer the miles out.'
    };
  }

  if (recommendation.id === 'vx-capital-one-travel') {
    return {
      example: 'A portal booking where you want the whole trip inside one checkout flow.',
      nextStep: 'Compare the portal cash price with the direct rate before you redeem the miles.'
    };
  }

  if (recommendation.id === 'vx-hotel-transfer') {
    return {
      example: 'A hotel stay where the partner booking clearly beats one cent per mile.',
      nextStep: 'Only transfer if the gap over the easy fixed-value floor is big enough to matter.'
    };
  }

  if (recommendation.id === 'vx-hold') {
    return {
      example: 'You do not need the miles today and would rather keep the flexible travel floor.',
      nextStep: 'Wait until you either have a travel purchase to erase or a clear partner redemption lined up.'
    };
  }

  return {
    example: 'A recent travel charge you can wipe off without needing to book through a portal.',
    nextStep: 'Use this as the easy floor, then compare transfer value only if you want more upside.'
  };
}

function ProgramSelectorCard({
  programId,
  active,
  onClick
}: {
  programId: PointsProgramId;
  active: boolean;
  onClick: () => void;
}) {
  const profile = pointsProgramProfiles.find((item) => item.id === programId);
  const visual = programVisuals[programId];

  if (!profile) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-full w-full text-left transition focus-visible:outline-none"
    >
      <div
        className={`relative h-full overflow-hidden rounded-[1.7rem] border p-4 transition duration-300 ${
          active ? activeSurfaceClassName : inactiveSurfaceClassName
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
        <div className="pointer-events-none absolute -right-6 top-1 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.18),transparent_70%)] blur-[44px]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${active ? visual.accentClassName : 'text-text-muted'}`}>
              {profile.currencyName}
            </p>
            <p className="mt-2 text-[1.08rem] font-semibold leading-tight text-text-primary">{profile.title}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">{visual.laneLabel}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              active
                ? `${activeChipClassName} ${visual.accentClassName}`
                : 'border-white/10 bg-white/[0.04] text-text-muted'
            }`}
          >
            {active ? 'Active' : 'Pick'}
          </span>
        </div>

        <div className="relative mx-auto mt-4 flex h-[8.9rem] items-center justify-center">
          <div className="absolute inset-x-10 bottom-4 h-10 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.2),transparent_72%)] blur-[30px]" />
          <EntityImage
            src={visual.artUrl}
            alt={profile.title}
            label={profile.title}
            className="relative aspect-[1.62/1] w-full max-w-[13.75rem] overflow-visible rounded-none border-0 bg-transparent"
            imgClassName="bg-transparent p-0 drop-shadow-[0_24px_40px_rgba(0,0,0,0.42)]"
            fallbackClassName="bg-black/10"
            fit="contain"
            position={visual.artPosition}
            scale={visual.artScale ?? 1}
          />
        </div>

        <div className="relative mt-3">
          <p className="text-sm leading-6 text-text-secondary">{visual.selectorSummary}</p>
          <div className={`mt-4 h-[2px] rounded-full transition-all ${active ? `w-16 ${visual.accentBarClassName}` : 'w-10 bg-white/10'}`} />
        </div>
      </div>
    </button>
  );
}

function ChoicePill({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
        active ? activeChipClassName : inactiveChipClassName
      }`}
    >
      {label}
    </button>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  activeId,
  onSelect
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  activeId: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoicePill
            key={option.id}
            active={activeId === option.id}
            label={option.label}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  label,
  title,
  value,
  note,
  accentClassName
}: {
  label: string;
  title: string;
  value: string;
  note: string;
  accentClassName: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">{label}</p>
      <p className="mt-3 text-base font-semibold text-text-primary">{title}</p>
      <p className={`mt-3 text-lg font-semibold ${accentClassName}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{note}</p>
    </div>
  );
}

function ResultHighlightCard({
  recommendation,
  accentClassName,
  guidance
}: {
  recommendation: RankedPointsRecommendation;
  accentClassName: string;
  guidance: { example: string; nextStep: string };
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[1.9rem] border border-[rgb(var(--points-accent-rgb)/0.26)] bg-[linear-gradient(180deg,rgba(15,21,34,0.98),rgba(10,14,24,0.98))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
      <div className="pointer-events-none absolute -right-8 top-0 h-32 w-40 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.14),transparent_72%)] blur-[52px]" />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${accentClassName}`}>
                Best move right now
              </p>
              <h3 className="mt-3 font-heading text-[clamp(2.3rem,4vw,3.4rem)] leading-[0.92] tracking-[-0.04em] text-text-primary">
                {recommendation.shortLabel}
              </h3>
            </div>

            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3 lg:min-w-[13rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Estimated value</p>
              <p className={`mt-2 font-heading text-[2.2rem] leading-none tracking-[-0.04em] ${accentClassName}`}>
                {formatCurrency(recommendation.estimatedValue)}
              </p>
              <p className="mt-2 text-xs leading-5 text-text-secondary">
                Usually around {recommendation.likelyCpp.toFixed(1)} cents per point.
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-[1rem] leading-7 text-text-primary">{recommendation.fitSummary}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${activeChipClassName}`}>
              {formatCppRange(recommendation.minCpp, recommendation.maxCpp)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Effort: {getEffortLabel(recommendation.effort)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Timing: {getTimeHorizonLabel(recommendation.timeToValue)}
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary">{recommendation.summary}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Why it fits</p>
              <p className="mt-2 text-sm leading-6 text-text-primary">{recommendation.bestFor}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Example</p>
              <p className="mt-2 text-sm leading-6 text-text-primary">{guidance.example}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Do next</p>
              <p className="mt-2 text-sm leading-6 text-text-primary">{guidance.nextStep}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-text-secondary">
            <span className="font-semibold text-text-primary">Watch out:</span> {recommendation.watchOut}
          </p>
        </div>

        <div className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Modeled range</p>
          <p className="mt-3 text-lg font-semibold text-text-primary">
            {formatCurrency(recommendation.minimumValue)} to {formatCurrency(recommendation.maximumValue)}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            That is the range this recommendation can reasonably land in under your current assumptions.
          </p>

          <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">Best use case</p>
            <p className={`mt-2 text-sm font-semibold ${accentClassName}`}>{recommendation.recommendationLabel}</p>
          </div>

          <p className="mt-4 text-xs leading-5 text-text-muted">
            Modeled values only. This does not check live award space, transfer bonuses, or portal inventory.
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function ResultOptionCard({
  recommendation,
  accentClassName
}: {
  recommendation: RankedPointsRecommendation;
  accentClassName: string;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,19,30,0.96),rgba(10,14,24,0.96))] p-5"
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${accentClassName}`}>
        {recommendation.recommendationLabel}
      </p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <h4 className="font-heading text-[2rem] leading-[0.94] tracking-[-0.03em] text-text-primary">
          {recommendation.shortLabel}
        </h4>
        <div className="text-right">
          <p className={`text-lg font-semibold ${accentClassName}`}>
            {formatCurrency(recommendation.estimatedValue)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
            {formatCppRange(recommendation.minCpp, recommendation.maxCpp)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-text-primary">{recommendation.fitSummary}</p>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{recommendation.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
          {getEffortLabel(recommendation.effort)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
          {getTimeHorizonLabel(recommendation.timeToValue)}
        </span>
      </div>
    </motion.article>
  );
}

export function PointsAdvisor() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState<PointsAdvisorInput>(defaultInput);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  useEffect(() => {
    const queryProgram = searchParams.get('program');
    const nextProgramId = isPointsProgramId(queryProgram) ? queryProgram : null;
    const nextPointsBalance = parsePointsSearchValue(searchParams.get('points'));

    if (!nextProgramId && nextPointsBalance === null) {
      return;
    }

    setInput((current) => {
      const shouldUpdateProgram = nextProgramId && nextProgramId !== current.programId;
      const shouldUpdatePoints =
        nextPointsBalance !== null && nextPointsBalance !== current.pointsBalance;

      if (!shouldUpdateProgram && !shouldUpdatePoints) {
        return current;
      }

      return {
        ...current,
        programId: nextProgramId ?? current.programId,
        pointsBalance: nextPointsBalance ?? current.pointsBalance
      };
    });
  }, [searchParams]);

  const result = buildPointsAdvisorResult(input);
  const visual = programVisuals[result.profile.id];
  const accentStyle = getAccentStyle(visual);
  const topRecommendation = result.topRecommendations[0];
  const alternativeRecommendations = result.topRecommendations.slice(1, 3);
  const easiestAlternativeOption =
    [...result.allRecommendations]
      .filter(
        (recommendation) =>
          recommendation.id !== topRecommendation?.id &&
          recommendation.effort === 'low' &&
          recommendation.strategy !== 'hold'
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.maximumValue - a.maximumValue ||
          a.rank - b.rank
      )[0] ?? result.easiestGoodOption;
  const highestUpsideAlternative =
    [...result.allRecommendations]
      .filter(
        (recommendation) =>
          recommendation.id !== topRecommendation?.id &&
          (recommendation.strategy === 'airline_transfer' ||
            recommendation.strategy === 'hotel_transfer')
      )
      .sort(
        (a, b) =>
          b.maximumValue - a.maximumValue ||
          b.score - a.score ||
          a.rank - b.rank
      )[0] ?? result.highestUpsideOption;
  const assumptionSummary = getAssumptionSummary(input);
  const topRecommendationGuidance = topRecommendation
    ? getRecommendationGuidance(result.profile.id, topRecommendation)
    : null;

  function updateProgram(programId: PointsProgramId) {
    startTransition(() => {
      setInput((current) => ({ ...current, programId }));
    });
  }

  function updateGoal(goal: PointsGoalId) {
    setInput((current) => ({ ...current, goal }));
  }

  function updateTimeHorizon(timeHorizon: PointsTimeHorizonId) {
    setInput((current) => ({ ...current, timeHorizon }));
  }

  function updateEffortTolerance(effortTolerance: PointsEffortId) {
    setInput((current) => ({ ...current, effortTolerance }));
  }

  function handlePointsChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/[^\d]/g, '');
    setInput((current) => ({
      ...current,
      pointsBalance: digitsOnly ? Number(digitsOnly) : 0
    }));
  }

  return (
    <section className="relative mx-auto max-w-6xl space-y-6" style={accentStyle}>
      <div className="pointer-events-none absolute left-[-7rem] top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_70%)] blur-[56px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_72%)] blur-3xl" />

      <section className={`${panelClassName} px-5 py-5 md:px-8 md:py-6`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-14 top-[-3rem] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.1),transparent_70%)] blur-[52px]" />
        <div className="pointer-events-none absolute right-[-3rem] top-1 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_72%)] blur-[56px]" />

        <div className="relative">
          <div className={`${insetPanelClassName} p-4 md:p-5`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${visual.accentClassName}`}>Step 1</p>
                <h2 className="mt-2 font-heading text-[1.9rem] leading-[0.98] tracking-[-0.03em] text-text-primary">
                  Choose the points program
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Start with the ecosystem. That is the biggest thing driving the recommendation.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary">
                Best fit: {topRecommendation?.shortLabel ?? 'No recommendation yet'}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {pointsProgramProfiles.map((profile) => (
                <ProgramSelectorCard
                  key={profile.id}
                  programId={profile.id}
                  active={input.programId === profile.id}
                  onClick={() => updateProgram(profile.id)}
                />
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-5 md:pt-6">
              <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:items-center md:gap-8">
                <div className="text-center md:self-center md:text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">Step 2</p>
                  <h2 className="mt-2 font-heading text-[1.9rem] leading-[0.98] tracking-[-0.03em] text-text-primary">
                    Enter your points
                  </h2>
                </div>

                <div className="border-b border-white/10 px-3 pb-5 md:self-center md:pb-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={input.pointsBalance === 0 ? '' : formatPoints(input.pointsBalance)}
                    onChange={handlePointsChange}
                    placeholder="100,000"
                    aria-label="Points balance"
                    className="w-full bg-transparent text-center font-heading text-[clamp(3.1rem,8vw,5.4rem)] leading-none tracking-[-0.06em] text-text-primary placeholder:text-text-muted focus:outline-none md:text-right"
                  />
                  <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted md:text-right">
                    points
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionCardClassName} p-5 md:p-6`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
        <div className="pointer-events-none absolute left-[-2rem] top-20 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_70%)] blur-[46px]" />

        <div className="relative">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${visual.accentClassName}`}>
                Step 3
              </p>
              <h2 className="mt-3 max-w-3xl font-heading text-[clamp(2.1rem,4vw,3rem)] leading-[0.94] tracking-[-0.04em] text-text-primary">
                Best move for {formatPoints(result.input.pointsBalance)} {result.profile.currencyName.toLowerCase()}
              </h2>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <button
                type="button"
                onClick={() => setShowAdvancedControls((current) => !current)}
                className={`text-sm font-semibold transition ${
                  showAdvancedControls ? 'text-text-primary' : visual.accentClassName
                }`}
              >
                {showAdvancedControls ? 'Hide assumptions' : 'Refine assumptions'}
              </button>
              <p className="max-w-sm text-sm leading-6 text-text-secondary md:text-right">
                {assumptionSummary}
              </p>
            </div>
          </div>

          {showAdvancedControls ? (
            <div className="mt-5 grid gap-5 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <FilterGroup
                label="Goal"
                options={pointsGoalOptions}
                activeId={input.goal}
                onSelect={updateGoal}
              />
              <FilterGroup
                label="Timing"
                options={pointsTimeHorizonOptions}
                activeId={input.timeHorizon}
                onSelect={updateTimeHorizon}
              />
              <FilterGroup
                label="Work level"
                options={pointsEffortOptions}
                activeId={input.effortTolerance}
                onSelect={updateEffortTolerance}
              />
            </div>
          ) : null}

          {topRecommendation && topRecommendationGuidance ? (
            <div className="mt-6">
              <ResultHighlightCard
                recommendation={topRecommendation}
                accentClassName={visual.accentClassName}
                guidance={topRecommendationGuidance}
              />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InsightCard
              label="Easy option"
              title={easiestAlternativeOption.shortLabel}
              value={formatCurrency(easiestAlternativeOption.estimatedValue)}
              note={easiestAlternativeOption.bestFor}
              accentClassName={visual.accentClassName}
            />
            <InsightCard
              label="Highest upside"
              title={highestUpsideAlternative.shortLabel}
              value={`${formatCurrency(highestUpsideAlternative.minimumValue)} to ${formatCurrency(highestUpsideAlternative.maximumValue)}`}
              note={highestUpsideAlternative.bestFor}
              accentClassName={visual.accentClassName}
            />
          </div>

          {alternativeRecommendations.length ? (
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                Other solid options
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {alternativeRecommendations.map((recommendation) => (
                  <ResultOptionCard
                    key={`${result.profile.id}-${recommendation.id}-${recommendation.rank}`}
                    recommendation={recommendation}
                    accentClassName={visual.accentClassName}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <details className="mt-6 rounded-[1.55rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary">
              See full ranking
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
              Every modeled path stays here if you want to inspect the whole tradeoff set instead of only the first answer.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {result.allRecommendations.map((recommendation) => (
                <div
                  key={`${result.profile.id}-${recommendation.id}-full`}
                  className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${visual.accentClassName}`}>
                        Rank {recommendation.rank}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-text-primary">{recommendation.label}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${visual.accentClassName}`}>
                        {formatCurrency(recommendation.estimatedValue)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                        {formatCppRange(recommendation.minCpp, recommendation.maxCpp)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{recommendation.summary}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>
    </section>
  );
}
