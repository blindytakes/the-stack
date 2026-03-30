'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EntityImage } from '@/components/ui/entity-image';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { formatSpendCategoryLabel } from '@/lib/cards-directory-explorer';
import type { CardRecord } from '@/lib/cards';
import type { QuizRequest } from '@/lib/quiz-engine';
import { usStateAndOtherOptions } from '@/lib/us-state-options';

const popularOwnedCardSlugs = [
  'amex-gold-card',
  'amex-platinum-card',
  'capital-one-venture-x',
  'chase-sapphire-preferred',
  'chase-sapphire-reserve',
  'chase-freedom-unlimited',
  'amex-blue-cash-preferred',
  'bilt-mastercard'
] as const;
const commonCardLimit = 6;
const popularOwnedBankNames = [
  'Chase',
  'Bank of America',
  'Wells Fargo',
  'Capital One',
  'Citi',
  'American Express',
  'Discover',
  'U.S. Bank'
] as const;
const commonBankLimit = 6;

export const usStateOptions = usStateAndOtherOptions;

export type CardSelectionQuestionId = 'ownedCardSlugs' | 'amexLifetimeBlockedSlugs';
export type BankSelectionQuestionId = 'ownedBankNames';
type FinderQuestionId = Exclude<keyof QuizRequest, CardSelectionQuestionId | BankSelectionQuestionId>;
type FinderStepOption = { label: string; value: string };

export type FinderOptionStep = {
  id: FinderQuestionId;
  type?: 'options';
  title: string;
  description?: string;
  optional?: boolean;
  options: ReadonlyArray<FinderStepOption>;
};

export type FinderSelectStep = {
  id: FinderQuestionId;
  type: 'select';
  title: string;
  description?: string;
  optional?: boolean;
  placeholder?: string;
  helperText?: string;
  options: ReadonlyArray<FinderStepOption>;
};

export type FinderCardSelectionStep = {
  id: CardSelectionQuestionId;
  type: 'card_selection';
  title: string;
  description: string;
};

export type FinderBankSelectionStep = {
  id: BankSelectionQuestionId;
  type: 'bank_selection';
  title: string;
  description: string;
};

export type FinderQuestionStep = FinderOptionStep | FinderSelectStep | FinderCardSelectionStep | FinderBankSelectionStep;

function formatRewardTypeLabel(rewardType: CardRecord['rewardType']) {
  if (rewardType === 'cashback') return 'Cash back';
  if (rewardType === 'miles') return 'Miles';
  return 'Points';
}

function formatAnnualFeeLabel(annualFee: number) {
  return annualFee === 0 ? 'No annual fee' : `$${annualFee} annual fee`;
}

function formatPrimarySpendLabel(card: CardRecord) {
  const primaryCategory = card.topCategories.find((category) => category !== 'other') ?? 'all';
  return formatSpendCategoryLabel(primaryCategory);
}

function CompactCardChoice({
  card,
  onSelect
}: {
  card: CardRecord;
  onSelect: (slug: string) => void;
}) {
  const imagePresentation = getCardImagePresentation(card.slug);
  const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';
  const usesLowValueImage = isLowValueCardImageUrl(card.imageUrl);

  return (
    <button
      type="button"
      onClick={() => onSelect(card.slug)}
      className="group flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.06]"
    >
      <div className="w-16 shrink-0">
        <EntityImage
          src={usesLowValueImage ? undefined : card.imageUrl}
          alt={`${card.name} card art`}
          label={usesLowValueImage ? card.issuer : card.name}
          className="aspect-[1.586/1] rounded-[0.95rem]"
          imgClassName={imageClassName}
          fallbackClassName="bg-black/10"
          fallbackVariant={usesLowValueImage ? 'wordmark' : 'initials'}
          fit={imagePresentation?.fit}
          position={imagePresentation?.position}
          scale={imagePresentation?.scale}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{card.issuer}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">
          {card.name}
        </p>
      </div>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-teal/25 bg-brand-teal/10 text-brand-teal transition group-hover:border-brand-teal/40 group-hover:bg-brand-teal/15">
        +
      </span>
    </button>
  );
}

