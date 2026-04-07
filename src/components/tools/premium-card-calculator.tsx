'use client';

import { motion } from 'framer-motion';
import { startTransition, useState } from 'react';
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
    accentClassName: 'text-[#ffd66b]',
    accentBarClassName: 'bg-[#ffd66b]',
    accentGlowClassName: 'bg-[#ffd66b]/12',
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
    accentClassName: 'text-[#8fddff]',
    accentBarClassName: 'bg-[#8fddff]',
    accentGlowClassName: 'bg-[#8fddff]/12',
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
    accentClassName: 'text-[#6dffd2]',
    accentBarClassName: 'bg-[#6dffd2]',
    accentGlowClassName: 'bg-[#6dffd2]/12',
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

function sanitizeCppInput(raw: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 10) / 10;
}

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
      className="group relative w-full text-center transition"
    >
      <div className="relative">
        <div className="relative mx-auto flex h-[14.4rem] max-w-[18.4rem] items-end justify-center md:h-[15rem]">
          {selected ? (
            <div className={`absolute inset-x-7 bottom-5 h-16 rounded-full blur-[40px] ${visual.accentGlowClassName}`} />
          ) : null}
          <EntityImage
            src={visual.artUrl}
            alt={profile.name}
            label={profile.shortName}
            className={`aspect-[1.62/1] w-full overflow-visible rounded-none border-0 bg-transparent ${visual.selectorWidthClassName}`}
            imgClassName={`bg-transparent p-0 transition duration-200 ${
              selected
                ? 'drop-shadow-[0_28px_48px_rgba(0,0,0,0.5)]'
                : 'opacity-84 drop-shadow-[0_18px_32px_rgba(0,0,0,0.3)] group-hover:opacity-100'
            }`}
            fallbackClassName="bg-black/10"
            fit={visual.selectorArtFit ?? visual.artFit ?? 'contain'}
            position={visual.selectorArtPosition ?? visual.artPosition}
            scale={visual.selectorArtScale ?? visual.artScale ?? 1}
          />
        </div>

        <div className="mx-auto mt-2.5 max-w-[15.25rem]">
          <div className="flex items-start justify-between gap-3 text-left">
            <div className="min-w-0">
              <p className="text-[1.01rem] font-semibold leading-tight text-text-primary">{profile.shortName}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                {visual.laneLabel}
              </p>
            </div>
            {selected ? (
              <span className={`shrink-0 flex items-center gap-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] ${visual.accentClassName}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${visual.accentBarClassName}`} />
                Active
              </span>
            ) : (
              <span className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                Pick
              </span>
            )}
          </div>
          <div className={`mt-2.5 h-[2px] rounded-full transition-all ${selected ? `w-16 ${visual.accentBarClassName}` : 'w-8 bg-white/8'}`} />
        </div>
      </div>
    </button>
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
    <section className="rounded-[1.75rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-5 md:p-7">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] text-brand-teal">
            <Glyph name={icon} className="h-4 w-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">{eyebrow}</p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
        <div className="mt-6">{children}</div>
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
    <div className="rounded-[1.4rem] border border-white/14 bg-white/[0.06] p-4">
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            value
              ? 'border-brand-teal/45 bg-brand-teal/15 text-text-primary'
              : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20'
          }`}
        >
          {positiveLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            !value
              ? 'border-brand-coral/45 bg-brand-coral/12 text-text-primary'
              : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20'
          }`}
        >
          {negativeLabel}
        </button>
      </div>
    </div>
  );
}

