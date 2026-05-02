'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties
} from 'react';
import { PremiumCardEmailPanel } from '@/components/tools/premium-card-email-panel';
import { Button } from '@/components/ui/button';
import { EntityImage } from '@/components/ui/entity-image';
import {
  buildPointsAdvisorHref,
  getPointsAdvisorProgramFromCardSlug
} from '@/lib/points-advisor';
import {
  buildInitialPremiumCardScenario,
  calculatePremiumCardScenario,
  premiumCardProfileById,
  premiumCardProfiles,
  type PremiumCardId,
  type PremiumCardProfile,
  type PremiumCardScenario
} from '@/lib/premium-card-calculator';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

type PremiumCardFieldInteractions = Record<string, boolean>;

const cardVisuals: Record<
  PremiumCardId,
  {
    accentRgb: string;
    highlightRgb?: string;
    accentClassName: string;
    laneLabel: string;
    selectorSummary: string;
    accentBarClassName: string;
    accentGlowClassName: string;
    selectorWidthClassName: string;
    artUrl: string;
    artScale?: number;
    artFit?: 'contain' | 'cover';
    artPosition?: string;
    artEffectClassName?: string;
    selectorArtScale?: number;
    selectorArtFit?: 'contain' | 'cover';
    selectorArtPosition?: string;
    selectorArtEffectClassName?: string;
  }
> = {
  'amex-platinum': {
    accentRgb: '214 229 255',
    accentClassName: 'text-[#d6e5ff]',
    accentBarClassName: 'bg-[#d6e5ff]',
    accentGlowClassName: 'bg-[#d6e5ff]/42',
    selectorWidthClassName: 'max-w-[17.45rem]',
    laneLabel: 'High-touch',
    selectorSummary: 'Best when you will actually use the credits and lounge access.',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png',
    artScale: 1.03,
    artFit: 'contain',
    selectorArtScale: 1.01,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center'
  },
  'chase-sapphire-reserve': {
    accentRgb: '90 224 255',
    accentClassName: 'text-[#5ae0ff]',
    accentBarClassName: 'bg-[#5ae0ff]',
    accentGlowClassName: 'bg-[#5ae0ff]/30',
    selectorWidthClassName: 'max-w-[17rem]',
    laneLabel: 'Travel-first',
    selectorSummary: 'Best when your points mostly turn into premium trips.',
    artUrl:
      'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/sapphire_reserve_card_Halo.png',
    artScale: 1.08,
    artFit: 'contain',
    selectorArtScale: 1.17,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center 53%'
  },
  'capital-one-venture-x': {
    accentRgb: '255 75 58',
    accentClassName: 'text-[#ff4b3a]',
    accentBarClassName: 'bg-[#ff4b3a]',
    accentGlowClassName: 'bg-[#ff4b3a]/32',
    selectorWidthClassName: 'max-w-[17.35rem]',
    laneLabel: 'Low-lift',
    selectorSummary: 'Best when you want premium perks without much upkeep.',
    artUrl: 'https://ecm.capitalone.com/WCM/card/products/venture-x-card-art.png',
    artScale: 1.04,
    artFit: 'contain',
    selectorArtScale: 1.07,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center'
  },
  'capital-one-venture': {
    accentRgb: '255 75 58',
    accentClassName: 'text-[#ff4b3a]',
    accentBarClassName: 'bg-[#ff4b3a]',
    accentGlowClassName: 'bg-[#ff4b3a]/32',
    selectorWidthClassName: 'max-w-[17.2rem]',
    laneLabel: 'Simple miles',
    selectorSummary: 'Best when you want easy 2x travel miles and lighter fee drag than Venture X.',
    artUrl: 'https://ecm.capitalone.com/WCM/card/products/venture-card-art.png',
    artScale: 1.04,
    artFit: 'contain',
    selectorArtScale: 1.06,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center'
  },
  'amex-gold': {
    accentRgb: '255 234 0',
    highlightRgb: '255 244 166',
    accentClassName: 'text-[#ffea00]',
    accentBarClassName: 'bg-[#ffea00]',
    accentGlowClassName: 'bg-[#ffea00]/36',
    selectorWidthClassName: 'max-w-[17.15rem]',
    laneLabel: 'Everyday points',
    selectorSummary: 'Best when dining, groceries, and monthly credits all have a real place in your life.',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/gold-card.png',
    artScale: 1.02,
    artFit: 'contain',
    artEffectClassName: 'brightness-[1.12] saturate-[1.36] contrast-[1.04]',
    selectorArtScale: 1.02,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center',
    selectorArtEffectClassName: 'brightness-[1.12] saturate-[1.36] contrast-[1.04]'
  },
  'amex-green': {
    accentRgb: '195 235 205',
    highlightRgb: '237 250 241',
    accentClassName: 'text-[#cdf1d5]',
    accentBarClassName: 'bg-[#cdf1d5]',
    accentGlowClassName: 'bg-[#d5f5dc]/38',
    selectorWidthClassName: 'max-w-[17.1rem]',
    laneLabel: 'Travel + transit',
    selectorSummary: 'Best when broad travel and transit spend matter more than lounges or monthly coupon-book credits.',
    artUrl:
      'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/green-card.png',
    artScale: 1.02,
    artFit: 'contain',
    artEffectClassName: 'brightness-[1.08] saturate-[1.12] contrast-[1.03]',
    selectorArtScale: 1.02,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center',
    selectorArtEffectClassName: 'brightness-[1.08] saturate-[1.12] contrast-[1.03]'
  },
  'chase-sapphire-preferred': {
    accentRgb: '115 157 255',
    accentClassName: 'text-[#739dff]',
    accentBarClassName: 'bg-[#739dff]',
    accentGlowClassName: 'bg-[#739dff]/30',
    selectorWidthClassName: 'max-w-[17rem]',
    laneLabel: 'Balanced travel',
    selectorSummary: 'Best when you want solid transfer value and lighter fee drag than the flagship cards.',
    artUrl:
      'https://images.ctfassets.net/8qmz0ef3xzub/7iFzyweepMTrfGn2VrDdL5/6adcc35d50cef1e3087ced153d3b7bee/sapphire_preferred_card.png',
    artScale: 1.07,
    artFit: 'contain',
    selectorArtScale: 1.08,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center'
  },
  'citi-strata-elite': {
    accentRgb: '102 157 255',
    highlightRgb: '186 217 255',
    accentClassName: 'text-[#7ab4ff]',
    accentBarClassName: 'bg-[#7ab4ff]',
    accentGlowClassName: 'bg-[#7ab4ff]/30',
    selectorWidthClassName: 'max-w-[17.1rem]',
    laneLabel: 'Citi premium',
    selectorSummary: 'Best when Citi Travel, lounge access, and richer annual credits are realistic parts of the plan.',
    artUrl:
      'https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-strata-elite-credit-card/citi-strata-elite-credit-card_306x192.webp',
    artScale: 1.06,
    artFit: 'contain',
    selectorArtScale: 1.06,
    selectorArtFit: 'contain',
    selectorArtPosition: 'center'
  }
};

