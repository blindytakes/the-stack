'use client';

import { motion } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties
} from 'react';
import { trackFunnelEvent } from '@/components/analytics/funnel-events';
import { EntityImage } from '@/components/ui/entity-image';
import {
  buildPointsAdvisorResult,
  calculateTripRedemption,
  pointsEffortOptions,
  pointsGoalOptions,
  pointsProgramProfiles,
  pointsTimeHorizonOptions,
  type PointsAdvisorInput,
  type PointsEffortId,
  type PointsGoalId,
  type PointsProgramId,
  type PointsProgramProfile,
  type PointsSourceNote,
  type PointsTripRedemptionInput,
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

type TripRedemptionFormInput = Omit<
  PointsTripRedemptionInput,
  'pointsBalance' | 'baselineCpp'
>;

const defaultTripRedemptionInput: TripRedemptionFormInput = {
  cashPrice: 1200,
  pointsRequired: 70000,
  taxesAndFees: 85,
  transferRatio: 1,
  transferBonusPercent: 0
};

const panelClassName =
  'relative overflow-visible rounded-[1.55rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,30,0.98),rgba(8,12,20,0.99))] shadow-[0_18px_70px_rgba(0,0,0,0.24)]';
const sectionCardClassName =
  'relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,27,0.98),rgba(8,12,20,0.98))] shadow-[0_22px_80px_rgba(0,0,0,0.26)]';
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
  'chase-sapphire-preferred': {
    accentRgb: '90 224 255',
    highlightRgb: '212 168 83',
    accentClassName: 'text-[#5ae0ff]',
    accentBarClassName: 'bg-[#5ae0ff]',
    laneLabel: 'Lower-fee',
    selectorSummary: 'Best when you want Chase transfer partners and lower-fee travel flexibility.',
    artUrl:
      'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/sapphire_preferred_card.png',
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
  },
  'capital-one-venture-rewards': {
    accentRgb: '255 75 58',
    accentClassName: 'text-[#ff4b3a]',
    accentBarClassName: 'bg-[#ff4b3a]',
    laneLabel: 'Simple miles',
    selectorSummary: 'Best when you want a 1 cent travel floor with optional partner upside.',
    artUrl: 'https://ecm.capitalone.com/WCM/card/products/venture-card-art.png',
    artScale: 1.04
  },
  'citi-thankyou': {
    accentRgb: '64 170 255',
    highlightRgb: '255 255 255',
    accentClassName: 'text-[#40aaff]',
    accentBarClassName: 'bg-[#40aaff]',
    laneLabel: 'Transferable',
    selectorSummary: 'Best when you want a 1 cent floor and targeted transfer upside.',
    artUrl: '/card-logos/citi.svg',
    artScale: 0.82
  }
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value: number) {
  if (value > 0) return `+${formatCurrency(value)}`;
  if (value < 0) return `-${formatCurrency(Math.abs(value))}`;
  return formatCurrency(0);
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

function isPointsGoalId(value: string | null): value is PointsGoalId {
  return Boolean(value && pointsGoalOptions.some((option) => option.id === value));
}

function isPointsTimeHorizonId(value: string | null): value is PointsTimeHorizonId {
  return Boolean(value && pointsTimeHorizonOptions.some((option) => option.id === value));
}

function isPointsEffortId(value: string | null): value is PointsEffortId {
  return Boolean(value && pointsEffortOptions.some((option) => option.id === value));
}

function parsePointsSearchValue(value: string | null) {
  if (!value) return null;

  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;

  const nextValue = Number(digitsOnly);
  return Number.isFinite(nextValue) && nextValue >= 0 ? Math.round(nextValue) : null;
}

function parseTripNumber(value: string) {
  const normalized = value.replace(/[^\d.]/g, '');
  const nextValue = Number(normalized);
  return Number.isFinite(nextValue) ? nextValue : 0;
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

  if (programId === 'chase-sapphire-preferred') {
    if (recommendation.strategy === 'portal') {
      return {
        example: 'A Chase Travel flight or hotel that is marked with a Preferred Points Boost rate.',
        nextStep: 'Check the portal price and confirm the booking is actually boosted before redeeming.'
      };
    }

    if (recommendation.strategy === 'airline_transfer') {
      return {
        example: 'An international itinerary where partner pricing is clearly lower than the cash fare.',
        nextStep: 'Find the award first, then transfer only the points needed for that booking.'
      };
    }

    if (recommendation.strategy === 'hotel_transfer') {
      return {
        example: 'A specific hotel stay where the award price beats both cash and Chase Travel.',
        nextStep: 'Compare award cost, taxes, and cancellation rules before moving points.'
      };
    }

    if (recommendation.strategy === 'hold') {
      return {
        example: 'You do not have a trip lined up and do not want to settle for the 1 cent floor.',
        nextStep: 'Hold until you can test a real boosted booking or transfer redemption.'
      };
    }

    return {
      example: 'An immediate cash-like redemption when certainty matters more than upside.',
      nextStep: 'Use this as the fallback after checking for a boosted booking or transfer win.'
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

  if (programId === 'citi-thankyou') {
    if (recommendation.strategy === 'airline_transfer') {
      return {
        example: 'A flight where the Citi transfer partner award price beats the cash fare.',
        nextStep: 'Confirm award availability before transferring because reversals usually are not available.'
      };
    }

    if (recommendation.strategy === 'hotel_transfer') {
      return {
        example: 'A hotel stay where the partner award price clears the 1 cent floor by enough to matter.',
        nextStep: 'Compare against cash and Citi Travel before giving up flexible points.'
      };
    }

    if (recommendation.strategy === 'hold') {
      return {
        example: 'No trip is ready, so you preserve the option to use transfer partners later.',
        nextStep: 'Wait until you have a specific redemption to price.'
      };
    }

    return {
      example: 'A simple cash-like or Citi Travel redemption when immediate certainty matters.',
      nextStep: 'Treat this as the floor and test a transfer only if you want more upside.'
    };
  }

  if (programId === 'capital-one-venture-rewards') {
    if (recommendation.strategy === 'airline_transfer') {
      return {
        example: 'An award flight where partner pricing clearly beats the fixed 1 cent floor.',
        nextStep: 'Verify the award can actually be booked before you transfer miles out.'
      };
    }

    if (recommendation.strategy === 'hotel_transfer') {
      return {
        example: 'A hotel stay where the partner booking clearly beats one cent per mile.',
        nextStep: 'Only transfer if the gap over the easy fixed-value floor is big enough to matter.'
      };
    }

    if (recommendation.strategy === 'hold') {
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

function ProgramArtPanel({
  activeProgramId,
  open,
  onToggle,
  onSelect
}: {
  activeProgramId: PointsProgramId;
  open: boolean;
  onToggle: () => void;
  onSelect: (programId: PointsProgramId) => void;
}) {
  const activeProfile = pointsProgramProfiles.find((item) => item.id === activeProgramId);
  const activeVisual = programVisuals[activeProgramId];
  const mainArtScale = Math.min(activeVisual.artScale ?? 1, 1);

  if (!activeProfile) return null;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-visible rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.18),transparent_70%)] blur-[46px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_50%_38%,rgb(var(--points-accent-rgb)/0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.08))] px-6 pb-5 pt-16 md:px-8 md:pb-6 md:pt-[4.75rem]">
        <button
          type="button"
          aria-haspopup="listbox"
          onClick={onToggle}
          aria-expanded={open}
          className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-2 text-sm font-semibold text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-[rgb(var(--points-accent-rgb)/0.5)] hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--points-accent-rgb)/0.5)]"
        >
          <span>{open ? 'Close selector' : 'Change card'}</span>
          <span className={`rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${activeVisual.accentClassName}`}>
            {open ? 'Close' : 'Browse'}
          </span>
        </button>

        {open ? (
          <div
            role="listbox"
            aria-label="Points program"
            className="absolute left-4 right-4 top-[4.7rem] z-40 grid max-h-[min(26rem,calc(100vh-8rem))] gap-2 overflow-y-auto rounded-[1.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.99),rgba(8,12,20,0.995))] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.44)] sm:left-auto sm:w-[min(31rem,calc(100%-2rem))] sm:grid-cols-2 md:right-5"
          >
            {pointsProgramProfiles.map((profile) => {
              const optionVisual = programVisuals[profile.id];
              const active = profile.id === activeProgramId;

              return (
                <button
                  key={profile.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(profile.id)}
                  className={`flex items-center gap-3 rounded-[1.05rem] border p-3 text-left transition ${
                    active ? activeSurfaceClassName : inactiveSurfaceClassName
                  }`}
                >
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-[0.85rem] border border-white/10 bg-black/15">
                    <EntityImage
                      src={optionVisual.artUrl}
                      alt={profile.title}
                      label={profile.title}
                      className="aspect-[1.62/1] w-full max-w-[4.8rem] overflow-visible rounded-none border-0 bg-transparent"
                      imgClassName="bg-transparent p-0"
                      fallbackClassName="bg-black/10"
                      fit="contain"
                      position={optionVisual.artPosition}
                      scale={optionVisual.artScale ?? 1}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-text-primary">
                      {profile.title}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {optionVisual.laneLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-12 bottom-8 h-14 rounded-full bg-black/35 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-12 bottom-8 h-12 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.16),transparent_70%)] blur-[32px]" />
        <div className="relative flex min-h-[12rem] w-full items-center justify-center sm:min-h-[14rem] md:min-h-[16.25rem]">
          <EntityImage
            src={activeVisual.artUrl}
            alt={activeProfile.title}
            label={activeProfile.title}
            className="relative aspect-[1.62/1] w-full max-w-[24.75rem] overflow-visible rounded-none border-0 bg-transparent"
            imgClassName="bg-transparent p-0 drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]"
            fallbackClassName="bg-black/10"
            fit="contain"
            position={activeVisual.artPosition}
            scale={mainArtScale}
          />
        </div>
        <div className="relative z-10 mt-5 w-full border-t border-white/8 pt-4 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${activeVisual.accentClassName}`}>
            Program
          </p>
          <p className="mt-2 truncate text-[1.2rem] font-semibold leading-tight text-text-primary">
            {activeProfile.title}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {activeProfile.currencyName}
          </p>
        </div>
      </div>
    </div>
  );
}

function RedemptionEquation() {
  return (
    <div
      aria-label="Program plus balance plus goal equals best move"
      className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
    >
      <span>Program</span>
      <span className="text-[rgb(var(--points-accent-rgb))]">+</span>
      <span>Balance</span>
      <span className="text-[rgb(var(--points-accent-rgb))]">+</span>
      <span>Goal</span>
      <span className="text-text-secondary">=</span>
      <span className="text-text-primary">Best move</span>
    </div>
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

function ScoreBreakdown({
  recommendation,
  accentClassName
}: {
  recommendation: RankedPointsRecommendation;
  accentClassName: string;
}) {
  const visibleItems = recommendation.scoreBreakdown
    .filter((item) => item.impact !== 0)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  return (
    <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Why this ranked first
        </p>
        <p className={`text-xs font-semibold ${accentClassName}`}>Score {recommendation.score}</p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {visibleItems.map((item) => (
          <div
            key={`${recommendation.id}-${item.label}-${item.value}`}
            className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-white/8 bg-black/10 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-semibold text-text-primary">{item.label}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.value}</p>
            </div>
            <span className={item.impact >= 0 ? accentClassName : 'text-brand-coral'}>
              {item.impact > 0 ? '+' : ''}
              {item.impact.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TripInputField({
  label,
  value,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-[1.2rem] border border-white/10 bg-white/[0.035] px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value === 0 ? '' : String(value)}
          onChange={(event) => onChange(parseTripNumber(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder="0"
        />
        {suffix ? <span className="text-sm text-text-muted">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TripRedemptionCalculator({
  input,
  onChange,
  result,
  baselineCpp,
  accentClassName
}: {
  input: TripRedemptionFormInput;
  onChange: (field: keyof TripRedemptionFormInput, value: number) => void;
  result: ReturnType<typeof calculateTripRedemption>;
  baselineCpp: number;
  accentClassName: string;
}) {
  const statusClassName =
    result.status === 'strong_value'
      ? accentClassName
      : result.status === 'weak_value' || result.status === 'not_enough_points'
        ? 'text-brand-coral'
        : 'text-text-primary';

  return (
    <section className={`${sectionCardClassName} p-5 md:p-6`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${accentClassName}`}>
            Real redemption check
          </p>
          <h2 className="mt-3 max-w-3xl font-heading text-[clamp(2rem,4vw,2.8rem)] leading-[0.98] text-text-primary">
            Price the trip before you transfer
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
            Enter a cash price and award cost to calculate the actual cents per point after taxes,
            transfer ratios, and transfer bonuses.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <TripInputField
              label="Cash price"
              value={input.cashPrice}
              onChange={(value) => onChange('cashPrice', value)}
            />
            <TripInputField
              label="Points required"
              value={input.pointsRequired}
              suffix="pts"
              onChange={(value) => onChange('pointsRequired', value)}
            />
            <TripInputField
              label="Taxes and fees"
              value={input.taxesAndFees}
              onChange={(value) => onChange('taxesAndFees', value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TripInputField
                label="Transfer ratio"
                value={input.transferRatio}
                suffix=":1"
                onChange={(value) => onChange('transferRatio', value)}
              />
              <TripInputField
                label="Transfer bonus"
                value={input.transferBonusPercent}
                suffix="%"
                onChange={(value) => onChange('transferBonusPercent', value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Trip verdict
          </p>
          <p className={`mt-3 text-2xl font-semibold ${statusClassName}`}>
            {result.statusLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{result.summary}</p>

          <div className="mt-5 grid gap-2">
            <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
              <span className="text-text-secondary">Effective value</span>
              <span className={`font-semibold ${accentClassName}`}>
                {result.effectiveCpp.toFixed(2)} cpp
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
              <span className="text-text-secondary">Bank points needed</span>
              <span className="font-semibold text-text-primary">
                {formatPoints(result.effectivePointsCost)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
              <span className="text-text-secondary">Value after fees</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(result.cashValueAfterFees)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
              <span className="text-text-secondary">Vs easy floor</span>
              <span className={`font-semibold ${result.incrementalValue >= 0 ? accentClassName : 'text-brand-coral'}`}>
                {formatSignedCurrency(result.incrementalValue)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-text-muted">
            Easy floor baseline: {baselineCpp.toFixed(2)} cpp from the current low-effort option.
          </p>
        </div>
      </div>
    </section>
  );
}

function SourceDisclosure({
  sources,
  assumptionNotes
}: {
  sources: PointsSourceNote[];
  assumptionNotes: PointsProgramProfile['assumptionNotes'];
}) {
  return (
    <details className="rounded-[1.35rem] border border-white/10 bg-white/[0.025] p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary">
        Sources and assumptions
      </summary>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Current sources
          </p>
          <div className="mt-3 space-y-2">
            {sources.map((source) => (
              <a
                key={`${source.label}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm text-text-secondary transition hover:border-white/18 hover:text-text-primary"
              >
                <span className="font-semibold text-text-primary">{source.label}</span>
                <span className="mt-1 block text-xs text-text-muted">
                  Verified {source.lastVerifiedAt}
                </span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Modeling notes
          </p>
          <div className="mt-3 space-y-2">
            {assumptionNotes.map((note) => (
              <p
                key={note}
                className="rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm leading-6 text-text-secondary"
              >
                {note}
              </p>
            ))}
          </div>
        </div>
      </div>
    </details>
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

          <ScoreBreakdown recommendation={recommendation} accentClassName={accentClassName} />

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
  const pathname = usePathname();
  const [input, setInput] = useState<PointsAdvisorInput>(defaultInput);
  const [tripInput, setTripInput] = useState<TripRedemptionFormInput>(defaultTripRedemptionInput);
  const [hasAppliedSearchParams, setHasAppliedSearchParams] = useState(false);
  const [programPickerOpen, setProgramPickerOpen] = useState(false);
  const lastTrackedRecommendationRef = useRef<string | null>(null);

  useEffect(() => {
    const queryProgram = searchParams.get('program');
    const queryGoal = searchParams.get('goal');
    const queryTimeHorizon = searchParams.get('time');
    const queryEffortTolerance = searchParams.get('effort');
    const nextProgramId = isPointsProgramId(queryProgram) ? queryProgram : null;
    const nextPointsBalance = parsePointsSearchValue(searchParams.get('points'));
    const nextGoal = isPointsGoalId(queryGoal) ? queryGoal : null;
    const nextTimeHorizon = isPointsTimeHorizonId(queryTimeHorizon)
      ? queryTimeHorizon
      : null;
    const nextEffortTolerance = isPointsEffortId(queryEffortTolerance)
      ? queryEffortTolerance
      : null;

    if (
      !nextProgramId &&
      nextPointsBalance === null &&
      !nextGoal &&
      !nextTimeHorizon &&
      !nextEffortTolerance
    ) {
      setHasAppliedSearchParams(true);
      return;
    }

    setInput((current) => {
      const shouldUpdateProgram = nextProgramId && nextProgramId !== current.programId;
      const shouldUpdatePoints =
        nextPointsBalance !== null && nextPointsBalance !== current.pointsBalance;
      const shouldUpdateGoal = nextGoal && nextGoal !== current.goal;
      const shouldUpdateTimeHorizon =
        nextTimeHorizon && nextTimeHorizon !== current.timeHorizon;
      const shouldUpdateEffortTolerance =
        nextEffortTolerance && nextEffortTolerance !== current.effortTolerance;

      if (
        !shouldUpdateProgram &&
        !shouldUpdatePoints &&
        !shouldUpdateGoal &&
        !shouldUpdateTimeHorizon &&
        !shouldUpdateEffortTolerance
      ) {
        return current;
      }

      return {
        ...current,
        programId: nextProgramId ?? current.programId,
        pointsBalance: nextPointsBalance ?? current.pointsBalance,
        goal: nextGoal ?? current.goal,
        timeHorizon: nextTimeHorizon ?? current.timeHorizon,
        effortTolerance: nextEffortTolerance ?? current.effortTolerance
      };
    });
    setHasAppliedSearchParams(true);
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
  const tripResult = calculateTripRedemption({
    ...tripInput,
    pointsBalance: result.input.pointsBalance,
    baselineCpp: result.easiestGoodOption.likelyCpp
  });

  useEffect(() => {
    if (!hasAppliedSearchParams) return;

    const params = new URLSearchParams();
    params.set('program', input.programId);

    if (input.pointsBalance > 0) {
      params.set('points', String(input.pointsBalance));
    }

    params.set('goal', input.goal);
    params.set('time', input.timeHorizon);
    params.set('effort', input.effortTolerance);

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [hasAppliedSearchParams, input, pathname]);

  useEffect(() => {
    if (!hasAppliedSearchParams || !topRecommendation) return;

    const trackingKey = [
      result.profile.id,
      input.goal,
      input.timeHorizon,
      input.effortTolerance,
      topRecommendation.id
    ].join(':');

    if (lastTrackedRecommendationRef.current === trackingKey) return;
    lastTrackedRecommendationRef.current = trackingKey;

    trackFunnelEvent('points_advisor_recommendation_view', {
      tool: 'points_redemption_advisor',
      program: result.profile.id,
      goal: input.goal,
      recommendation: topRecommendation.id
    });
  }, [
    hasAppliedSearchParams,
    input.goal,
    input.timeHorizon,
    input.effortTolerance,
    result.profile.id,
    topRecommendation
  ]);

  function updateProgram(programId: PointsProgramId) {
    startTransition(() => {
      setInput((current) => ({ ...current, programId }));
      setProgramPickerOpen(false);
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

  function updateTripInput(field: keyof TripRedemptionFormInput, value: number) {
    setTripInput((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <section className="relative mx-auto max-w-6xl space-y-6" style={accentStyle}>
      <div className="pointer-events-none absolute left-[-7rem] top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_70%)] blur-[56px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_72%)] blur-3xl" />

      <section className={`${panelClassName} px-4 py-5 md:px-6 md:py-6`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-14 top-[-3rem] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.1),transparent_70%)] blur-[52px]" />
        <div className="pointer-events-none absolute right-[-3rem] top-1 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_72%)] blur-[56px]" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(28rem,0.88fr)] xl:items-stretch">
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${visual.accentClassName}`}>
              Points Redemption Tool
            </p>
            <h1 className="mt-3 max-w-[54rem] font-heading text-[2.35rem] leading-[0.96] text-text-primary md:text-[3.45rem]">
              Points Redemption Calculator
            </h1>
            <p className="mt-3 max-w-[47rem] text-sm leading-6 text-text-secondary md:text-base md:leading-7">
              Compare easy exits, transfer plays, and trip-specific redemption math before you spend flexible points.
            </p>

            <label className="mt-5 block rounded-[1.15rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                Points balance
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={input.pointsBalance === 0 ? '' : formatPoints(input.pointsBalance)}
                onChange={handlePointsChange}
                placeholder="100,000"
                aria-label="Points balance"
                className="mt-2 w-full bg-transparent text-center font-heading text-[clamp(2.15rem,4.7vw,3.15rem)] leading-none tracking-[-0.06em] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">
                points
              </span>
            </label>

            <RedemptionEquation />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[1rem] border border-[rgb(var(--points-accent-rgb)/0.32)] bg-[rgb(var(--points-accent-rgb)/0.08)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Best move</p>
                <p className="mt-2 text-[1.8rem] font-semibold leading-none text-text-primary">
                  {topRecommendation?.shortLabel ?? 'Run advisor'}
                </p>
                <p className={`mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${visual.accentClassName}`}>
                  {topRecommendation
                    ? `${topRecommendation.likelyCpp.toFixed(1)} cpp modeled`
                    : 'Recommendation pending'}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Estimated value</p>
                <p className="mt-2 text-[1.8rem] font-semibold leading-none text-text-primary">
                  {topRecommendation ? formatCurrency(topRecommendation.estimatedValue) : '$0'}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  {topRecommendation
                    ? formatCppRange(topRecommendation.minCpp, topRecommendation.maxCpp)
                    : 'Enter points'}
                </p>
              </div>
            </div>
          </div>

          <ProgramArtPanel
            activeProgramId={input.programId}
            open={programPickerOpen}
            onToggle={() => setProgramPickerOpen((current) => !current)}
            onSelect={updateProgram}
          />
        </div>
      </section>

      <section className={`${sectionCardClassName} p-5 md:p-6`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
        <div className="pointer-events-none absolute left-[-2rem] top-20 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgb(var(--points-accent-rgb)/0.08),transparent_70%)] blur-[46px]" />

        <div className="relative">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${visual.accentClassName}`}>
                Current recommendation
              </p>
              <h2 className="mt-3 max-w-3xl font-heading text-[clamp(2.2rem,4vw,3rem)] leading-[0.94] tracking-[-0.04em] text-text-primary">
                Best move now
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                For {formatPoints(result.input.pointsBalance)} {result.profile.currencyName.toLowerCase()}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className={`text-sm font-semibold ${visual.accentClassName}`}>Current assumptions</p>
              <p className="max-w-sm text-sm leading-6 text-text-secondary md:text-right">
                {assumptionSummary}
              </p>
            </div>
          </div>

          {topRecommendation && topRecommendationGuidance ? (
            <div className="mt-5">
              <ResultHighlightCard
                recommendation={topRecommendation}
                accentClassName={visual.accentClassName}
                guidance={topRecommendationGuidance}
              />
            </div>
          ) : null}

          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-sm font-semibold text-text-primary">Refine assumptions</p>
              <p className="text-xs leading-5 text-text-muted">
                Adjust these when the recommendation does not match the trip you are pricing.
              </p>
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-3">
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
          </div>

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

      <TripRedemptionCalculator
        input={tripInput}
        onChange={updateTripInput}
        result={tripResult}
        baselineCpp={result.easiestGoodOption.likelyCpp}
        accentClassName={visual.accentClassName}
      />

      <SourceDisclosure
        sources={result.profile.sources}
        assumptionNotes={result.profile.assumptionNotes}
      />
    </section>
  );
}