function DrawerCardRow({
  card,
  onSelect
}: {
  card: CardRecord;
  onSelect: (slug: string) => void;
}) {
  const imagePresentation = getCardImagePresentation(card.slug);
  const imageClassName = imagePresentation?.imgClassName ?? 'bg-black/10 p-2';
  const usesLowValueImage = isLowValueCardImageUrl(card.imageUrl);

  return (
    <button
      type="button"
      onClick={() => onSelect(card.slug)}
      className="group flex w-full items-start gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.06]"
    >
      <div className="w-24 shrink-0">
        <EntityImage
          src={usesLowValueImage ? undefined : card.imageUrl}
          alt={`${card.name} card art`}
          label={usesLowValueImage ? card.issuer : card.name}
          className="aspect-[1.586/1] rounded-[0.95rem]"
          imgClassName={imageClassName}
          fallbackClassName="bg-black/10"
          fallbackVariant={usesLowValueImage ? 'wordmark' : 'initials'}
          fit={imagePresentation?.fit}
          position={imagePresentation?.position}
          scale={imagePresentation?.scale}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">{card.issuer}</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">
              {card.name}
            </p>
          </div>
          <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal transition group-hover:border-brand-teal/40">
            Add
          </span>
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          {formatPrimarySpendLabel(card)} · {formatRewardTypeLabel(card.rewardType)} · {formatAnnualFeeLabel(card.annualFee)}
        </p>
      </div>
    </button>
  );
}

function CompactBankChoice({
  name,
  onSelect
}: {
  name: string;
  onSelect: (name: string) => void;
}) {
  function buildBankFallbackLabel(bankName: string) {
    const normalized = bankName
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const lower = normalized.toLowerCase();

    if (lower === 'american express') return 'Amex';
    if (lower === 'bank of america') return 'BofA';
    if (lower === 'u.s. bank') return 'U.S.';
    if (lower === 'wells fargo') return 'WF';
    if (lower === 'capital one') return 'C1';

    const firstWord = normalized.split(' ')[0] ?? normalized;
    if (firstWord.length <= 8) return firstWord;

    return normalized
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('');
  }

  const imagePresentation = getBankingImagePresentation(name);
  const imageUrl = resolveBankingBrandImageUrl(name);
  const normalizedScale = Math.min(imagePresentation?.scale ?? 1.04, 1.12);
  const imgClassName = imagePresentation?.compactImgClassName ?? 'bg-black/10 px-3 py-2';

  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className="group flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.06]"
    >
      <div className="flex h-11 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] ring-1 ring-white/8">
        {imageUrl ? (
          // Banking logo URLs are curated brand assets from canonical sources.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${name} logo`}
            loading="lazy"
            decoding="async"
            style={{
              ...(imagePresentation?.position ? { objectPosition: imagePresentation.position } : {}),
              ...(normalizedScale !== 1 ? { transform: `scale(${normalizedScale})` } : {})
            }}
            className={`${imgClassName} h-full w-full ${
              imagePresentation?.fit === 'cover' ? 'object-cover' : 'object-contain'
            }`}
          />
        ) : (
          <span className="px-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary">
            {buildBankFallbackLabel(name)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-text-primary">{name}</p>
      </div>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-teal/25 bg-brand-teal/10 text-brand-teal transition group-hover:border-brand-teal/40 group-hover:bg-brand-teal/15">
        +
      </span>
    </button>
  );
}

export function CardFinderProgress({
  stepIndex,
  totalSteps,
  progress
}: {
  stepIndex: number;
  totalSteps: number;
  progress: number;
}) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-text-muted md:text-base">
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-bg-surface md:h-2.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Intake progress"
      >
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(212,168,83,0.9),rgba(45,212,191,0.95))]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function CardFinderQuestion({
  step,
  selectedValue,
  onSelect,
  onAutoAdvance
}: {
  step: FinderOptionStep;
  selectedValue?: string;
  onSelect: (value: string) => void;
  onAutoAdvance?: () => void;
}) {
  return (
    <div className="mt-10">
      <motion.h2
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl"
      >
        {step.title}
      </motion.h2>
      {step.description && (
        <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary md:text-xl lg:max-w-none">
          {step.description}
        </p>
      )}
      <motion.div
        key={step.id + '-options'}
        className="mt-10 grid gap-4 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } }
        }}
      >
        {step.options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <motion.button
              key={option.value}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 }
              }}
              onClick={() => {
                onSelect(option.value);
                if (onAutoAdvance) {
                  setTimeout(onAutoAdvance, 350);
                }
              }}
              whileTap={{ scale: 0.97 }}
              className={`flex min-h-[82px] items-center gap-4 rounded-2xl border px-6 py-5 text-left text-lg leading-snug transition-all duration-200 md:min-h-[90px] md:text-xl ${
                active
                  ? 'border-brand-teal bg-brand-teal/10 text-text-primary scale-[1.02]'
                  : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                active
                  ? 'border-brand-teal bg-brand-teal'
                  : 'border-white/20'
              }`}>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

