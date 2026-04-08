'use client';

import { motion } from 'framer-motion';
import { startTransition, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { EntityImage } from '@/components/ui/entity-image';
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

const oneDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

const cardVisuals: Record<
  PremiumCardId,
  {
    accentRgb: string;
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
    selectorArtScale?: number;
    selectorArtFit?: 'contain' | 'cover';
    selectorArtPosition?: string;
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
  }
};

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
  | 'wallet';

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
  if (categoryId.includes('entertainment')) return 'star';
  if (categoryId.includes('travel')) return 'compass';
  return 'wallet';
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPoints(value: number) {
  return numberFormatter.format(value);
}

function formatCpp(value: number) {
  return `${oneDecimalFormatter.format(value)} CPP`;
}

function sanitizeCurrencyInput(raw: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function handleCurrencyFieldChange(event: ChangeEvent<HTMLInputElement>, onChange: (next: number) => void) {
  const nextValue = sanitizeCurrencyInput(event.target.value);
  const normalizedValue = String(nextValue);

  if (event.target.value !== normalizedValue) {
    event.target.value = normalizedValue;
  }

  onChange(nextValue);
}

function displayNumericInputValue(value: number) {
  return value === 0 ? '' : value;
}

const numericPlaceholderClassName = 'placeholder:text-text-primary/70 focus:placeholder:text-transparent';

function toMoneyValue(points: number, centsPerPoint: number) {
  return Math.round((points * centsPerPoint) / 100);
}

function SelectorCard({
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
      onClick={onSelect}
      className="group relative h-full w-full text-left transition focus-visible:outline-none"
    >
      <div
        className={`relative h-full overflow-hidden rounded-[1.7rem] border p-4 transition duration-300 ${
          selected
            ? 'border-[rgb(var(--card-accent-rgb)/0.46)] bg-[linear-gradient(180deg,rgba(22,28,43,0.98),rgba(12,16,26,0.88),rgb(var(--card-accent-rgb)/0.22))] shadow-[0_24px_80px_rgba(0,0,0,0.3)]'
            : 'border-white/10 bg-[linear-gradient(180deg,rgba(14,19,30,0.9),rgba(9,13,22,0.92))] hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(16,22,35,0.94),rgba(11,15,24,0.96))]'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
        <div className={`pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full blur-3xl ${visual.accentGlowClassName}`} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${selected ? visual.accentClassName : 'text-text-muted'}`}>
              {visual.laneLabel}
            </p>
            <p className="mt-2 text-[1.08rem] font-semibold leading-tight text-text-primary">{profile.shortName}</p>
          </div>
          {selected ? (
            <span className={`shrink-0 flex items-center gap-1.5 rounded-full border border-[rgb(var(--card-accent-rgb)/0.48)] bg-[rgb(var(--card-accent-rgb)/0.28)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${visual.accentClassName}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${visual.accentBarClassName}`} />
              Active
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Pick
            </span>
          )}
        </div>

        <div className="relative mx-auto mt-4 flex h-[10.8rem] items-center justify-center">
          <div
            className={`absolute inset-x-8 bottom-3 h-16 rounded-full blur-[44px] transition duration-300 ease-out ${visual.accentGlowClassName} ${
              selected
                ? 'scale-100 opacity-100'
                : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100'
            }`}
          />
          <div className="relative transition duration-300 ease-out will-change-transform group-hover:-translate-y-2 group-focus-visible:-translate-y-2">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem]">
              <div className="absolute inset-y-4 left-[-38%] w-[38%] rotate-[18deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.06),rgba(255,255,255,0.34),rgba(255,255,255,0.06),rgba(255,255,255,0)) opacity-0 blur-md transition-all duration-700 ease-out group-hover:left-[118%] group-hover:opacity-100 group-focus-visible:left-[118%] group-focus-visible:opacity-100" />
            </div>
            <EntityImage
              src={visual.artUrl}
              alt={profile.name}
              label={profile.shortName}
              className={`aspect-[1.62/1] w-full overflow-visible rounded-none border-0 bg-transparent ${visual.selectorWidthClassName}`}
              imgClassName={`bg-transparent p-0 transition duration-300 ${
                selected
                  ? 'drop-shadow-[0_28px_48px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_34px_58px_rgba(0,0,0,0.56)]'
                  : 'opacity-84 drop-shadow-[0_18px_32px_rgba(0,0,0,0.3)] group-hover:opacity-100 group-hover:drop-shadow-[0_30px_52px_rgba(0,0,0,0.46)]'
              }`}
              fallbackClassName="bg-black/10"
              fit={visual.selectorArtFit ?? visual.artFit ?? 'contain'}
              position={visual.selectorArtPosition ?? visual.artPosition}
              scale={visual.selectorArtScale ?? visual.artScale ?? 1}
            />
          </div>
        </div>

        <div className="relative mt-3">
          <p className="text-sm leading-6 text-text-secondary">{visual.selectorSummary}</p>
          <div className={`mt-4 h-[2px] rounded-full transition-all ${selected ? `w-16 ${visual.accentBarClassName}` : 'w-10 bg-white/10'}`} />
        </div>
      </div>
    </button>
  );
}