const selectorGroups: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  cardIds: PremiumCardId[];
}> = [
  {
    id: 'premium',
    label: 'Flagship premium cards',
    description: 'Higher annual fees, bigger perk stacks, and more lounge or portal-driven upside.',
    cardIds: ['amex-platinum', 'chase-sapphire-reserve', 'capital-one-venture-x', 'citi-strata-elite']
  },
  {
    id: 'core-travel',
    label: 'Lower-fee travel rewards cards',
    description: 'Stronger everyday earning and lighter fee drag, without pretending they are the same product tier.',
    cardIds: ['amex-gold', 'amex-green', 'chase-sapphire-preferred', 'capital-one-venture']
  }
];

type GlyphName =
  | 'star'
  | 'shield'
  | 'orbit'
  | 'gate'
  | 'route'
  | 'stack'
  | 'score'
  | 'flight'
  | 'stay'
  | 'wave'
  | 'compass'
  | 'fork'
  | 'road'
  | 'wallet'
  | 'chevron';

function Glyph({
  name,
  className = 'h-4 w-4'
}: {
  name: GlyphName;
  className?: string;
}) {
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M12 3l2.4 5 5.6.7-4.1 3.9 1 5.4L12 15.7 7.1 18l1-5.4L4 8.7 9.6 8 12 3z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M12 3l7 3v5c0 4.7-2.8 7.9-7 10-4.2-2.1-7-5.3-7-10V6l7-3z" />
          <path {...base} d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'orbit':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle {...base} cx="12" cy="12" r="2.4" />
          <path {...base} d="M4 12c2.2-3.9 13.8-3.9 16 0-2.2 3.9-13.8 3.9-16 0z" />
          <path {...base} d="M9 4c3.9 2.2 3.9 13.8 0 16-3.9-2.2-3.9-13.8 0-16z" />
        </svg>
      );
    case 'gate':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M4 18V6h16v12" />
          <path {...base} d="M8 18V9" />
          <path {...base} d="M12 18V9" />
          <path {...base} d="M16 18V9" />
        </svg>
      );
    case 'route':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle {...base} cx="6" cy="18" r="2" />
          <circle {...base} cx="18" cy="6" r="2" />
          <path {...base} d="M8 18c5 0 2-7 8-10" />
        </svg>
      );
    case 'stack':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M12 4l8 4-8 4-8-4 8-4z" />
          <path {...base} d="M4 12l8 4 8-4" />
          <path {...base} d="M4 16l8 4 8-4" />
        </svg>
      );
    case 'score':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M5 19V9" />
          <path {...base} d="M12 19V5" />
          <path {...base} d="M19 19v-7" />
        </svg>
      );
    case 'flight':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M3 14l18-8-6 6 3 4-2 1-4-3-4 4-1-2 3-4-7 2z" />
        </svg>
      );
    case 'stay':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M5 20V7l7-3 7 3v13" />
          <path {...base} d="M9 11h1" />
          <path {...base} d="M14 11h1" />
          <path {...base} d="M9 15h1" />
          <path {...base} d="M14 15h1" />
        </svg>
      );
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M3 15c2.2 0 2.8-2 5-2s2.8 2 5 2 2.8-2 5-2 2.8 2 3 2" />
          <path {...base} d="M3 11c2.2 0 2.8-2 5-2s2.8 2 5 2 2.8-2 5-2 2.8 2 3 2" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle {...base} cx="12" cy="12" r="8" />
          <path {...base} d="M15.5 8.5l-2.5 7-7 2.5 2.5-7 7-2.5z" />
        </svg>
      );
    case 'fork':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M7 4v6" />
          <path {...base} d="M10 4v6" />
          <path {...base} d="M8.5 10v10" />
          <path {...base} d="M16 4v10" />
          <path {...base} d="M16 14c1.7 0 3-1.3 3-3V4" />
        </svg>
      );
    case 'road':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M8 20l2-16" />
          <path {...base} d="M16 20L14 4" />
          <path {...base} d="M11.5 8h1" />
          <path {...base} d="M11 12h2" />
          <path {...base} d="M10.5 16h3" />
        </svg>
      );
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M6 9l6 6 6-6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...base} d="M4 7h16v10H4z" />
          <path {...base} d="M4 11h16" />
        </svg>
      );
  }
}