function CurrencyInput({
  label,
  note,
  value,
  onChange,
  step = 50
}: {
  label: string;
  note?: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
}) {
  return (
    <label className="block rounded-[1.35rem] border border-white/14 bg-white/[0.06] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold leading-6 text-text-primary">{label}</p>
          {note && <p className="mt-1 text-xs leading-5 text-text-muted">{note}</p>}
        </div>
        <div className="flex w-full items-center rounded-2xl border border-white/14 bg-white/[0.08] px-3 sm:w-36 sm:shrink-0">
          <span className="text-sm text-text-muted">$</span>
          <input
            type="number"
            min={0}
            step={step}
            value={value}
            onChange={(event) => onChange(sanitizeCurrencyInput(event.target.value))}
            className="w-full bg-transparent px-2 py-2 text-right text-sm font-semibold text-text-primary outline-none"
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

  return (
    <label className="block rounded-[1.4rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] text-brand-teal">
              <Glyph name={glyph} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-6 text-text-primary">{label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">Spend lane</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-teal/30 bg-brand-teal/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
              Stack {multiplier}x
            </span>
            {note && (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {note}
              </span>
            )}
          </div>
        </div>

        <div className="w-full sm:w-36 sm:shrink-0">
          <div className="flex items-center rounded-2xl border border-white/14 bg-white/[0.08] px-3">
            <span className="text-sm text-text-muted">$</span>
            <input
              type="number"
              min={0}
              step={100}
              value={value}
              onChange={(event) => onChange(sanitizeCurrencyInput(event.target.value))}
              className="w-full bg-transparent px-2 py-2 text-right text-sm font-semibold text-text-primary outline-none"
            />
          </div>
          <p className="mt-2 text-right text-xs text-text-muted">{formatPoints(pointsEarned)} banked</p>
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

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] px-5 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.18)] md:px-8 md:py-8">
        <div className="mx-auto max-w-[44rem] text-center">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.24em] ${selectedVisual.accentClassName}`}>
            The Stack Lab
          </p>
          <h1 className="mt-3 font-heading text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[0.98] tracking-[-0.02em] text-text-primary">
            Pick your premium card. Then run the real-life math.
          </h1>
          <p className="mx-auto mt-3 max-w-[35rem] text-[0.97rem] leading-7 text-text-secondary">
            Choose Platinum, Reserve, or Venture X. Plug in your own spend, point value, and credit usage to see
            which one actually holds up.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-[60rem] gap-y-6 md:grid-cols-3 md:items-end md:gap-x-5 md:gap-y-0">
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
        className="rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.14)] md:p-8"
      >
        <div className="mx-auto max-w-4xl border-b border-white/10 pb-8 text-center">
          <div className="mx-auto max-w-2xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${selectedVisual.accentClassName}`}>
              Current Run
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-text-primary">{selectedProfile.shortName} value run</h2>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              Build the version of this card you would actually live with, not the version that only works in a
              marketing deck.
            </p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-md">
            <EntityImage
              src={selectedVisual.artUrl}
              alt={selectedProfile.name}
              label={selectedProfile.shortName}
              className="mx-auto aspect-[1.62/1] w-full max-w-[22rem] overflow-visible rounded-none border-0 bg-transparent"
              imgClassName="bg-transparent p-0 drop-shadow-[0_30px_52px_rgba(0,0,0,0.48)]"
              fallbackClassName="bg-black/10"
              fit={selectedVisual.artFit ?? 'contain'}
              scale={selectedVisual.artScale ?? 1}
            />
            <div className="mt-4 flex items-center justify-center gap-3">
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${selectedVisual.accentClassName}`}>
                {selectedVisual.laneLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
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

            <div className="mt-6 rounded-[1.5rem] border border-white/14 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold text-text-primary">Bonus on the table</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {selectedProfile.welcomeOffer.offerPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      updateSelectedScenario((current) => ({ ...current, offerPoints: preset }));
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedScenario.offerPoints === preset
                        ? 'border-brand-teal/45 bg-brand-teal/15 text-text-primary'
                        : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20'
                    }`}
                  >
                    {formatPoints(preset)} {selectedProfile.offerCurrencyShortLabel}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3 sm:max-w-sm">
                <label className="block rounded-[1.25rem] border border-white/14 bg-white/[0.08] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Offer size</p>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={selectedScenario.offerPoints}
                    onChange={(event) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        offerPoints: sanitizeCurrencyInput(event.target.value)
                      }));
                    }}
                    className="mt-3 w-full bg-transparent text-right text-lg font-semibold text-text-primary outline-none"
                  />
                </label>

                <CurrencyInput
                  label="Fee drag"
                  value={selectedScenario.annualFee}
                  onChange={(next) => {
                    updateSelectedScenario((current) => ({ ...current, annualFee: next }));
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/14 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold text-text-primary">Exit route for points</p>
              <div className="mt-3 flex flex-wrap gap-3">
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
                    className={`rounded-[1.1rem] border px-4 py-3 text-left text-sm transition ${
                      selectedScenario.selectedRedemptionId === option.id
                        ? 'border-brand-teal/45 bg-brand-teal/15 text-text-primary'
                        : 'border-white/10 bg-white/[0.05] text-text-secondary hover:border-white/20'
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">{option.note}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 sm:max-w-sm">
                <label className="block rounded-[1.25rem] border border-white/14 bg-white/[0.08] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Your CPP</p>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={selectedScenario.centsPerPoint}
                    onChange={(event) => {
                      updateSelectedScenario((current) => ({
                        ...current,
                        selectedRedemptionId: 'custom',
                        centsPerPoint: sanitizeCppInput(event.target.value)
                      }));
                    }}
                    className="mt-3 w-full bg-transparent text-right text-lg font-semibold text-text-primary outline-none"
                  />
                  <p className="mt-2 text-right text-xs text-text-muted">cents per point</p>
                </label>
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
              <h3 className="text-lg font-semibold text-text-primary">Hard-value credits</h3>
              <div className="mt-4 space-y-3">
                {selectedProfile.credits.map((credit) => (
                  <CurrencyInput
                    key={credit.id}
                    label={credit.label}
                    note={credit.note}
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

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-primary">Soft-value perks</h3>
              <div className="mt-4 space-y-3">
                {selectedProfile.benefits.map((benefit) => (
                  <CurrencyInput
                    key={benefit.id}
                    label={benefit.label}
                    note={benefit.note}
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

              <div className="mt-6 space-y-3">
                <CurrencyInput
                  label={selectedProfile.timingAdjustments.firstYearLabel}
                  note={selectedProfile.timingAdjustments.firstYearNote}
                  value={selectedScenario.firstYearExtraValue}
                  onChange={(next) => {
                    updateSelectedScenario((current) => ({ ...current, firstYearExtraValue: next }));
                  }}
                />
                <CurrencyInput
                  label={selectedProfile.timingAdjustments.renewalLabel}
                  note={selectedProfile.timingAdjustments.renewalNote}
                  value={selectedScenario.renewalOnlyValue}
                  onChange={(next) => {
                    updateSelectedScenario((current) => ({ ...current, renewalOnlyValue: next }));
                  }}
                />
              </div>
            </div>
          </SectionFrame>

          <section className="rounded-[1.75rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 md:p-6">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] text-brand-teal">
                      <Glyph name="score" className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Scoreboard</p>
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-text-primary">The Stack read</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {selectedRedemptionLabel} at {formatCpp(selectedScenario.centsPerPoint)}
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

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/14 bg-white/[0.06] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Bonus lift</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{formatCurrency(welcomeOfferValue)}</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/14 bg-white/[0.06] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Everyday haul</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{formatCurrency(spendValue)}</p>
                </div>
                <div className="rounded-[1.3rem] border border-brand-teal/20 bg-brand-teal/12 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-teal">Year One Take</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">
                    {formatCurrency(selectedResult.expectedValueYear1)}
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-white/14 bg-white/[0.06] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Year Two Keep</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">
                    {formatCurrency(selectedResult.expectedValueYear2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
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
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <span className="text-text-secondary">Fee drag</span>
                  <span className="font-semibold text-brand-coral">-{formatCurrency(selectedScenario.annualFee)}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/14 bg-white/[0.05] p-4 text-sm leading-7 text-text-secondary">
            Treat this like live underwriting. If a card only looks good when every edge case breaks in its favor, it
            probably does not actually belong in your wallet.
          </div>
        </div>
      </motion.section>
    </section>
  );
}