function MetricTile({
  label,
  value,
  hint,
  accent = false
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border px-4 py-4 ${
        accent
          ? 'border-[rgb(var(--card-accent-rgb)/0.58)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.38),rgb(var(--card-accent-rgb)/0.16))] shadow-[0_14px_36px_rgba(0,0,0,0.18)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]'
      }`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${accent ? 'text-[rgb(var(--card-accent-rgb))]' : 'text-text-muted'}`}>
        {label}
      </p>
      <p className="mt-3 text-[1.9rem] font-semibold leading-none text-text-primary">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-text-secondary">{hint}</p> : null}
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
      <div className="pointer-events-none absolute -right-10 top-0 h-36 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.24),transparent_72%)] blur-3xl" />
      <div className="mx-auto max-w-[56rem]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">{eyebrow}</p>
            <h2 className="mt-3 font-heading text-[1.9rem] leading-[1.02] tracking-[-0.02em] text-text-primary">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] border border-[rgb(var(--card-accent-rgb)/0.52)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.38),rgb(var(--card-accent-rgb)/0.16))] text-[rgb(var(--card-accent-rgb))] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
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
                ? 'border border-[rgb(var(--card-accent-rgb)/0.78)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.5),rgb(var(--card-accent-rgb)/0.2))] text-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.2)]'
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
  note,
  singleLineDisplay,
  value,
  onChange,
  step = 50,
  centerText = false
}: {
  label: string;
  note?: string;
  singleLineDisplay?: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  centerText?: boolean;
}) {
  const hasValue = value > 0;
  const shouldCenterText = centerText || Boolean(singleLineDisplay);

  return (
    <label
      className={`block rounded-[1.3rem] border px-4 py-3 transition ${
        hasValue
          ? 'border-[rgb(var(--card-accent-rgb)/0.22)] bg-[linear-gradient(180deg,rgba(15,22,34,0.98),rgb(var(--card-accent-rgb)/0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
          : 'border-white/8 bg-[linear-gradient(180deg,rgba(13,19,31,0.96),rgba(9,13,22,0.98))]'
      }`}
    >
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:justify-between ${shouldCenterText ? 'sm:items-center' : 'sm:items-start'}`}
      >
        <div className={`min-w-0 sm:flex-1 ${shouldCenterText ? 'sm:flex sm:min-h-[2.75rem] sm:items-center' : ''}`}>
          <div className={`flex gap-2 ${shouldCenterText ? 'items-center' : 'items-start'}`}>
            <p
              className={`min-w-0 flex-1 text-[15px] font-semibold leading-5 text-text-primary ${
                singleLineDisplay ? 'truncate whitespace-nowrap' : ''
              }`}
            >
              {singleLineDisplay ?? label}
            </p>
            {hasValue ? (
              <span className="rounded-full border border-[rgb(var(--card-accent-rgb)/0.22)] bg-[rgb(var(--card-accent-rgb)/0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--card-accent-rgb))]">
                Added
              </span>
            ) : null}
          </div>
          {!singleLineDisplay && note ? <p className="mt-0.5 text-[13px] leading-5 text-text-muted">{note}</p> : null}
        </div>
        <div
          className={`flex w-full items-center rounded-[1rem] border px-3 sm:w-32 sm:shrink-0 ${
            hasValue
              ? 'border-[rgb(var(--card-accent-rgb)/0.2)] bg-[rgb(var(--card-accent-rgb)/0.1)]'
              : 'border-white/8 bg-[#0f1726]'
          }`}
        >
          <span className="text-sm text-text-muted">$</span>
          <input
            type="number"
            min={0}
            step={step}
            value={displayNumericInputValue(value)}
            placeholder="0"
            onChange={(event) => handleCurrencyFieldChange(event, onChange)}
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
  pointsEarned,
  onChange
}: {
  categoryId: string;
  label: string;
  note?: string;
  multiplier: number;
  value: number;
  pointsEarned: number;
  onChange: (next: number) => void;
}) {
  const glyph = getSpendGlyph(categoryId);
  const hasValue = value > 0;

  return (
    <label
      className={`block rounded-[1.3rem] border px-4 py-3.5 transition ${
        hasValue
          ? 'border-[rgb(var(--card-accent-rgb)/0.22)] bg-[linear-gradient(180deg,rgba(15,22,34,0.98),rgb(var(--card-accent-rgb)/0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
          : 'border-white/8 bg-[linear-gradient(180deg,rgba(13,19,31,0.96),rgba(9,13,22,0.98))]'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-[rgb(var(--card-accent-rgb))] ${
                hasValue
                  ? 'border-[rgb(var(--card-accent-rgb)/0.22)] bg-[rgb(var(--card-accent-rgb)/0.12)]'
                  : 'border-white/8 bg-[#0f1726]'
              }`}
            >
              <Glyph name={glyph} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-semibold leading-5 text-text-primary">{label}</p>
                {hasValue ? (
                  <span className="rounded-full border border-[rgb(var(--card-accent-rgb)/0.22)] bg-[rgb(var(--card-accent-rgb)/0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--card-accent-rgb))]">
                    Added
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[12px] leading-5 text-text-muted">{note ?? 'Spend lane'}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 pl-[3.25rem]">
            <span className="rounded-full border border-[rgb(var(--card-accent-rgb)/0.18)] bg-[rgb(var(--card-accent-rgb)/0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--card-accent-rgb))]">
              {multiplier}x earn
            </span>
          </div>
        </div>

        <div className="w-full sm:w-40 sm:shrink-0">
          <div
            className={`flex items-center rounded-[1rem] border px-3 ${
              hasValue
                ? 'border-[rgb(var(--card-accent-rgb)/0.2)] bg-[rgb(var(--card-accent-rgb)/0.1)]'
                : 'border-white/8 bg-[#0f1726]'
            }`}
          >
            <span className="text-sm text-text-muted">$</span>
            <input
              type="number"
              min={0}
              step={100}
              value={displayNumericInputValue(value)}
              placeholder="0"
              onChange={(event) => handleCurrencyFieldChange(event, onChange)}
              className={`w-full bg-transparent px-2 py-2 text-right text-[15px] font-semibold text-text-primary outline-none ${numericPlaceholderClassName}`}
            />
          </div>
          <p className="mt-2 text-right text-[11px] uppercase tracking-[0.16em] text-text-muted">{formatPoints(pointsEarned)} pts</p>
        </div>
      </div>
    </label>
  );
}

export function PremiumCardCalculator() {
  const [selectedCardId, setSelectedCardId] = useState<PremiumCardId>('amex-platinum');
  const [scenarios, setScenarios] = useState<Record<PremiumCardId, PremiumCardScenario>>(() => ({
    'amex-platinum': buildInitialPremiumCardScenario(premiumCardProfileById['amex-platinum']),
    'chase-sapphire-reserve': buildInitialPremiumCardScenario(
      premiumCardProfileById['chase-sapphire-reserve']
    ),
    'capital-one-venture-x': buildInitialPremiumCardScenario(
      premiumCardProfileById['capital-one-venture-x']
    )
  }));

  const selectedProfile = premiumCardProfileById[selectedCardId];
  const selectedScenario = scenarios[selectedCardId];
  const selectedResult = calculatePremiumCardScenario(selectedProfile, selectedScenario);
  const selectedVisual = cardVisuals[selectedCardId];

  function updateSelectedScenario(updater: (current: PremiumCardScenario) => PremiumCardScenario) {
    setScenarios((current) => ({
      ...current,
      [selectedCardId]: updater(current[selectedCardId])
    }));
  }

  const selectedRedemptionLabel =
    selectedProfile.redemptionOptions.find((option) => option.id === selectedScenario.selectedRedemptionId)?.label ??
    'Custom';
  const welcomeOfferValue = toMoneyValue(selectedResult.welcomeOfferPoints, selectedResult.centsPerPoint);
  const spendValue = toMoneyValue(selectedResult.spendPoints, selectedResult.centsPerPoint);
  const offerPresetGridClassName =
    selectedProfile.welcomeOffer.offerPresets.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  const accentStyle = {
    '--card-accent-rgb': selectedVisual.accentRgb
  } as CSSProperties;

  return (
    <section className="relative mx-auto max-w-6xl space-y-6" style={accentStyle}>
      <div className="pointer-events-none absolute left-[-8rem] top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.12),transparent_72%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_72%)] blur-3xl" />

      <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(12,18,30,0.97))] px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-16 top-[-4rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.16),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-4rem] top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.14),transparent_72%)] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_24rem] lg:items-center">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${selectedVisual.accentClassName}`}>
              The Stack Lab
            </p>
            <h1 className="mt-4 font-heading text-[clamp(2.6rem,5.2vw,4.8rem)] leading-[0.94] tracking-[-0.04em] text-text-primary">
              Which of the Trifecta is Right for You?
            </h1>
            <p className="mt-4 max-w-[38rem] text-[1.02rem] leading-7 text-text-secondary">
              Price the real card, not the marketing card. Choose your lane, value the points honestly, and see
              which premium product actually earns its spot.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className={`rounded-full border border-[rgb(var(--card-accent-rgb)/0.48)] bg-[rgb(var(--card-accent-rgb)/0.28)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${selectedVisual.accentClassName}`}>
                {selectedProfile.shortName}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                {selectedVisual.laneLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                Published fee {formatCurrency(selectedProfile.annualFee)}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.96),rgba(9,13,22,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
            <div className={`pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full blur-3xl ${selectedVisual.accentGlowClassName}`} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-muted">Selected Card</p>
            <div className="mt-3 flex items-center justify-center">
              <EntityImage
                src={selectedVisual.artUrl}
                alt={selectedProfile.name}
                label={selectedProfile.shortName}
                className="aspect-[1.62/1] w-full max-w-[18rem] overflow-visible rounded-none border-0 bg-transparent"
                imgClassName="bg-transparent p-0 drop-shadow-[0_26px_44px_rgba(0,0,0,0.44)]"
                fallbackClassName="bg-black/10"
                fit={selectedVisual.artFit ?? 'contain'}
                scale={selectedVisual.artScale ?? 1}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{selectedVisual.selectorSummary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricTile label="Year One" value={formatCurrency(selectedResult.expectedValueYear1)} accent />
              <MetricTile label="Year Two" value={formatCurrency(selectedResult.expectedValueYear2)} hint={selectedRedemptionLabel} />
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          {premiumCardProfiles.map((profile) => (
            <SelectorCard
              key={profile.id}
              profile={profile}
              selected={profile.id === selectedCardId}
              onSelect={() => {
                startTransition(() => setSelectedCardId(profile.id));
              }}
            />
          ))}
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
        <div className="pointer-events-none absolute left-[-3rem] top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.12),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.16),transparent_72%)] blur-3xl" />
        <div className="mx-auto max-w-[56rem]">
          <div className="grid gap-3 border-b border-white/8 pb-6 md:grid-cols-4">
            <MetricTile label="Bonus lift" value={formatCurrency(welcomeOfferValue)} />
            <MetricTile label="Everyday haul" value={formatCurrency(spendValue)} />
            <MetricTile label="Active path" value={selectedRedemptionLabel} hint={formatCpp(selectedScenario.centsPerPoint)} />
            <MetricTile label="Lane" value={selectedVisual.laneLabel} hint={selectedProfile.shortName} accent />
          </div>

          <div className="mt-6 space-y-6">
          <SectionFrame
            eyebrow="Gate Check"
            icon="gate"
            title="Decide what counts on day one"
            description="The big swing is simple: does the intro bonus belong in the model, and can you realistically clear the opening spend gate?"
          >
            <div className="space-y-4">
              <BinaryChoice
                label="Should the intro bonus count in this run?"
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
              <div className={`pointer-events-none absolute right-0 top-0 h-28 w-40 blur-3xl ${selectedVisual.accentGlowClassName}`} />
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
                          ? 'border-[rgb(var(--card-accent-rgb)/0.76)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.42),rgb(var(--card-accent-rgb)/0.18))] text-text-primary shadow-[0_10px_28px_rgba(0,0,0,0.16)]'
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
                      selectedScenario.offerPoints > 0
                        ? 'border-[rgb(var(--card-accent-rgb)/0.6)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.34),rgb(var(--card-accent-rgb)/0.14))] shadow-[0_10px_28px_rgba(0,0,0,0.14)]'
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
                          value={displayNumericInputValue(selectedScenario.offerPoints)}
                          placeholder="0"
                          onChange={(event) =>
                            handleCurrencyFieldChange(event, (nextValue) => {
                              updateSelectedScenario((current) => ({
                                ...current,
                                offerPoints: nextValue
                              }));
                            })
                          }
                          className={`min-w-0 bg-transparent text-right text-[1.45rem] font-semibold leading-none text-text-primary outline-none ${numericPlaceholderClassName}`}
                        />
                      </div>
                    </div>
                  </label>

                  <label
                    className={`rounded-[1.1rem] border px-3.5 py-3 transition ${
                      selectedScenario.annualFee > 0
                        ? 'border-[rgb(var(--card-accent-rgb)/0.6)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.34),rgb(var(--card-accent-rgb)/0.14))] shadow-[0_10px_28px_rgba(0,0,0,0.14)]'
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
                          step={50}
                          value={displayNumericInputValue(selectedScenario.annualFee)}
                          placeholder="0"
                          onChange={(event) =>
                            handleCurrencyFieldChange(event, (nextValue) => {
                              updateSelectedScenario((current) => ({
                                ...current,
                                annualFee: nextValue
                              }));
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
              <div className="pointer-events-none absolute left-[-1rem] bottom-[-3rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.12),transparent_72%)] blur-3xl" />
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
                          ? 'border-[rgb(var(--card-accent-rgb)/0.76)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.42),rgb(var(--card-accent-rgb)/0.18))] text-text-primary shadow-[0_10px_28px_rgba(0,0,0,0.16)]'
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
            <div>
              <h3 className="text-[1.05rem] font-semibold text-text-primary">Hard-value credits</h3>
              <div className="mt-3 space-y-2.5">
                {selectedProfile.credits.map((credit) => (
                  <CurrencyInput
                    key={credit.id}
                    label={credit.label}
                    note={credit.note}
                    singleLineDisplay={credit.singleLineDisplay ?? (credit.note ? `${credit.label} · ${credit.note}` : undefined)}
                    value={selectedScenario.credits[credit.id] ?? 0}
                    onChange={(next) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        credits: {
                          ...current.credits,
                          [credit.id]: next
                        }
                      }));
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
                    note={benefit.note}
                    singleLineDisplay={benefit.note ? `${benefit.label} · ${benefit.note}` : undefined}
                    centerText
                    value={selectedScenario.benefits[benefit.id] ?? 0}
                    onChange={(next) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        benefits: {
                          ...current.benefits,
                          [benefit.id]: next
                        }
                      }));
                    }}
                  />
                ))}
              </div>

            </div>
          </SectionFrame>

          <section className="relative overflow-hidden rounded-[1.95rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,25,0.98),rgba(18,24,36,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
            <div className="pointer-events-none absolute -right-6 top-0 h-40 w-44 rounded-full bg-[radial-gradient(circle,rgb(var(--card-accent-rgb)/0.2),transparent_74%)] blur-3xl" />
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-[rgb(var(--card-accent-rgb)/0.58)] bg-[linear-gradient(180deg,rgb(var(--card-accent-rgb)/0.38),rgb(var(--card-accent-rgb)/0.16))] text-[rgb(var(--card-accent-rgb))] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                      <Glyph name="score" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">Scoreboard</p>
                  </div>
                  <h3 className="mt-3 font-heading text-[2.4rem] leading-[0.98] tracking-[-0.03em] text-text-primary">
                    {formatCurrency(selectedResult.expectedValueYear1)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Year-one expected value for {selectedProfile.shortName}, priced at {formatCpp(selectedScenario.centsPerPoint)} through {selectedRedemptionLabel}.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateSelectedScenario(() => buildInitialPremiumCardScenario(selectedProfile));
                  }}
                >
                  Reset {selectedProfile.shortName}
                </Button>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <MetricTile label="Bonus lift" value={formatCurrency(welcomeOfferValue)} />
                <MetricTile label="Everyday haul" value={formatCurrency(spendValue)} />
                <MetricTile label="Year Two keep" value={formatCurrency(selectedResult.expectedValueYear2)} hint="Ongoing value after the bonus" />
              </div>

              <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                  <span className="text-sm font-semibold text-text-primary">Value ledger</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${selectedVisual.accentClassName}`}>The Stack read</span>
                </div>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                  <span className="text-text-secondary">Usable credits</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(selectedResult.recurringCreditsValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-secondary">Soft perks</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(selectedResult.benefitsValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-secondary">Points banked from spend</span>
                    <span className="font-semibold text-text-primary">{formatPoints(selectedResult.spendPoints)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                    <span className="text-text-secondary">Fee drag</span>
                    <span className="font-semibold text-brand-coral">-{formatCurrency(selectedScenario.annualFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        </div>
      </motion.section>
    </section>
  );
}