function getSpendGlyph(categoryId: string) {
  if (categoryId.includes('flight')) return 'flight';
  if (categoryId.includes('hotel')) return 'stay';
  if (categoryId.includes('cruise')) return 'wave';
  if (categoryId.includes('car')) return 'road';
  if (categoryId.includes('dining')) return 'fork';
  if (categoryId.includes('restaurant')) return 'fork';
  if (categoryId.includes('transit')) return 'route';
  if (categoryId.includes('grocery')) return 'stack';
  if (categoryId.includes('supermarket')) return 'stack';
  if (categoryId.includes('gas')) return 'road';
  if (categoryId.includes('charging')) return 'road';
  if (categoryId.includes('entertainment')) return 'star';
  if (categoryId.includes('streaming')) return 'star';
  if (categoryId.includes('travel')) return 'compass';
  return 'wallet';
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPoints(value: number) {
  return numberFormatter.format(value);
}

function sanitizeCurrencyInput(raw: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function handleCurrencyFieldChange(
  event: ChangeEvent<HTMLInputElement>,
  onChange: (next: number) => void,
  onExplicitChange?: (next: boolean) => void
) {
  const rawValue = event.target.value;
  const nextValue = sanitizeCurrencyInput(rawValue);
  const hasExplicitInput = rawValue.trim() !== '';
  const normalizedValue = hasExplicitInput ? String(nextValue) : '';

  if (event.target.value !== normalizedValue) {
    event.target.value = normalizedValue;
  }

  onExplicitChange?.(hasExplicitInput);
  onChange(nextValue);
}

function displayNumericInputValue(value: number, isExplicitlySet = false) {
  return value === 0 && !isExplicitlySet ? '' : value;
}

function buildFieldInteractionKey(section: string, id: string) {
  return `${section}:${id}`;
}

const numericPlaceholderClassName = 'placeholder:text-text-primary/70 focus:placeholder:text-transparent';
const activeRowSurfaceClassName =
  'border-[rgb(var(--card-accent-rgb)/0.46)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.1)_44%,rgb(var(--card-accent-rgb)_/_0.08)),linear-gradient(90deg,rgb(var(--card-accent-rgb)_/_0.26),rgb(var(--card-accent-rgb)_/_0.19)_34%,rgb(var(--card-accent-rgb)_/_0.13)_72%,rgb(var(--card-accent-rgb)_/_0.09))] shadow-[0_18px_42px_rgba(0,0,0,0.2),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.24)]';
const activeInsetSurfaceClassName =
  'border-[rgb(var(--card-accent-rgb)/0.46)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.16),rgb(var(--card-accent-rgb)_/_0.24)_44%,rgb(var(--card-accent-rgb)_/_0.15))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.28)]';
const activeIconSurfaceClassName =
  'border-[rgb(var(--card-accent-rgb)/0.48)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.18),rgb(var(--card-accent-rgb)_/_0.24)_42%,rgb(var(--card-accent-rgb)_/_0.14))] shadow-[0_8px_20px_rgba(0,0,0,0.12),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.3)]';
const activeBadgeSurfaceClassName =
  'border-[rgb(var(--card-accent-rgb)/0.46)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.16),rgb(var(--card-accent-rgb)_/_0.22))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.22)]';

function CardSwitcherOption({
  profile,
  selected,
  onSelect
}: {
  profile: PremiumCardProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  const visual = cardVisuals[profile.id];

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-[1.05rem] border px-3 py-3 text-left transition focus-visible:outline-none ${
        selected
          ? 'border-[rgb(var(--card-accent-rgb)/0.52)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.14),rgb(var(--card-accent-rgb)_/_0.2))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.24)]'
          : 'border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.055]'
      }`}
    >
      <div className="relative flex h-16 w-[5.8rem] shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] bg-black/10">
        <div
          className={`absolute inset-x-3 bottom-2 h-7 rounded-full opacity-70 blur-[20px] ${visual.accentGlowClassName}`}
        />
        <EntityImage
          src={visual.artUrl}
          alt={profile.name}
          label={profile.shortName}
          className="relative aspect-[1.62/1] w-full max-w-[5.35rem] overflow-visible rounded-none border-0 bg-transparent"
          imgClassName={`bg-transparent p-0 drop-shadow-[0_12px_22px_rgba(0,0,0,0.36)] ${visual.selectorArtEffectClassName ?? ''}`}
          fallbackClassName="bg-black/10"
          fit={visual.selectorArtFit ?? visual.artFit ?? 'contain'}
          position={visual.selectorArtPosition ?? visual.artPosition}
          scale={visual.selectorArtScale ?? visual.artScale ?? 1}
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[15px] font-semibold leading-5 text-text-primary">
            {profile.shortName}
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-text-secondary">
            {formatCurrency(profile.annualFee)}
          </span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-3">
          <span className={`truncate text-[10px] font-semibold uppercase tracking-[0.18em] ${selected ? visual.accentClassName : 'text-text-muted'}`}>
            {visual.laneLabel}
          </span>
          {selected ? (
            <span className={`flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${visual.accentClassName}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${visual.accentBarClassName}`} />
              Active
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function CardSwitcher({
  selectedCardId,
  onSelect
}: {
  selectedCardId: PremiumCardId;
  onSelect: (cardId: PremiumCardId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedProfile = premiumCardProfileById[selectedCardId];
  const selectedVisual = cardVisuals[selectedCardId];

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, isOpen]);

  function handleSelect(cardId: PremiumCardId) {
    onSelect(cardId);
    close();
  }

  return (
    <div
      ref={containerRef}
      className="relative z-20 overflow-visible rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.96),rgba(9,13,22,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-[1.9rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
      <div className={`pointer-events-none absolute -right-6 top-2 h-20 w-20 rounded-full opacity-80 blur-[44px] ${selectedVisual.accentGlowClassName}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">Selected Card</p>
          <p className="mt-2 truncate text-[1.1rem] font-semibold leading-tight text-text-primary">
            {selectedProfile.shortName}
          </p>
        </div>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Switch selected card, currently ${selectedProfile.shortName}`}
          onClick={() => setIsOpen((current) => !current)}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-[rgb(var(--card-accent-rgb)/0.42)] bg-[rgb(var(--card-accent-rgb)/0.12)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--card-accent-rgb))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.16)] transition hover:border-[rgb(var(--card-accent-rgb)/0.62)] hover:bg-[rgb(var(--card-accent-rgb)/0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--card-accent-rgb)/0.55)]"
        >
          <span>Switch Card</span>
          <span className={`transition ${isOpen ? 'rotate-180' : ''}`}>
            <Glyph name="chevron" className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label={`Open card selector from card art, currently ${selectedProfile.shortName}`}
        onClick={() => setIsOpen((current) => !current)}
        className="group relative mt-4 block w-full rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 py-5 transition hover:border-[rgb(var(--card-accent-rgb)/0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--card-accent-rgb)/0.55)]"
      >
        <div className="pointer-events-none absolute inset-x-8 bottom-7 h-14 rounded-full bg-black/30 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
        <div className="relative flex items-center justify-center">
          <div className={`pointer-events-none absolute inset-x-10 bottom-4 h-12 rounded-full opacity-80 blur-[32px] ${selectedVisual.accentGlowClassName}`} />
          <EntityImage
            src={selectedVisual.artUrl}
            alt={selectedProfile.name}
            label={selectedProfile.shortName}
            className="relative aspect-[1.62/1] w-full max-w-[18rem] overflow-visible rounded-none border-0 bg-transparent"
            imgClassName={`bg-transparent p-0 drop-shadow-[0_26px_44px_rgba(0,0,0,0.44)] transition duration-300 group-hover:-translate-y-1 ${selectedVisual.artEffectClassName ?? ''}`}
            fallbackClassName="bg-black/10"
            fit={selectedVisual.artFit ?? 'contain'}
            position={selectedVisual.artPosition}
            scale={selectedVisual.artScale ?? 1}
          />
        </div>
      </button>
      <p className="relative mt-3 text-sm leading-6 text-text-secondary">{selectedVisual.selectorSummary}</p>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Choose a card"
          className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 max-h-[min(34rem,calc(100vh-8rem))] overflow-y-auto rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.99),rgba(8,12,20,0.995))] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.44)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
          <div className="relative space-y-4">
            {selectorGroups.map((group) => (
              <div key={group.id}>
                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                  {group.label}
                </p>
                <div className="mt-2 space-y-2">
                  {group.cardIds.map((cardId) => {
                    const profile = premiumCardProfileById[cardId];

                    return (
                      <CardSwitcherOption
                        key={profile.id}
                        profile={profile}
                        selected={profile.id === selectedCardId}
                        onSelect={() => handleSelect(profile.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionFrame({
  eyebrow,
  title,
  description,
  icon,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: GlyphName;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,27,0.98),rgba(8,12,20,0.98))] px-5 py-6 shadow-[0_22px_80px_rgba(0,0,0,0.26)] md:px-6 md:py-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
      <div className="pointer-events-none absolute -right-8 top-0 h-28 w-36 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.16),transparent_70%)] blur-[52px]" />
      <div className="mx-auto max-w-[56rem]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">{eyebrow}</p>
            <h2 className="mt-3 font-heading text-[1.9rem] leading-[1.02] tracking-[-0.02em] text-text-primary">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] border border-[rgb(var(--card-accent-rgb)/0.52)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.14),rgb(var(--card-accent-rgb)_/_0.26)_40%,rgb(var(--card-accent-rgb)_/_0.12))] text-[rgb(var(--card-accent-rgb))] shadow-[0_10px_24px_rgba(0,0,0,0.16),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.28)]">
            <Glyph name={icon} className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function BinaryChoice({
  label,
  description,
  value,
  positiveLabel,
  negativeLabel,
  onChange
}: {
  label: string;
  description: string;
  value: boolean;
  positiveLabel: string;
  negativeLabel: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[34rem]">
          <p className="text-[15px] font-semibold leading-6 text-text-primary">{label}</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-[1.15rem] border border-white/10 bg-[#0d1421] p-1 lg:min-w-[24rem]">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`rounded-[0.95rem] px-4 py-3 text-sm font-semibold transition ${
              value
                ? 'border border-[rgb(var(--card-accent-rgb)/0.74)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.18),rgb(var(--card-accent-rgb)_/_0.34)_38%,rgb(var(--card-accent-rgb)_/_0.14))] text-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.36)]'
                : 'border border-transparent bg-white/[0.04] text-text-secondary hover:bg-white/[0.07] hover:text-text-primary'
            }`}
          >
            {positiveLabel}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`rounded-[0.95rem] px-4 py-3 text-sm font-semibold transition ${
              !value
                ? 'border border-brand-coral/45 bg-brand-coral/12 text-text-primary shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                : 'border border-transparent bg-white/[0.04] text-text-secondary hover:bg-white/[0.07] hover:text-text-primary'
            }`}
          >
            {negativeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CurrencyInput({
  label,
  description,
  note,
  singleLineDisplay,
  compactSupportingText = false,
  value,
  isExplicitlySet = false,
  onChange,
  onExplicitChange,
  step = 10,
  centerText = false
}: {
  label: string;
  description?: string;
  note?: string;
  singleLineDisplay?: string;
  compactSupportingText?: boolean;
  value: number;
  isExplicitlySet?: boolean;
  onChange: (next: number) => void;
  onExplicitChange?: (next: boolean) => void;
  step?: number;
  centerText?: boolean;
}) {
  const hasValue = value > 0 || isExplicitlySet;
  const hasSingleLineDisplay = Boolean(singleLineDisplay);
  const shouldCenterText = centerText;
  const supportingText = [description, note].filter(Boolean).join(' · ');

  return (
    <label
      className={`relative block overflow-hidden rounded-[1.3rem] border px-4 py-3 transition ${
        hasValue
          ? activeRowSurfaceClassName
          : 'border-white/8 bg-[linear-gradient(180deg,rgba(13,19,31,0.96),rgba(9,13,22,0.98))]'
      }`}
    >
      {hasValue ? (
        <>
          <div className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[rgb(var(--card-accent-rgb))]" />
          <div className="pointer-events-none absolute -left-5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.18),transparent_70%)] blur-xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--card-highlight-rgb)_/_0.72),transparent)]" />
        </>
      ) : null}
      <div
        className={`relative flex flex-col gap-3 sm:flex-row sm:justify-between ${shouldCenterText ? 'sm:items-center' : 'sm:items-start'}`}
      >
        <div className={`min-w-0 sm:flex-1 ${shouldCenterText ? 'sm:flex sm:min-h-[2.75rem] sm:items-center' : ''}`}>
          <div className={`flex gap-2 ${shouldCenterText ? 'items-center justify-center text-center' : 'items-start'}`}>
            <p
              className={`min-w-0 flex-1 text-[15px] font-semibold leading-5 ${hasValue ? 'text-white' : 'text-text-primary'} ${
                hasSingleLineDisplay ? `whitespace-normal break-words ${shouldCenterText ? 'text-center' : ''}` : ''
              }`}
            >
              {singleLineDisplay ?? label}
            </p>
          </div>
          {!singleLineDisplay && supportingText ? (
            compactSupportingText ? (
              <p
                title={supportingText}
                className={`mt-1 text-[12px] leading-5 ${
                  hasValue ? 'text-text-secondary' : 'text-text-muted'
                } truncate whitespace-nowrap`}
              >
                {supportingText}
              </p>
            ) : (
              <div className="mt-1 space-y-1">
                {description ? (
                  <p className={`text-[13px] leading-5 ${hasValue ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {description}
                  </p>
                ) : null}
                {note ? (
                  <p className={`text-[13px] leading-5 ${hasValue ? 'text-text-secondary' : 'text-text-muted'}`}>{note}</p>
                ) : null}
              </div>
            )
          ) : null}
        </div>
        <div
          className={`flex w-full items-center rounded-[1rem] border px-3 sm:w-32 sm:shrink-0 ${
            hasValue
              ? activeInsetSurfaceClassName
              : 'border-white/8 bg-[#0f1726]'
          }`}
        >
          <span className={`text-sm ${hasValue ? 'text-white/80' : 'text-text-muted'}`}>$</span>
          <input
            type="number"
            min={0}
            step={step}
            value={displayNumericInputValue(value, isExplicitlySet)}
            placeholder="0"
            onChange={(event) => handleCurrencyFieldChange(event, onChange, onExplicitChange)}
            className={`w-full bg-transparent px-2 py-1.5 text-right text-[15px] font-semibold text-text-primary outline-none ${numericPlaceholderClassName}`}
          />
        </div>
      </div>
    </label>
  );
}