export function CardFinderSelectQuestion({
  step,
  selectedValue,
  onSelect
}: {
  step: FinderSelectStep;
  selectedValue?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-10">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
          {step.title}
        </h2>
        {step.description && (
          <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary md:text-xl lg:max-w-none">
            {step.description}
          </p>
        )}
      </motion.div>

      <div className="mt-10 max-w-4xl rounded-3xl border border-white/10 bg-bg-surface p-6 md:p-7 lg:p-8">
        <label className="block">
          <span className="text-sm uppercase tracking-[0.22em] text-text-muted md:text-base">
            Select one
          </span>
          <select
            value={selectedValue ?? ''}
            onChange={(event) => onSelect(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-bg px-6 py-5 text-lg text-text-primary focus:border-brand-teal focus:outline-none md:text-xl"
          >
            <option value="">{step.placeholder ?? 'Choose an option'}</option>
            {step.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {step.helperText && (
          <p className="mt-5 text-base leading-8 text-text-muted md:text-lg">
            {step.helperText}
          </p>
        )}
      </div>
    </div>
  );
}

export function CardSelectionQuestion({
  step,
  cards,
  selectedSlugs,
  onToggle,
  onClear,
  searchId,
  searchLabel = 'Search cards',
  searchPlaceholder = 'Search by card name or issuer',
  selectedHeading,
  selectedSummary,
  emptySelectionText,
  browseAllLayout = 'drawer',
  loading = false,
  error = '',
  errorMessage = 'Card search is unavailable right now. You can skip this step and still build a plan.'
}: {
  step: FinderCardSelectionStep;
  cards: CardRecord[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  searchId: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  selectedHeading: string;
  selectedSummary?: (count: number) => string;
  emptySelectionText?: string;
  browseAllLayout?: 'drawer' | 'modal';
  loading?: boolean;
  error?: string;
  errorMessage?: string;
}) {
  const [query, setQuery] = useState('');
  const [showAllCards, setShowAllCards] = useState(false);
  const [allCardsQuery, setAllCardsQuery] = useState('');
  const [activeIssuer, setActiveIssuer] = useState('all');

  useEffect(() => {
    setQuery('');
    setShowAllCards(false);
    setAllCardsQuery('');
    setActiveIssuer('all');
  }, [step.id]);

  useEffect(() => {
    if (!showAllCards) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowAllCards(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAllCards]);

  const trimmedQuery = query.trim().toLowerCase();
  const trimmedAllCardsQuery = allCardsQuery.trim().toLowerCase();
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  const selectedCardSet = new Set(selectedSlugs);
  const selectedCards = selectedSlugs
    .map((slug) => cardsBySlug.get(slug))
    .filter((card): card is CardRecord => Boolean(card));
  const sortedCards = [...cards].sort(
    (a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name)
  );
  const availableCards = sortedCards.filter((card) => !selectedCardSet.has(card.slug));
  const matchedSearchCards = trimmedQuery
    ? availableCards.filter((card) =>
        `${card.name} ${card.issuer}`.toLowerCase().includes(trimmedQuery)
      )
    : [];
  const matchingCards = matchedSearchCards.slice(0, 6);
  const popularCardSlugSet = new Set<string>(popularOwnedCardSlugs);
  const prioritizedCommonCards = popularOwnedCardSlugs
    .map((slug) => cardsBySlug.get(slug))
    .filter((card): card is CardRecord => Boolean(card))
    .filter((card) => !selectedCardSet.has(card.slug));
  const fallbackCommonCards = availableCards.filter((card) => !popularCardSlugSet.has(card.slug));
  const commonCards = [...prioritizedCommonCards, ...fallbackCommonCards].slice(0, commonCardLimit);
  const issuerOptions = Array.from(new Set(availableCards.map((card) => card.issuer))).sort(
    (a, b) => a.localeCompare(b)
  );

  useEffect(() => {
    if (activeIssuer !== 'all' && !issuerOptions.includes(activeIssuer)) {
      setActiveIssuer('all');
    }
  }, [activeIssuer, issuerOptions]);

  const fullListCards = trimmedAllCardsQuery
    ? availableCards.filter((card) =>
        `${card.name} ${card.issuer}`.toLowerCase().includes(trimmedAllCardsQuery)
      )
    : availableCards;
  const drawerCards =
    activeIssuer === 'all'
      ? fullListCards
      : fullListCards.filter((card) => card.issuer === activeIssuer);
  const allCardGroups = drawerCards.reduce<Array<{ issuer: string; cards: CardRecord[] }>>(
    (groups, card) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.issuer === card.issuer) {
        lastGroup.cards.push(card);
        return groups;
      }

      groups.push({ issuer: card.issuer, cards: [card] });
      return groups;
    },
    []
  );
  const selectedSummaryText =
    selectedCards.length > 0
      ? selectedSummary?.(selectedCards.length) ??
        'Selected cards stay out of future recommendation sets.'
      : emptySelectionText ??
        'No cards selected yet. Add any cards you already have from the quick picks or full catalog.';

  function openAllCardsDrawer(prefillQuery = '') {
    setAllCardsQuery(prefillQuery);
    setActiveIssuer('all');
    setShowAllCards(true);
  }

  return (
    <div className="mt-10">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
          {step.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary md:text-xl lg:max-w-none">
          {step.description}
        </p>
      </motion.div>

      <div className="mt-10 space-y-5">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-6 shadow-[0_8px_36px_rgba(0,0,0,0.18)] md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-text-muted">{searchLabel}</p>
              <p className="mt-1 text-sm text-text-secondary">Search directly or browse the full list.</p>
            </div>

            {availableCards.length > 0 && (
              <Button
                onClick={() => openAllCardsDrawer(query)}
                className="w-full gap-2 px-4 py-3 text-sm sm:w-auto"
              >
                Browse all cards
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-black/80">
                  {availableCards.length}
                </span>
              </Button>
            )}
          </div>

          <label htmlFor={searchId} className="mt-6 block">
            <span className="sr-only">{searchLabel}</span>
            <input
              id={searchId}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-bg px-5 py-4 text-base text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none md:text-lg"
            />
          </label>

          {loading ? (
            <p className="mt-5 text-base text-text-muted">Loading the active card catalog…</p>
          ) : error ? (
            <p className="mt-5 text-base text-brand-coral">{errorMessage}</p>
          ) : trimmedQuery ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Matches</p>
                {matchedSearchCards.length > matchingCards.length && (
                  <Button
                    variant="ghost"
                    onClick={() => openAllCardsDrawer(query)}
                    className="px-4 py-2.5 text-sm"
                  >
                    View all {matchedSearchCards.length} matches
                  </Button>
                )}
              </div>

              {matchingCards.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {matchingCards.map((card) => (
                    <CompactCardChoice
                      key={card.slug}
                      card={card}
                      onSelect={(slug) => {
                        onToggle(slug);
                        setQuery('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-bg/40 px-5 py-5">
                  <p className="text-base text-text-muted">
                    No cards matched that search. Try an issuer name like Chase or Amex, or open the full catalog.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Quick picks</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {commonCards.length} suggested
                </span>
              </div>

              {commonCards.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {commonCards.map((card) => (
                    <CompactCardChoice
                      key={card.slug}
                      card={card}
                      onSelect={onToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-bg/40 px-5 py-5">
                  <p className="text-base text-text-muted">
                    {availableCards.length === 0
                      ? 'You already selected every card in the current catalog.'
                      : 'Start typing to search, or open the full catalog to browse all available cards.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(45,212,191,0.09),rgba(255,255,255,0.025))] p-6 shadow-[0_10px_40px_rgba(45,212,191,0.08)] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-text-muted">{selectedHeading}</p>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {selectedCards.length}
                </span>
              </div>
              {selectedCards.length === 0 && (
                <p className="mt-2 text-sm text-text-secondary">{selectedSummaryText}</p>
              )}
            </div>

            {selectedCards.length > 0 && (
              <Button variant="ghost" onClick={onClear} className="px-5 py-2.5 text-sm md:text-base">
                Clear all
              </Button>
            )}
          </div>

          {selectedCards.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {selectedCards.map((card) => (
                <button
                  key={card.slug}
                  type="button"
                  onClick={() => onToggle(card.slug)}
                  className="group rounded-full border border-brand-teal/25 bg-brand-teal/[0.08] px-4 py-2.5 text-left transition hover:border-brand-teal/45 hover:bg-brand-teal/[0.12]"
                  aria-label={`Remove ${card.name}`}
                >
                  <span className="text-base text-text-primary">{card.name}</span>
                  <span className="ml-2 text-text-muted transition group-hover:text-text-primary">×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAllCards && (
        <motion.div
          className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm ${
            browseAllLayout === 'modal' ? 'flex items-center justify-center p-4 md:p-6' : ''
          }`}
          onClick={() => setShowAllCards(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${searchId}-catalog-title`}
            className={
              browseAllLayout === 'modal'
                ? 'flex max-h-[88vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,33,0.98),rgba(14,16,25,1))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-6'
                : 'ml-auto flex h-full w-full max-w-[620px] flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,rgba(20,22,33,0.98),rgba(14,16,25,1))] p-5 shadow-[-24px_0_80px_rgba(0,0,0,0.45)] md:p-6'
            }
            onClick={(event) => event.stopPropagation()}
            initial={
              browseAllLayout === 'modal'
                ? { opacity: 0, scale: 0.96, y: 16 }
                : { opacity: 0, x: 36 }
            }
            animate={
              browseAllLayout === 'modal'
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, x: 0 }
            }
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Full card list</p>
                <h3 id={`${searchId}-catalog-title`} className="mt-2 text-2xl font-semibold text-text-primary">
                  Browse all cards
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Selected cards disappear from this list automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {selectedCards.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllCards(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor={`${searchId}-all-cards`}
                className="text-xs uppercase tracking-[0.22em] text-text-muted"
              >
                Search full list
              </label>
              <input
                id={`${searchId}-all-cards`}
                type="text"
                value={allCardsQuery}
                onChange={(event) => setAllCardsQuery(event.target.value)}
                placeholder="Search by card name or issuer"
                autoFocus
                className="mt-3 w-full rounded-2xl border border-white/10 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
              />
            </div>

            {issuerOptions.length > 1 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Filter by issuer</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIssuer('all')}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      activeIssuer === 'all'
                        ? 'border-brand-teal/40 bg-brand-teal/10 text-text-primary'
                        : 'border-white/10 text-text-secondary hover:border-white/30 hover:text-text-primary'
                    }`}
                  >
                    All issuers
                  </button>
                  {issuerOptions.map((issuer) => (
                    <button
                      key={issuer}
                      type="button"
                      onClick={() => setActiveIssuer(issuer)}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        activeIssuer === issuer
                          ? 'border-brand-teal/40 bg-brand-teal/10 text-text-primary'
                          : 'border-white/10 text-text-secondary hover:border-white/30 hover:text-text-primary'
                      }`}
                    >
                      {issuer}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              {allCardGroups.length > 0 ? (
                <div className="space-y-5 pb-4">
                  {allCardGroups.map((group) => (
                    <div key={group.issuer}>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
                        {group.issuer}
                      </p>
                      <div className="mt-3 space-y-3">
                        {group.cards.map((card) => (
                          <DrawerCardRow key={card.slug} card={card} onSelect={onToggle} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-bg/30 px-4 py-4 text-sm text-text-muted">
                  No cards matched that search or filter.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-sm text-text-secondary">
                {selectedCards.length === 0
                  ? 'Select any cards you already have, then continue.'
                  : `${selectedCards.length} card${selectedCards.length === 1 ? '' : 's'} selected`}
              </p>
              <Button onClick={() => setShowAllCards(false)}>Done</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export function BankSelectionQuestion({
  step,
  bankNames,
  selectedNames,
  onToggle,
  onClear
}: {
  step: FinderBankSelectionStep;
  bankNames: string[];
  selectedNames: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [allBanksQuery, setAllBanksQuery] = useState('');

  useEffect(() => {
    setQuery('');
    setShowAllBanks(false);
    setAllBanksQuery('');
  }, [step.id]);

  useEffect(() => {
    if (!showAllBanks) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowAllBanks(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAllBanks]);

  const trimmedQuery = query.trim().toLowerCase();
  const trimmedAllBanksQuery = allBanksQuery.trim().toLowerCase();
  const selectedSet = new Set(selectedNames);
  const available = [...bankNames]
    .filter((name) => !selectedSet.has(name))
    .sort((a, b) => a.localeCompare(b));
  const matchedBanks = trimmedQuery
    ? available.filter((name) => name.toLowerCase().includes(trimmedQuery))
    : [];
  const matchingBanks = matchedBanks.slice(0, 8);
  const popularBankSet = new Set<string>(popularOwnedBankNames);
  const prioritizedCommonBanks = popularOwnedBankNames.filter((name) => available.includes(name));
  const fallbackCommonBanks = available.filter((name) => !popularBankSet.has(name));
  const commonBanks = [...prioritizedCommonBanks, ...fallbackCommonBanks].slice(0, commonBankLimit);
  const fullListBanks = trimmedAllBanksQuery
    ? available.filter((name) => name.toLowerCase().includes(trimmedAllBanksQuery))
    : available;

  function openAllBanksModal(prefillQuery = '') {
    setAllBanksQuery(prefillQuery);
    setShowAllBanks(true);
  }

  return (
    <div className="mt-10">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
          {step.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary md:text-xl lg:max-w-none">
          {step.description}
        </p>
      </motion.div>

      <div className="mt-10 space-y-5">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-6 shadow-[0_8px_36px_rgba(0,0,0,0.18)] md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Search banks</p>
              <p className="mt-1 text-sm text-text-secondary">Search directly or browse the full list.</p>
            </div>

            {available.length > 0 && (
              <Button
                onClick={() => openAllBanksModal(query)}
                className="w-full gap-2 px-4 py-3 text-sm sm:w-auto"
              >
                Browse all banks
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-black/80">
                  {available.length}
                </span>
              </Button>
            )}
          </div>

          <label
            htmlFor="bank-name-search"
            className="mt-6 block"
          >
            <span className="sr-only">Search banks</span>
          <input
            id="bank-name-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by bank name"
            className="w-full rounded-2xl border border-white/10 bg-bg px-5 py-4 text-base text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none md:text-lg"
          />
          </label>

          {trimmedQuery ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Matches</p>
                {matchedBanks.length > matchingBanks.length && (
                  <Button
                    variant="ghost"
                    onClick={() => openAllBanksModal(query)}
                    className="px-4 py-2.5 text-sm"
                  >
                    View all {matchedBanks.length} matches
                  </Button>
                )}
              </div>

              {matchingBanks.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {matchingBanks.map((name) => (
                    <CompactBankChoice
                      key={name}
                      name={name}
                      onSelect={(selectedName) => {
                        onToggle(selectedName);
                        setQuery('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-bg/40 px-5 py-5">
                  <p className="text-base text-text-muted">
                    No banks matched that search. Try a bank name like Chase or Capital One, or open the full list.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Quick picks</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {commonBanks.length} suggested
                </span>
              </div>

              {commonBanks.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {commonBanks.map((name) => (
                    <CompactBankChoice key={name} name={name} onSelect={onToggle} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-bg/40 px-5 py-5">
                  <p className="text-base text-text-muted">
                    {available.length === 0
                      ? 'You already selected every bank in the current list.'
                      : 'Start typing to search, or open the full list to browse all banks.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(45,212,191,0.09),rgba(255,255,255,0.025))] p-6 shadow-[0_10px_40px_rgba(45,212,191,0.08)] md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Banks you already use</p>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {selectedNames.length}
              </span>
            </div>
            {selectedNames.length > 0 && (
              <Button variant="ghost" onClick={onClear} className="px-5 py-2.5 text-sm md:text-base">
                Clear all
              </Button>
            )}
          </div>

          {selectedNames.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {selectedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggle(name)}
                  className="group rounded-full border border-brand-teal/25 bg-brand-teal/[0.08] px-4 py-2.5 text-left transition hover:border-brand-teal/45 hover:bg-brand-teal/[0.12]"
                >
                  <span className="text-base text-text-primary">{name}</span>
                  <span className="ml-2 text-text-muted transition group-hover:text-text-primary">×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">
              No banks selected yet. Add any banks you already use from the box above.
            </p>
          )}
        </div>
      </div>

      {showAllBanks && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:p-6"
          onClick={() => setShowAllBanks(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-catalog-title"
            className="flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,33,0.98),rgba(14,16,25,1))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-6"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Full bank list</p>
                <h3 id="bank-catalog-title" className="mt-2 text-2xl font-semibold text-text-primary">
                  Browse all banks
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Selected banks disappear from this list automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {selectedNames.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllBanks(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="bank-name-search-all" className="text-xs uppercase tracking-[0.22em] text-text-muted">
                Search full list
              </label>
              <input
                id="bank-name-search-all"
                type="text"
                value={allBanksQuery}
                onChange={(event) => setAllBanksQuery(event.target.value)}
                placeholder="Search by bank name"
                autoFocus
                className="mt-3 w-full rounded-2xl border border-white/10 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
              />
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              {fullListBanks.length > 0 ? (
                <div className="grid gap-3 pb-4 md:grid-cols-2">
                  {fullListBanks.map((name) => (
                    <CompactBankChoice key={name} name={name} onSelect={onToggle} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-bg/30 px-4 py-4 text-sm text-text-muted">
                  No banks matched that search.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-sm text-text-secondary">
                {selectedNames.length === 0
                  ? 'Select any banks you already use, then continue.'
                  : `${selectedNames.length} bank${selectedNames.length === 1 ? '' : 's'} selected`}
              </p>
              <Button onClick={() => setShowAllBanks(false)}>Done</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export function CardFinderActions({
  canGoBack,
  canContinue,
  isLastStep,
  isComplete,
  loading,
  hideContinue,
  continueLabel,
  submitLabel,
  submittingLabel,
  onBack,
  onContinue,
  onSubmit
}: {
  canGoBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  isComplete: boolean;
  loading: boolean;
  hideContinue?: boolean;
  continueLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-10 flex flex-wrap justify-between gap-4">
      {canGoBack ? (
        <Button variant="ghost" onClick={onBack} className="px-6 py-3 text-base md:px-7 md:text-lg">
          Back
        </Button>
      ) : <span />}
      {isLastStep && isComplete ? (
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-3 text-base md:px-7 md:text-lg"
        >
          {loading ? (submittingLabel ?? 'Scoring...') : (submitLabel ?? 'See my bonus plan')}
        </Button>
      ) : hideContinue ? null : (
        <Button
          onClick={onContinue}
          disabled={!canContinue || isLastStep}
          className="px-6 py-3 text-base md:px-7 md:text-lg"
        >
          {continueLabel ?? 'Continue'}
        </Button>
      )}
    </div>
  );
}