function SpendCategoryCard({
  categoryId,
  label,
  note,
  multiplier,
  value,
  isExplicitlySet = false,
  pointsEarned,
  onChange
  ,
  onExplicitChange
}: {
  categoryId: string;
  label: string;
  note?: string;
  multiplier: number;
  value: number;
  isExplicitlySet?: boolean;
  pointsEarned: number;
  onChange: (next: number) => void;
  onExplicitChange?: (next: boolean) => void;
}) {
  const glyph = getSpendGlyph(categoryId);
  const hasValue = value > 0 || isExplicitlySet;

  return (
    <label
      className={`relative block overflow-hidden rounded-[1.3rem] border px-4 py-3.5 transition ${
        hasValue
          ? activeRowSurfaceClassName
          : 'border-white/8 bg-[linear-gradient(180deg,rgba(13,19,31,0.96),rgba(9,13,22,0.98))]'
      }`}
    >
      {hasValue ? (
        <>
          <div className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[rgb(var(--card-accent-rgb))]" />
          <div className="pointer-events-none absolute -left-5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.18),transparent_70%)] blur-xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--card-highlight-rgb)_/_0.72),transparent)]" />
        </>
      ) : null}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-[rgb(var(--card-accent-rgb))] ${
                hasValue
                  ? activeIconSurfaceClassName
                  : 'border-white/8 bg-[#0f1726]'
              }`}
            >
              <Glyph name={glyph} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`truncate text-[15px] font-semibold leading-5 ${hasValue ? 'text-white' : 'text-text-primary'}`}>{label}</p>
              </div>
              <p className={`mt-0.5 text-[12px] leading-5 ${hasValue ? 'text-text-secondary' : 'text-text-muted'}`}>{note ?? 'Spend lane'}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 pl-[3.25rem]">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                hasValue
                  ? `${activeBadgeSurfaceClassName} text-white`
                  : 'border-[rgb(var(--card-accent-rgb)/0.18)] bg-[rgb(var(--card-accent-rgb)/0.1)] text-[rgb(var(--card-accent-rgb))]'
              }`}
            >
              {multiplier}x earn
            </span>
          </div>
        </div>

        <div className="w-full sm:w-40 sm:shrink-0">
          <div
            className={`flex items-center rounded-[1rem] border px-3 ${
              hasValue
                ? activeInsetSurfaceClassName
                : 'border-white/8 bg-[#0f1726]'
            }`}
          >
            <span className={`text-sm ${hasValue ? 'text-white/80' : 'text-text-muted'}`}>$</span>
            <input
            type="number"
            min={0}
            step={10}
            value={displayNumericInputValue(value, isExplicitlySet)}
            placeholder="0"
            onChange={(event) => handleCurrencyFieldChange(event, onChange, onExplicitChange)}
            className={`w-full bg-transparent px-2 py-2 text-right text-[15px] font-semibold text-text-primary outline-none ${numericPlaceholderClassName}`}
          />
        </div>
          <p className={`mt-2 text-right text-[11px] uppercase tracking-[0.16em] ${hasValue ? 'text-[rgb(var(--card-accent-rgb))]' : 'text-text-muted'}`}>
            {formatPoints(pointsEarned)} pts
          </p>
        </div>
      </div>
    </label>
  );
}

export function PremiumCardCalculator() {
  const [selectedCardId, setSelectedCardId] = useState<PremiumCardId>('amex-platinum');
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [scenarios, setScenarios] = useState<Record<PremiumCardId, PremiumCardScenario>>(() =>
    premiumCardProfiles.reduce(
      (accumulator, profile) => {
        accumulator[profile.id] = buildInitialPremiumCardScenario(profile);
        return accumulator;
      },
      {} as Record<PremiumCardId, PremiumCardScenario>
    )
  );
  const [fieldInteractions, setFieldInteractions] = useState<Record<PremiumCardId, PremiumCardFieldInteractions>>(
    () =>
      premiumCardProfiles.reduce(
        (accumulator, profile) => {
          accumulator[profile.id] = {};
          return accumulator;
        },
        {} as Record<PremiumCardId, PremiumCardFieldInteractions>
      )
  );

  const selectedProfile = premiumCardProfileById[selectedCardId];
  const selectedScenario = scenarios[selectedCardId];
  const selectedFieldInteractions = fieldInteractions[selectedCardId] ?? {};
  const selectedResult = calculatePremiumCardScenario(selectedProfile, selectedScenario);
  const selectedVisual = cardVisuals[selectedCardId];

  function updateSelectedScenario(updater: (current: PremiumCardScenario) => PremiumCardScenario) {
    setScenarios((current) => ({
      ...current,
      [selectedCardId]: updater(current[selectedCardId])
    }));
  }

  function updateSelectedFieldInteraction(fieldKey: string, isExplicitlySet: boolean) {
    setFieldInteractions((current) => ({
      ...current,
      [selectedCardId]: {
        ...current[selectedCardId],
        [fieldKey]: isExplicitlySet
      }
    }));
  }

  const offerPointsIsExplicitlySet = Boolean(selectedFieldInteractions['offer-points']);
  const annualFeeIsExplicitlySet = Boolean(selectedFieldInteractions['annual-fee']);
  const offerPointsIsActive = selectedScenario.offerPoints > 0 || offerPointsIsExplicitlySet;
  const annualFeeIsActive = selectedScenario.annualFee > 0 || annualFeeIsExplicitlySet;
  const offerPresetGridClassName =
    selectedProfile.welcomeOffer.offerPresets.length === 1
      ? 'sm:grid-cols-1'
      : selectedProfile.welcomeOffer.offerPresets.length === 2
      ? 'sm:grid-cols-2'
      : selectedProfile.welcomeOffer.offerPresets.length === 4
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-3';
  const yearOneIsPositive = selectedResult.expectedValueYear1 >= 0;
  const yearOneVerdictLabel =
    selectedResult.expectedValueYear1 >= 250
      ? 'Strong fit'
      : selectedResult.expectedValueYear1 >= 0
        ? 'Borderline fit'
        : 'Does not clear the fee';
  const yearOneVerdictDetail =
    selectedResult.expectedValueYear1 >= 250
      ? 'This setup clears the fee with enough margin to feel real.'
      : selectedResult.expectedValueYear1 >= 0
        ? 'This run works on paper, but the margin is still pretty thin.'
        : 'This setup does not justify the first-year cost of carrying the card.';
  const welcomeOfferIsIncluded = selectedResult.welcomeOfferPoints > 0;
  const welcomeOfferValue = Math.round(
    (selectedResult.welcomeOfferPoints * selectedResult.centsPerPoint) / 100
  );
  const yearOneBonusExplanation = welcomeOfferIsIncluded
    ? `This first-year number includes the signup bonus: ${formatPoints(
        selectedResult.welcomeOfferPoints
      )} ${selectedProfile.offerCurrencyShortLabel} worth about ${formatCurrency(
        welcomeOfferValue
      )} at your chosen redemption value.`
    : selectedScenario.eligibleForBonus
      ? 'This first-year number does not include a signup bonus because this run assumes you will not hit the required spend.'
      : 'This first-year number does not include a signup bonus because this run assumes you are not eligible for the offer.';
  const yearTwoIsPositive = selectedResult.expectedValueYear2 >= 0;
  const yearTwoSummaryDetail = yearTwoIsPositive
    ? selectedProfile.annualPointsBonus
      ? 'Where the card settles in renewal years once the intro offer is gone, including its built-in anniversary points boost.'
      : 'Where the card settles in renewal years once the intro offer is gone.'
    : selectedProfile.annualPointsBonus
      ? 'If nothing changes, this is the annual drag after the welcome offer disappears, even after the built-in anniversary points boost.'
      : 'If nothing changes, this is the annual drag after the welcome offer disappears.';
  const accentStyle = {
    '--card-accent-rgb': selectedVisual.accentRgb,
    '--card-highlight-rgb': selectedVisual.highlightRgb ?? selectedVisual.accentRgb
  } as CSSProperties;
  const pointsAdvisorProgramId = getPointsAdvisorProgramFromCardSlug(selectedProfile.slug);
  const pointsAdvisorHref = pointsAdvisorProgramId
    ? buildPointsAdvisorHref({
        programId: pointsAdvisorProgramId,
        pointsBalance: selectedResult.totalPointsYear1
      })
    : null;

  return (
    <section className="relative mx-auto max-w-6xl space-y-6" style={accentStyle}>
      <div className="pointer-events-none absolute left-[-7rem] top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.08),transparent_70%)] blur-[56px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_72%)] blur-3xl" />

      <section className="relative rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.4rem]">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
          <div className="absolute -left-14 top-[-3rem] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.1),transparent_70%)] blur-[52px]" />
          <div className="absolute right-[-3rem] top-1 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.08),transparent_72%)] blur-[56px]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_24rem] lg:items-center">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${selectedVisual.accentClassName}`}>
              Premium Card Calculator
            </p>
            <h1 className="mt-4 font-heading text-[clamp(2.6rem,5.2vw,4.8rem)] leading-[0.94] tracking-[-0.04em] text-text-primary">
              Find the Card That Earns Its Fee
            </h1>
            <p className="mt-4 max-w-[38rem] text-[1.02rem] leading-7 text-text-secondary">
              Run the annual-fee math with your real spend, credits, perks, and point values.
            </p>

          </div>

          <CardSwitcher
            selectedCardId={selectedCardId}
            onSelect={(cardId) => {
              startTransition(() => setSelectedCardId(cardId));
            }}
          />
        </div>
      </section>

      <motion.section
        key={selectedCardId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,13,22,0.98),rgba(13,18,29,0.98))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.26)] md:p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
        <div className="pointer-events-none absolute left-[-2rem] top-20 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.08),transparent_70%)] blur-[46px]" />
        <div className="pointer-events-none absolute right-[-2.5rem] top-[-1.5rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.1),transparent_72%)] blur-[52px]" />
        <div className="mx-auto max-w-[56rem] space-y-6">
          <SectionFrame
            eyebrow="Gate Check"
            icon="gate"
            title="Decide what counts on day one"
            description=""
          >
            <div className="space-y-4">
              <BinaryChoice
                label="Should we include the intro bonus?"
                description={selectedProfile.eligibilityNote}
                value={selectedScenario.eligibleForBonus}
                positiveLabel="Count It"
                negativeLabel="Block It"
                onChange={(next) => {
                  updateSelectedScenario((current) => ({ ...current, eligibleForBonus: next }));
                }}
              />
              <BinaryChoice
                label={`Can you clear ${formatCurrency(selectedProfile.welcomeOffer.spendRequired)} in the first ${selectedProfile.welcomeOffer.spendWindowMonths} months?`}
                description="If not, we flip the model into the no-bonus version of the card."
                value={selectedScenario.canMeetSpend}
                positiveLabel="Yes, Likely"
                negativeLabel="No, Unlikely"
                onChange={(next) => {
                  updateSelectedScenario((current) => ({ ...current, canMeetSpend: next }));
                }}
              />
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[1.45rem] border border-white/12 bg-[linear-gradient(180deg,rgba(16,23,37,0.98),rgba(9,13,22,0.99))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className={`pointer-events-none absolute right-2 top-2 h-20 w-28 opacity-75 blur-[40px] ${selectedVisual.accentGlowClassName}`} />
              <div className="relative">
                <p className="text-sm font-semibold text-text-primary">Bonus on the table</p>

	                <div className={`mt-3 grid gap-2 ${offerPresetGridClassName}`}>
                  {selectedProfile.welcomeOffer.offerPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        updateSelectedScenario((current) => ({ ...current, offerPoints: preset }));
                      }}
                      className={`rounded-[1rem] border px-3.5 py-2.5 text-[13px] font-semibold transition ${
                      selectedScenario.offerPoints === preset
                          ? 'border-[rgb(var(--card-accent-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.18),rgb(var(--card-accent-rgb)_/_0.28)_34%,rgb(var(--card-accent-rgb)_/_0.12))] text-text-primary shadow-[0_10px_28px_rgba(0,0,0,0.16),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.34)]'
                          : 'border-white/16 bg-[linear-gradient(180deg,rgba(22,31,48,0.96),rgba(12,18,31,0.98))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/28 hover:bg-[linear-gradient(180deg,rgba(27,37,57,0.98),rgba(14,20,34,0.99))]'
                      }`}
                    >
                      {formatPoints(preset)} {selectedProfile.offerCurrencyShortLabel}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label
                    className={`rounded-[1.1rem] border px-3.5 py-3 transition ${
                      offerPointsIsActive
                        ? 'border-[rgb(var(--card-accent-rgb)/0.58)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.14),rgb(var(--card-accent-rgb)_/_0.24)_36%,rgb(var(--card-accent-rgb)_/_0.1))] shadow-[0_10px_28px_rgba(0,0,0,0.14),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.3)]'
                        : 'border-white/12 bg-[linear-gradient(180deg,rgba(18,25,40,0.96),rgba(10,15,25,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Offer size</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-text-muted">Bonus assumption</p>
                      </div>
                      <div className="flex min-w-0 items-end gap-2">
                        <span className="pb-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                          {selectedProfile.offerCurrencyShortLabel}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={displayNumericInputValue(selectedScenario.offerPoints, offerPointsIsExplicitlySet)}
                          placeholder="0"
                          onChange={(event) =>
                            handleCurrencyFieldChange(event, (nextValue) => {
                              updateSelectedScenario((current) => ({
                                ...current,
                                offerPoints: nextValue
                              }));
                            }, (isExplicitlySet) => {
                              updateSelectedFieldInteraction('offer-points', isExplicitlySet);
                            })
                          }
                          className={`min-w-0 bg-transparent text-right text-[1.45rem] font-semibold leading-none text-text-primary outline-none ${numericPlaceholderClassName}`}
                        />
                      </div>
                    </div>
                  </label>

                  <label
                    className={`rounded-[1.1rem] border px-3.5 py-3 transition ${
                      annualFeeIsActive
                        ? 'border-[rgb(var(--card-accent-rgb)/0.58)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.14),rgb(var(--card-accent-rgb)_/_0.24)_36%,rgb(var(--card-accent-rgb)_/_0.1))] shadow-[0_10px_28px_rgba(0,0,0,0.14),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.3)]'
                        : 'border-white/12 bg-[linear-gradient(180deg,rgba(18,25,40,0.96),rgba(10,15,25,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Fee drag</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-text-muted">
                          Published fee {formatCurrency(selectedProfile.annualFee)}
                        </p>
                      </div>
                      <div className="flex min-w-0 items-end gap-2">
                        <span className="pb-1 text-sm text-text-muted">$</span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={displayNumericInputValue(selectedScenario.annualFee, annualFeeIsExplicitlySet)}
                          placeholder="0"
                          onChange={(event) =>
                            handleCurrencyFieldChange(event, (nextValue) => {
                              updateSelectedScenario((current) => ({
                                ...current,
                                annualFee: nextValue
                              }));
                            }, (isExplicitlySet) => {
                              updateSelectedFieldInteraction('annual-fee', isExplicitlySet);
                            })
                          }
                          className={`min-w-0 bg-transparent text-right text-[1.45rem] font-semibold leading-none text-text-primary outline-none ${numericPlaceholderClassName}`}
                        />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[1.45rem] border border-white/12 bg-[linear-gradient(180deg,rgba(16,23,37,0.98),rgba(9,13,22,0.99))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
              <div className="pointer-events-none absolute left-[-0.5rem] bottom-[-2rem] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.08),transparent_70%)] blur-[40px]" />
              <div className="relative">
                <p className="text-sm font-semibold text-text-primary">Exit route for points</p>
                <p className="mt-1 max-w-[30rem] text-xs leading-5 text-text-muted">
                  Choose the redemption path that best matches how you would actually cash these points out.
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedProfile.redemptionOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        updateSelectedScenario((current) => ({
                          ...current,
                          selectedRedemptionId: option.id,
                          centsPerPoint: option.centsPerPoint
                        }));
                      }}
                      className={`rounded-[1rem] border px-3.5 py-2.5 text-left text-[13px] transition ${
                        selectedScenario.selectedRedemptionId === option.id
                          ? 'border-[rgb(var(--card-accent-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.18),rgb(var(--card-accent-rgb)_/_0.28)_34%,rgb(var(--card-accent-rgb)_/_0.12))] text-text-primary shadow-[0_10px_28px_rgba(0,0,0,0.16),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.34)]'
                          : 'border-white/16 bg-[linear-gradient(180deg,rgba(22,31,48,0.96),rgba(12,18,31,0.98))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/28 hover:bg-[linear-gradient(180deg,rgba(27,37,57,0.98),rgba(14,20,34,0.99))]'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted">{option.note}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionFrame>

          <SectionFrame
            eyebrow="Money Map"
            icon="route"
            title="Route the dollars this card would really touch"
            description="Feed the card only the spend it would actually win in your wallet. That keeps the model honest."
          >
            <div className="space-y-3">
              {selectedResult.spendBreakdown.map((category) => (
                <SpendCategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                  note={category.note}
                  multiplier={category.multiplier}
                  value={selectedScenario.spend[category.id] ?? 0}
                  isExplicitlySet={Boolean(
                    selectedFieldInteractions[buildFieldInteractionKey('spend', category.id)]
                  )}
                  pointsEarned={category.pointsEarned}
                  onChange={(next) => {
                    updateSelectedScenario((current) => ({
                      ...current,
                      spend: {
                        ...current.spend,
                        [category.id]: next
                      }
                    }));
                  }}
                  onExplicitChange={(isExplicitlySet) => {
                    updateSelectedFieldInteraction(
                      buildFieldInteractionKey('spend', category.id),
                      isExplicitlySet
                    );
                  }}
                />
              ))}
            </div>
          </SectionFrame>

          <SectionFrame
            eyebrow="Value Stack"
            icon="stack"
            title="Keep the perks you will actually cash in"
            description="This is where inflated premium-card math usually falls apart. Keep the value you believe you can really unlock."
          >
            <div className="mb-4 hidden sm:flex sm:justify-end">
              <span className="w-32 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Annual value
              </span>
            </div>

            <div>
              <h3 className="text-[1.05rem] font-semibold text-text-primary">Hard-value credits</h3>
              <div className="mt-3 space-y-2.5">
                {selectedProfile.credits.map((credit) => (
                  <CurrencyInput
                    key={credit.id}
                    label={credit.label}
                    description={credit.description}
                    note={credit.note}
                    singleLineDisplay={credit.singleLineDisplay}
                    value={selectedScenario.credits[credit.id] ?? 0}
                    isExplicitlySet={Boolean(
                      selectedFieldInteractions[buildFieldInteractionKey('credit', credit.id)]
                    )}
                    onChange={(next) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        credits: {
                          ...current.credits,
                          [credit.id]: next
                        }
                      }));
                    }}
                    onExplicitChange={(isExplicitlySet) => {
                      updateSelectedFieldInteraction(
                        buildFieldInteractionKey('credit', credit.id),
                        isExplicitlySet
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[1.05rem] font-semibold text-text-primary">Soft-value perks</h3>
              <div className="mt-3 space-y-2.5">
                {selectedProfile.benefits.map((benefit) => (
                  <CurrencyInput
                    key={benefit.id}
                    label={benefit.label}
                    description={benefit.description}
                    note={benefit.note}
                    compactSupportingText
                    value={selectedScenario.benefits[benefit.id] ?? 0}
                    isExplicitlySet={Boolean(
                      selectedFieldInteractions[buildFieldInteractionKey('benefit', benefit.id)]
                    )}
                    onChange={(next) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        benefits: {
                          ...current.benefits,
                          [benefit.id]: next
                        }
                      }));
                    }}
                    onExplicitChange={(isExplicitlySet) => {
                      updateSelectedFieldInteraction(
                        buildFieldInteractionKey('benefit', benefit.id),
                        isExplicitlySet
                      );
                    }}
                  />
                ))}
              </div>

            </div>
          </SectionFrame>

          <section className="relative overflow-hidden rounded-[1.95rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,25,0.98),rgba(18,24,36,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
            <div className="pointer-events-none absolute -right-4 top-2 h-28 w-32 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.12),transparent_72%)] blur-[48px]" />
            <div className="mx-auto max-w-[56rem]">
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="sm:justify-self-start">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-[rgb(var(--card-accent-rgb)/0.58)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.14),rgb(var(--card-accent-rgb)_/_0.24)_40%,rgb(var(--card-accent-rgb)_/_0.1))] text-[rgb(var(--card-accent-rgb))] shadow-[0_10px_24px_rgba(0,0,0,0.16),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.3)]">
                      <Glyph name="score" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">Scoreboard</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-self-center">
                  {pointsAdvisorHref ? (
                    <Link
                      href={pointsAdvisorHref}
                      className="inline-flex min-w-[13.75rem] items-center justify-center rounded-full border border-white/10 px-7 py-3 text-center text-base font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
                    >
                      Go To Points Calculator
                    </Link>
                  ) : null}
                  <Button
                    type="button"
                    variant={showEmailPanel ? 'ghost' : 'primary'}
                    className="min-w-[12.75rem] px-7 py-3 text-base"
                    onClick={() => {
                      setShowEmailPanel((current) => !current);
                    }}
                  >
                    {showEmailPanel ? 'Hide email form' : 'Email my results'}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    className="min-w-[13.75rem] px-7 py-3 text-base"
                    onClick={() => {
                      setScenarios((current) => ({
                        ...current,
                        [selectedCardId]: buildInitialPremiumCardScenario(selectedProfile)
                      }));
                      setFieldInteractions((current) => ({
                        ...current,
                        [selectedCardId]: {}
                      }));
                    }}
                    >
                    Reset {selectedProfile.shortName}
                  </Button>
                </div>
                <div className="hidden sm:block" />
              </div>

              {showEmailPanel ? (
                <PremiumCardEmailPanel
                  profile={selectedProfile}
                  scenario={selectedScenario}
                  result={selectedResult}
                />
              ) : null}

              <div
                className={`mt-6 rounded-[1.55rem] border p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${
                  yearOneIsPositive
                    ? 'border-[rgb(var(--card-accent-rgb)/0.44)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.18)_22%,rgba(18,25,40,0.96)_42%,rgba(10,14,24,0.99))] shadow-[0_20px_50px_rgba(0,0,0,0.2),inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.22)]'
                    : 'border-brand-coral/20 bg-[linear-gradient(180deg,rgba(255,122,89,0.14),rgba(18,25,40,0.96)_42%,rgba(10,14,24,0.99))]'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mx-auto w-full max-w-[11.5rem]">
                    <div className={`pointer-events-none absolute inset-x-4 bottom-4 h-12 rounded-full opacity-80 blur-[32px] ${selectedVisual.accentGlowClassName}`} />
                    <EntityImage
                      src={selectedVisual.artUrl}
                      alt={selectedProfile.name}
                      label={selectedProfile.shortName}
                      className="relative aspect-[1.62/1] w-full overflow-visible rounded-none border-0 bg-transparent"
                      imgClassName={`bg-transparent p-0 drop-shadow-[0_24px_40px_rgba(0,0,0,0.42)] ${selectedVisual.artEffectClassName ?? ''}`}
                      fallbackClassName="bg-black/10"
                      fit={selectedVisual.artFit ?? 'contain'}
                      scale={selectedVisual.artScale ?? 1}
                    />
                    <div className="mt-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Modeled card</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">{selectedProfile.shortName}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div
                    className={`rounded-[1.25rem] border px-4 py-4 ${
                      yearOneIsPositive
                        ? 'border-[rgb(var(--card-accent-rgb)/0.34)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.14),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.18)]'
                        : 'border-brand-coral/20 bg-[linear-gradient(180deg,rgba(255,122,89,0.12),rgba(255,255,255,0.03))]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-[30rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${yearOneIsPositive ? selectedVisual.accentClassName : 'text-brand-coral'}`}>
                            Year One Expected Value
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              yearOneIsPositive
                                ? `border-[rgb(var(--card-accent-rgb)/0.3)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.12))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.2)] ${selectedVisual.accentClassName}`
                                : 'border-brand-coral/25 bg-brand-coral/10 text-brand-coral'
                            }`}
                          >
                            {yearOneVerdictLabel}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              welcomeOfferIsIncluded
                                ? `border-[rgb(var(--card-accent-rgb)/0.3)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.12))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.2)] ${selectedVisual.accentClassName}`
                                : 'border-white/12 bg-white/[0.04] text-text-muted'
                            }`}
                          >
                            {welcomeOfferIsIncluded ? 'Signup bonus included' : 'Signup bonus excluded'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">{yearOneVerdictDetail}</p>
                        <p className="mt-2 text-xs leading-5 text-text-muted">{yearOneBonusExplanation}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">First Year</p>
                        <p className="mt-2 text-[2.35rem] font-semibold leading-none text-text-primary">
                          {formatCurrency(selectedResult.expectedValueYear1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-[1.25rem] border px-4 py-4 ${
                      yearTwoIsPositive
                        ? 'border-[rgb(var(--card-accent-rgb)/0.34)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.08),rgb(var(--card-accent-rgb)_/_0.12),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.18)]'
                        : 'border-brand-coral/20 bg-[linear-gradient(180deg,rgba(255,122,89,0.12),rgba(255,255,255,0.03))]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-[30rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${yearTwoIsPositive ? selectedVisual.accentClassName : 'text-brand-coral'}`}>
                            Year 2 And Beyond
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              yearTwoIsPositive
                                ? `border-[rgb(var(--card-accent-rgb)/0.3)] bg-[linear-gradient(180deg,rgb(var(--card-highlight-rgb)_/_0.12),rgb(var(--card-accent-rgb)_/_0.12))] shadow-[inset_0_1px_0_rgb(var(--card-highlight-rgb)_/_0.2)] ${selectedVisual.accentClassName}`
                                : 'border-brand-coral/25 bg-brand-coral/10 text-brand-coral'
                            }`}
                          >
                            {yearTwoIsPositive ? 'Annual keep value' : 'Annual drag'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">{yearTwoSummaryDetail}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Ongoing</p>
                        <p className="mt-2 text-[2.35rem] font-semibold leading-none text-text-primary">
                          {formatCurrency(selectedResult.expectedValueYear2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-4 py-4">
                <div className="flex flex-col gap-2 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-semibold text-text-primary">Value ledger</span>
                    <p className="mt-1 text-xs leading-5 text-text-muted">The features of the credit card providing continuing benefit.</p>
                  </div>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${selectedVisual.accentClassName}`}>The Stack read</span>
                </div>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
                    <span className="text-text-secondary">Usable credits</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(selectedResult.recurringCreditsValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
                    <span className="text-text-secondary">Soft perks kept</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(selectedResult.benefitsValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
                    <span className="text-text-secondary">Points banked from spend</span>
                    <span className="font-semibold text-text-primary">{formatPoints(selectedResult.spendPoints)}</span>
                  </div>
                  {selectedProfile.annualPointsBonus ? (
                    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
                      <span className="text-text-secondary">{selectedProfile.annualPointsBonus.label}</span>
                      <span className="font-semibold text-text-primary">{formatPoints(selectedResult.annualBonusPointsYear2)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-black/10 px-3.5 py-3 text-sm">
                    <span className="text-text-secondary">Fee drag</span>
                    <span className="font-semibold text-brand-coral">-{formatCurrency(selectedScenario.annualFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.section>
    </section>
  );
}
