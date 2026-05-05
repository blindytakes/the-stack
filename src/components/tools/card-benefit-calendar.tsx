'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import {
  benefitCalendarCards,
  buildBenefitCalendarEvents,
  buildBenefitCalendarIcs,
  type BenefitCalendarCard,
  type BenefitCalendarCardId,
  type BenefitCalendarEvent,
  type BenefitCalendarSettings
} from '@/lib/card-benefit-calendar';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
});

const shortMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short'
});

const categoryLabels: Record<BenefitCalendarEvent['category'], string> = {
  activation: 'Activation',
  benefit: 'Benefit',
  bonus: 'Bonus',
  credit: 'Credit',
  renewal: 'Renewal'
};

const cardThemeStyles: Record<
  BenefitCalendarCardId,
  {
    pageStyle: CSSProperties;
    panelStyle: CSSProperties;
    eyebrowClassName: string;
    cardStyle: CSSProperties;
    browseStyle: CSSProperties;
    inputStyle: CSSProperties;
    exportStyle: CSSProperties;
    exportEyebrowClassName: string;
    exportButtonStyle: CSSProperties;
    accentColor: string;
    accentSoft: string;
    accentBorder: string;
    accentText: string;
  }
> = {
  'amex-platinum': {
    pageStyle: {
      borderColor: 'rgba(214,229,255,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(214,229,255,0.24), transparent 36%), radial-gradient(circle at 86% 18%, rgba(255,255,255,0.12), transparent 34%), linear-gradient(135deg, rgba(31,37,48,0.99), rgba(9,12,21,0.99) 62%, rgba(30,33,40,0.98))'
    },
    panelStyle: { borderColor: 'rgba(214,229,255,0.18)', background: 'rgba(0,0,0,0.26)' },
    eyebrowClassName: 'text-[#d6e5ff]',
    cardStyle: { borderColor: 'rgba(214,229,255,0.4)', background: 'rgba(214,229,255,0.08)' },
    browseStyle: { borderColor: 'rgba(214,229,255,0.24)', background: 'rgba(214,229,255,0.08)' },
    inputStyle: { borderColor: 'rgba(214,229,255,0.18)' },
    exportStyle: { borderColor: 'rgba(214,229,255,0.3)', background: 'rgba(214,229,255,0.08)' },
    exportEyebrowClassName: 'text-[#d6e5ff]',
    exportButtonStyle: { background: '#d6e5ff', color: '#000' },
    accentColor: '#d6e5ff',
    accentSoft: 'rgba(214,229,255,0.16)',
    accentBorder: 'rgba(214,229,255,0.52)',
    accentText: '#d6e5ff'
  },
  'amex-gold': {
    pageStyle: {
      borderColor: 'rgba(212,168,83,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(212,168,83,0.28), transparent 36%), radial-gradient(circle at 86% 18%, rgba(255,234,130,0.14), transparent 34%), linear-gradient(135deg, rgba(36,28,16,0.99), rgba(10,12,19,0.99) 62%, rgba(31,25,16,0.98))'
    },
    panelStyle: { borderColor: 'rgba(212,168,83,0.18)', background: 'rgba(0,0,0,0.24)' },
    eyebrowClassName: 'text-brand-gold',
    cardStyle: { borderColor: 'rgba(212,168,83,0.4)', background: 'rgba(212,168,83,0.09)' },
    browseStyle: { borderColor: 'rgba(212,168,83,0.24)', background: 'rgba(212,168,83,0.08)' },
    inputStyle: { borderColor: 'rgba(212,168,83,0.18)' },
    exportStyle: { borderColor: 'rgba(212,168,83,0.3)', background: 'rgba(212,168,83,0.08)' },
    exportEyebrowClassName: 'text-brand-gold',
    exportButtonStyle: { background: '#D4A853', color: '#000' },
    accentColor: '#D4A853',
    accentSoft: 'rgba(212,168,83,0.16)',
    accentBorder: 'rgba(212,168,83,0.52)',
    accentText: '#D4A853'
  },
  'chase-sapphire-reserve': {
    pageStyle: {
      borderColor: 'rgba(90,224,255,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(90,224,255,0.25), transparent 36%), radial-gradient(circle at 86% 18%, rgba(115,157,255,0.18), transparent 34%), linear-gradient(135deg, rgba(14,28,42,0.99), rgba(7,12,22,0.99) 62%, rgba(16,24,40,0.98))'
    },
    panelStyle: { borderColor: 'rgba(90,224,255,0.18)', background: 'rgba(0,0,0,0.24)' },
    eyebrowClassName: 'text-[#5ae0ff]',
    cardStyle: { borderColor: 'rgba(90,224,255,0.38)', background: 'rgba(90,224,255,0.08)' },
    browseStyle: { borderColor: 'rgba(90,224,255,0.24)', background: 'rgba(90,224,255,0.08)' },
    inputStyle: { borderColor: 'rgba(90,224,255,0.18)' },
    exportStyle: { borderColor: 'rgba(90,224,255,0.3)', background: 'rgba(90,224,255,0.08)' },
    exportEyebrowClassName: 'text-[#5ae0ff]',
    exportButtonStyle: { background: '#5ae0ff', color: '#000' },
    accentColor: '#5ae0ff',
    accentSoft: 'rgba(90,224,255,0.16)',
    accentBorder: 'rgba(90,224,255,0.52)',
    accentText: '#5ae0ff'
  },
  'chase-sapphire-preferred': {
    pageStyle: {
      borderColor: 'rgba(115,157,255,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(115,157,255,0.25), transparent 36%), radial-gradient(circle at 86% 18%, rgba(90,224,255,0.13), transparent 34%), linear-gradient(135deg, rgba(16,25,44,0.99), rgba(8,12,22,0.99) 62%, rgba(18,24,42,0.98))'
    },
    panelStyle: { borderColor: 'rgba(115,157,255,0.18)', background: 'rgba(0,0,0,0.24)' },
    eyebrowClassName: 'text-[#9bb8ff]',
    cardStyle: { borderColor: 'rgba(115,157,255,0.38)', background: 'rgba(115,157,255,0.08)' },
    browseStyle: { borderColor: 'rgba(115,157,255,0.24)', background: 'rgba(115,157,255,0.08)' },
    inputStyle: { borderColor: 'rgba(115,157,255,0.18)' },
    exportStyle: { borderColor: 'rgba(115,157,255,0.3)', background: 'rgba(115,157,255,0.08)' },
    exportEyebrowClassName: 'text-[#9bb8ff]',
    exportButtonStyle: { background: '#9bb8ff', color: '#000' },
    accentColor: '#9bb8ff',
    accentSoft: 'rgba(115,157,255,0.16)',
    accentBorder: 'rgba(115,157,255,0.52)',
    accentText: '#9bb8ff'
  },
  'capital-one-venture-x': {
    pageStyle: {
      borderColor: 'rgba(232,99,74,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(232,99,74,0.28), transparent 36%), radial-gradient(circle at 86% 18%, rgba(255,159,115,0.13), transparent 34%), linear-gradient(135deg, rgba(39,20,20,0.99), rgba(9,12,21,0.99) 62%, rgba(31,19,25,0.98))'
    },
    panelStyle: { borderColor: 'rgba(232,99,74,0.18)', background: 'rgba(0,0,0,0.24)' },
    eyebrowClassName: 'text-brand-coral',
    cardStyle: { borderColor: 'rgba(232,99,74,0.38)', background: 'rgba(232,99,74,0.08)' },
    browseStyle: { borderColor: 'rgba(232,99,74,0.24)', background: 'rgba(232,99,74,0.08)' },
    inputStyle: { borderColor: 'rgba(232,99,74,0.18)' },
    exportStyle: { borderColor: 'rgba(232,99,74,0.3)', background: 'rgba(232,99,74,0.08)' },
    exportEyebrowClassName: 'text-brand-coral',
    exportButtonStyle: { background: '#E8634A', color: '#000' },
    accentColor: '#E8634A',
    accentSoft: 'rgba(232,99,74,0.16)',
    accentBorder: 'rgba(232,99,74,0.52)',
    accentText: '#E8634A'
  },
  'citi-strata-elite': {
    pageStyle: {
      borderColor: 'rgba(122,180,255,0.2)',
      background:
        'radial-gradient(circle at 18% 0%, rgba(122,180,255,0.24), transparent 36%), radial-gradient(circle at 86% 18%, rgba(90,224,255,0.13), transparent 34%), linear-gradient(135deg, rgba(14,26,43,0.99), rgba(8,12,22,0.99) 62%, rgba(16,24,40,0.98))'
    },
    panelStyle: { borderColor: 'rgba(122,180,255,0.18)', background: 'rgba(0,0,0,0.24)' },
    eyebrowClassName: 'text-[#9bc8ff]',
    cardStyle: { borderColor: 'rgba(122,180,255,0.38)', background: 'rgba(122,180,255,0.08)' },
    browseStyle: { borderColor: 'rgba(122,180,255,0.24)', background: 'rgba(122,180,255,0.08)' },
    inputStyle: { borderColor: 'rgba(122,180,255,0.18)' },
    exportStyle: { borderColor: 'rgba(122,180,255,0.3)', background: 'rgba(122,180,255,0.08)' },
    exportEyebrowClassName: 'text-[#9bc8ff]',
    exportButtonStyle: { background: '#9bc8ff', color: '#000' },
    accentColor: '#9bc8ff',
    accentSoft: 'rgba(122,180,255,0.16)',
    accentBorder: 'rgba(122,180,255,0.52)',
    accentText: '#9bc8ff'
  }
};

type CardCalendarTheme = (typeof cardThemeStyles)[BenefitCalendarCardId];

const calendarSelectorGroups: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  cardIds: BenefitCalendarCardId[];
}> = [
  {
    id: 'premium',
    label: 'Premium travel cards',
    description: 'Higher annual fees, richer credit stacks, and more dates worth tracking.',
    cardIds: ['amex-platinum', 'chase-sapphire-reserve', 'capital-one-venture-x', 'citi-strata-elite']
  },
  {
    id: 'core',
    label: 'Lower-fee keepers',
    description: 'Cards with lighter fees but still enough renewal or credit timing to calendar.',
    cardIds: ['amex-gold', 'chase-sapphire-preferred']
  }
];

const calendarWeekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
}

function addMonthsInputValue(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function parseInputDateValue(value: string) {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function formatInputDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addCalendarMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameCalendarDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getCalendarMonthDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = firstDay.getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), index - startOffset + 1);
    return {
      date,
      inputValue: formatInputDateValue(date),
      isCurrentMonth: date.getMonth() === firstDay.getMonth()
    };
  });
}

function groupEventsByMonth(events: BenefitCalendarEvent[]) {
  return events.reduce<Array<{ key: string; label: string; events: BenefitCalendarEvent[] }>>((groups, event) => {
    const key = `${event.startsAt.getFullYear()}-${event.startsAt.getMonth()}`;
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.events.push(event);
      return groups;
    }
    groups.push({ key, label: monthFormatter.format(event.startsAt), events: [event] });
    return groups;
  }, []);
}

function getDateParts(date: Date) {
  return {
    month: shortMonthFormatter.format(date).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0')
  };
}

function slugifyFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ChevronDownIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CalendarIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M7 3v4M17 3v4M4.5 9.25h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CalendarCardSwitcherOption({
  card,
  selected,
  tracked,
  onSelect
}: {
  card: BenefitCalendarCard;
  selected: boolean;
  tracked: boolean;
  onSelect: () => void;
}) {
  const theme = cardThemeStyles[card.id];

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-[1.05rem] border px-3 py-3 text-left transition focus-visible:outline-none ${
        selected
          ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
          : 'border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.055]'
      }`}
      style={
        selected
          ? {
              borderColor: theme.accentBorder,
              background: `linear-gradient(180deg, ${theme.accentSoft}, rgba(255,255,255,0.035))`
            }
          : undefined
      }
    >
      <div className="relative flex h-14 w-[4.6rem] shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] bg-black/10 sm:h-16 sm:w-[5.8rem]">
        <div
          className="absolute inset-x-3 bottom-2 h-7 rounded-full opacity-80 blur-[20px]"
          style={{ background: theme.accentSoft }}
        />
        <EntityImage
          src={card.artUrl}
          alt={`${card.name} card art`}
          label={card.shortName}
          className="relative aspect-[1.62/1] w-full max-w-[4.25rem] overflow-visible rounded-none border-0 bg-transparent sm:max-w-[5.35rem]"
          imgClassName="bg-transparent p-0 drop-shadow-[0_12px_22px_rgba(0,0,0,0.36)]"
          fallbackClassName="bg-black/10"
          fit="contain"
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="min-w-0 break-words text-[15px] font-semibold leading-5 text-text-primary sm:truncate">
            {card.shortName}
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-text-secondary">
            {currencyFormatter.format(card.annualFee)}
          </span>
        </span>
        <span className="mt-1 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span
            className={`truncate text-[10px] font-semibold uppercase tracking-[0.18em] ${
              selected ? theme.eyebrowClassName : 'text-text-muted'
            }`}
          >
            {card.issuer}
          </span>
          {selected || tracked ? (
            <span
              className={`flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                selected ? theme.eyebrowClassName : 'text-text-muted'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accentColor }} />
              {selected ? 'Active' : 'Tracked'}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function HeaderCardSelectorPanel({
  activeCard,
  activeCardSettings,
  activeTheme,
  selectedCardIds,
  selectorOpen,
  selectorRef,
  onAnniversaryDateChange,
  onSelectCard,
  onToggleSelector
}: {
  activeCard: BenefitCalendarCard | null;
  activeCardSettings: BenefitCalendarSettings | null;
  activeTheme: CardCalendarTheme;
  selectedCardIds: BenefitCalendarCardId[];
  selectorOpen: boolean;
  selectorRef: RefObject<HTMLDivElement | null>;
  onAnniversaryDateChange: (cardId: BenefitCalendarCardId, value: string) => void;
  onSelectCard: (cardId: BenefitCalendarCardId) => void;
  onToggleSelector: () => void;
}) {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const selectedDate = parseInputDateValue(activeCardSettings?.anniversaryDate ?? '') ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(selectedDate));
  const calendarDays = useMemo(() => getCalendarMonthDays(visibleMonth), [visibleMonth]);
  const todayDate = new Date();
  const annualFeeDateLabelId = activeCard ? `annual-fee-date-${activeCard.id}` : 'annual-fee-date';

  useEffect(() => {
    setDatePickerOpen(false);
  }, [activeCard?.id]);

  useEffect(() => {
    if (!datePickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setDatePickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDatePickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [datePickerOpen]);

  const handleSelectorToggle = () => {
    setDatePickerOpen(false);
    onToggleSelector();
  };

  const toggleDatePicker = () => {
    if (!datePickerOpen) {
      setVisibleMonth(getMonthStart(selectedDate));
      if (selectorOpen) {
        onToggleSelector();
      }
    }

    setDatePickerOpen((open) => !open);
  };

  const selectDate = (date: Date) => {
    if (!activeCard) return;

    onAnniversaryDateChange(activeCard.id, formatInputDateValue(date));
    setVisibleMonth(getMonthStart(date));
    setDatePickerOpen(false);
  };

  return (
    <div
      ref={selectorRef}
      className="relative z-20 flex h-full min-w-0 flex-col overflow-visible rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:p-5"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div
        className="pointer-events-none absolute -right-10 top-8 h-28 w-28 opacity-70 blur-[46px]"
        style={{ background: activeTheme.accentSoft }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.55rem] font-semibold leading-tight text-text-primary">
            {activeCard?.shortName ?? 'Choose a card'}
          </h2>
          {activeCard ? (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              {activeCard.issuer} - {currencyFormatter.format(activeCard.annualFee)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={selectorOpen}
          aria-label={
            activeCard
              ? `Browse supported cards, currently ${activeCard.shortName}`
              : 'Browse supported cards'
          }
          onClick={handleSelectorToggle}
          className="group flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:self-auto"
          style={{
            borderColor: activeTheme.accentBorder,
            background: activeTheme.accentSoft,
            color: activeTheme.accentText
          }}
        >
          Browse cards
          <span className={`transition ${selectorOpen ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </span>
        </button>
      </div>

      <div className="relative mt-5 flex flex-1 overflow-hidden rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,13,22,0.62),rgba(255,255,255,0.03))] px-7 py-8 md:py-10">
        <div className="pointer-events-none absolute inset-x-8 bottom-8 h-12 rounded-full bg-black/30 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-x-8 bottom-8 h-11 rounded-full opacity-80 blur-[30px]"
          style={{ background: activeTheme.accentSoft }}
        />
        <button
          type="button"
          aria-label={
            activeCard
              ? `Open supported card selector from ${activeCard.shortName} card art`
              : 'Open supported card selector'
          }
          onClick={handleSelectorToggle}
          className="group relative flex min-h-[12.5rem] w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {activeCard ? (
            <EntityImage
              src={activeCard.artUrl}
              alt={`${activeCard.name} card art`}
              label={activeCard.shortName}
              className="relative aspect-[1.62/1] w-full max-w-[24rem] overflow-visible rounded-none border-0 bg-transparent"
              imgClassName="bg-transparent p-0 drop-shadow-[0_24px_38px_rgba(0,0,0,0.42)] transition duration-300 group-hover:-translate-y-1"
              fallbackClassName="bg-black/10"
              fit="contain"
            />
          ) : (
            <span className="text-sm font-semibold text-text-secondary">Choose a supported card</span>
          )}
        </button>
      </div>

      {activeCard && activeCardSettings ? (
        <div className="mt-3 rounded-[1rem] border p-4" style={activeTheme.cardStyle}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_15.5rem] sm:items-center">
            <span>
              <span
                id={annualFeeDateLabelId}
                className="block text-[13px] font-semibold uppercase tracking-[0.18em] text-text-muted"
              >
                Annual fee date
              </span>
            </span>
            <div ref={datePickerRef} className="relative">
              <button
                type="button"
                aria-labelledby={annualFeeDateLabelId}
                aria-haspopup="dialog"
                aria-expanded={datePickerOpen}
                onClick={toggleDatePicker}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[0.95rem] border bg-black/25 px-5 py-3 text-left text-lg font-semibold text-text-primary outline-none transition hover:bg-black/30 focus:border-white focus-visible:ring-2 focus-visible:ring-white/25"
                style={activeTheme.inputStyle}
              >
                <span>{dateFormatter.format(selectedDate)}</span>
                <CalendarIcon className="h-5 w-5 shrink-0 text-text-secondary" />
              </button>

              {datePickerOpen ? (
                <div
                  role="dialog"
                  aria-label="Choose annual fee date"
                  className="absolute left-1/2 top-[calc(100%+0.65rem)] z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(18,24,36,0.99),rgba(8,12,20,0.995))] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.5)] sm:left-auto sm:right-0 sm:translate-x-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => setVisibleMonth((month) => addCalendarMonths(month, -1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-text-primary transition hover:border-white/20"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <p className="text-base font-semibold text-text-primary">
                      {monthFormatter.format(visibleMonth)}
                    </p>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => setVisibleMonth((month) => addCalendarMonths(month, 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-text-primary transition hover:border-white/20"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {calendarWeekdayLabels.map((label) => (
                      <p
                        key={label}
                        className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted"
                      >
                        {label}
                      </p>
                    ))}
                    {calendarDays.map(({ date, inputValue, isCurrentMonth }) => {
                      const selected = isSameCalendarDay(date, selectedDate);
                      const today = isSameCalendarDay(date, todayDate);

                      return (
                        <button
                          key={inputValue}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectDate(date)}
                          className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${
                            selected
                              ? 'border-transparent'
                              : today
                                ? 'bg-white/[0.035]'
                                : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]'
                          } ${isCurrentMonth ? 'text-text-primary' : 'text-text-muted/55'}`}
                          style={
                            selected
                              ? {
                                  ...activeTheme.exportButtonStyle,
                                  boxShadow: `0 0 22px ${activeTheme.accentSoft}`
                                }
                              : today
                                ? {
                                    borderColor: activeTheme.accentBorder,
                                    color: activeTheme.accentText
                                  }
                                : undefined
                          }
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => selectDate(new Date())}
                      className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-text-primary transition hover:border-white/24"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatePickerOpen(false)}
                      className="rounded-full px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                      style={activeTheme.exportButtonStyle}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectorOpen ? (
        <div
          role="listbox"
          aria-label="Browse supported cards"
          className="absolute left-4 right-4 top-[4.75rem] z-50 max-h-[min(34rem,calc(100vh-8rem))] overflow-y-auto rounded-[1.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,35,0.99),rgba(8,12,20,0.995))] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.44)] md:left-5 md:right-5 md:top-[5rem]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
          <div className="relative space-y-4">
            {calendarSelectorGroups.map((group) => (
              <div key={group.id}>
                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                  {group.label}
                </p>
                <p className="mt-1 px-1 text-[12px] leading-5 text-text-muted">{group.description}</p>
                <div className="mt-2 space-y-2">
                  {group.cardIds.map((cardId) => {
                    const card = benefitCalendarCards.find((candidate) => candidate.id === cardId);

                    if (!card) return null;

                    return (
                      <CalendarCardSwitcherOption
                        key={card.id}
                        card={card}
                        selected={card.id === activeCard?.id}
                        tracked={selectedCardIds.includes(card.id)}
                        onSelect={() => onSelectCard(card.id)}
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

export function CardBenefitCalendar() {
  const defaultDate = todayInputValue();
  const selectorRef = useRef<HTMLDivElement>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<BenefitCalendarCardId[]>([
    'amex-platinum',
    'chase-sapphire-reserve',
    'capital-one-venture-x'
  ]);
  const [activeCardId, setActiveCardId] = useState<BenefitCalendarCardId>('amex-platinum');
  const [settingsByCardId, setSettingsByCardId] = useState<
    Partial<Record<BenefitCalendarCardId, BenefitCalendarSettings>>
  >(() =>
    Object.fromEntries(
      benefitCalendarCards.map((card, index) => [
        card.id,
        {
          anniversaryDate: addMonthsInputValue(index % 4),
          bonusStartDate: ''
        }
      ])
    )
  );

  const events = useMemo(
    () =>
      buildBenefitCalendarEvents({
        selectedCardIds,
        settingsByCardId,
        months: 12
      }),
    [selectedCardIds, settingsByCardId]
  );

  const selectedCards = benefitCalendarCards.filter((card) => selectedCardIds.includes(card.id));
  const activeCard =
    selectedCards.find((card) => card.id === activeCardId) ?? selectedCards[0] ?? null;
  const activeCardSettings = activeCard
    ? settingsByCardId[activeCard.id] ?? { anniversaryDate: defaultDate, bonusStartDate: '' }
    : null;
  const visibleEvents = useMemo(
    () => (activeCard ? events.filter((event) => event.cardId === activeCard.id) : []),
    [activeCard, events]
  );
  const groupedEvents = useMemo(() => groupEventsByMonth(visibleEvents), [visibleEvents]);
  const nextUpEvents = visibleEvents.slice(0, 4);
  const totalTrackedValue = visibleEvents.reduce((sum, event) => sum + (event.value ?? 0), 0);
  const activeTheme = cardThemeStyles[activeCard?.id ?? 'amex-platinum'];

  useEffect(() => {
    if (!selectorOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setSelectorOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectorOpen]);

  useEffect(() => {
    if (selectedCardIds.length === 0) return;
    if (!selectedCardIds.includes(activeCardId)) {
      setActiveCardId(selectedCardIds[0]);
    }
  }, [activeCardId, selectedCardIds]);

  const selectCard = (cardId: BenefitCalendarCardId) => {
    setSelectedCardIds((current) => (current.includes(cardId) ? current : [...current, cardId]));
    setActiveCardId(cardId);
    setSelectorOpen(false);
  };

  const updateCardSettings = (
    cardId: BenefitCalendarCardId,
    key: keyof BenefitCalendarSettings,
    value: string
  ) => {
    setSettingsByCardId((current) => ({
      ...current,
      [cardId]: {
        anniversaryDate: current[cardId]?.anniversaryDate ?? defaultDate,
        bonusStartDate: current[cardId]?.bonusStartDate ?? '',
        [key]: value
      }
    }));
  };

  const downloadIcs = () => {
    const ics = buildBenefitCalendarIcs(visibleEvents);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeCard
      ? `the-stack-${slugifyFilePart(activeCard.shortName)}-benefit-calendar.ics`
      : 'the-stack-card-benefit-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-16">
      <section
        className="relative overflow-visible rounded-[1.5rem] border p-4 shadow-[0_28px_90px_rgba(0,0,0,0.32)] md:p-6"
        style={activeTheme.pageStyle}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.24),transparent)]" />
        <div className="relative grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <div className="relative flex h-full min-w-0 flex-col rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${activeTheme.eyebrowClassName}`}>
                Premium Card Reminder Calendar
              </p>
              <h1 className="mt-3 max-w-[54rem] font-heading text-[2.35rem] leading-[0.96] text-text-primary md:text-[3.2rem] 2xl:text-[3.45rem]">
                Keep every card benefit on schedule
              </h1>
              <p className="mt-3 max-w-[47rem] text-sm leading-6 text-text-secondary md:text-base md:leading-7">
                Track credits, activation windows, annual fees, and renewal decisions for the cards you carry. Export the next 12 months to your calendar.
              </p>
            </div>

            <div
              className="mt-4 overflow-hidden rounded-[1.2rem] border p-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]"
              style={activeTheme.exportStyle}
            >
              <div className="px-2 pt-2">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${activeTheme.exportEyebrowClassName}`}>
                  Calendar export
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-[0.9rem] border border-white/10 bg-black/16 px-4 py-4 text-center">
                  <p className="text-[2rem] font-semibold leading-none text-text-primary">{visibleEvents.length}</p>
                  <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Reminders
                  </p>
                </div>
                <div className="rounded-[0.9rem] border border-white/10 bg-black/16 px-4 py-4 text-center">
                  <p className="text-[2rem] font-semibold leading-none text-text-primary">
                    {currencyFormatter.format(totalTrackedValue)}
                  </p>
                  <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Value
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={downloadIcs}
                  disabled={visibleEvents.length === 0}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={activeTheme.exportButtonStyle}
                >
                  Download .ics
                </button>
                <a
                  href="https://calendar.google.com/calendar/u/0/r/settings/export"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/14 px-4 py-2.5 text-center text-sm font-semibold text-text-primary transition hover:border-white/28"
                >
                  Google import
                </a>
              </div>
            </div>

            {!activeCard ? (
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="mt-4 min-h-28 w-full rounded-xl border border-dashed border-brand-teal/35 bg-brand-teal/[0.06] p-5 text-left transition hover:bg-brand-teal/[0.1]"
              >
                <span className="text-lg font-semibold text-text-primary">Choose your first card</span>
                <span className="mt-2 block text-sm leading-6 text-text-secondary">
                  Add a card to build the reminder schedule.
                </span>
              </button>
            ) : null}
          </div>

          <HeaderCardSelectorPanel
            activeCard={activeCard}
            activeCardSettings={activeCardSettings}
            activeTheme={activeTheme}
            selectedCardIds={selectedCardIds}
            selectorOpen={selectorOpen}
            selectorRef={selectorRef}
            onAnniversaryDateChange={(cardId, value) =>
              updateCardSettings(cardId, 'anniversaryDate', value)
            }
            onSelectCard={selectCard}
            onToggleSelector={() => setSelectorOpen((open) => !open)}
          />
        </div>

      </section>

      <section>
        <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.98),rgba(12,15,25,0.99))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">Schedule</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">Action timeline</h2>
            </div>
            <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-text-secondary">
              Next 12 months
            </p>
          </div>

          {nextUpEvents.length > 0 ? (
            <div
              className="mt-5 rounded-xl border p-4"
              style={{
                borderColor: activeTheme.accentBorder,
                background: `linear-gradient(135deg, ${activeTheme.accentSoft}, rgba(255,255,255,0.035))`
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: activeTheme.accentText }}
                >
                  Next up
                </p>
                <p className="text-xs font-semibold text-text-muted">{nextUpEvents.length} soonest</p>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                {nextUpEvents.map((event) => {
                  const dateParts = getDateParts(event.startsAt);
                  return (
                    <article
                      key={`next-${event.id}`}
                      className="rounded-lg border border-white/10 bg-black/18 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-md border border-white/10 bg-black/24 px-2.5 py-2 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                            {dateParts.month}
                          </p>
                          <p className="mt-1 text-2xl font-semibold leading-none text-text-primary">{dateParts.day}</p>
                        </div>
                        {typeof event.value === 'number' ? (
                          <p
                            className="rounded-full border px-3 py-1 text-base font-bold"
                            style={{
                              borderColor: activeTheme.accentBorder,
                              background: activeTheme.accentSoft,
                              color: activeTheme.accentText,
                              boxShadow: `0 0 22px ${activeTheme.accentSoft}`
                            }}
                          >
                            {currencyFormatter.format(event.value)}
                          </p>
                        ) : (
                          <span
                            className="mt-1 h-2.5 w-2.5 rounded-full"
                            style={{ background: activeTheme.accentColor }}
                          />
                        )}
                      </div>
                      <p className="mt-3 text-base font-semibold leading-6 text-text-primary">{event.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">{event.cardName}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-5 max-h-[64rem] space-y-6 overflow-auto pr-1">
            {groupedEvents.map((group) => (
              <div key={group.key}>
                <h3 className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(13,17,28,0.98)] py-3 text-lg font-semibold text-text-primary backdrop-blur">
                  {group.label}
                </h3>
                <div className="mt-4 space-y-3">
                  {group.events.map((event) => {
                    const dateParts = getDateParts(event.startsAt);
                    return (
                      <article
                        key={event.id}
                        className="grid gap-4 rounded-xl border border-l-4 border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.04] md:grid-cols-[5.4rem_1fr_auto] md:items-center md:p-5"
                        style={{
                          borderLeftColor: activeTheme.accentColor,
                          boxShadow: `inset 3px 0 18px -12px ${activeTheme.accentColor}`
                        }}
                      >
                        <div className="flex items-center gap-3 md:block md:text-center">
                          <div className="w-16 rounded-lg border border-white/10 bg-black/18 px-2.5 py-2 md:mx-auto">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                              {dateParts.month}
                            </p>
                            <p className="mt-1 text-3xl font-semibold leading-none text-text-primary">{dateParts.day}</p>
                          </div>
                          <span
                            className="h-3 w-3 rounded-full md:mx-auto md:mt-3 md:block"
                            style={{ background: activeTheme.accentColor }}
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                              {categoryLabels[event.category]}
                            </span>
                            <span className="text-xs uppercase tracking-[0.16em] text-text-muted">
                              {event.cardName} - {dateFormatter.format(event.startsAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-lg font-semibold leading-7 text-text-primary md:text-xl">
                            {event.title}
                          </p>
                          <p className="mt-2 max-w-3xl text-base leading-7 text-text-secondary">
                            {event.description}
                          </p>
                        </div>

                        <div className="md:min-w-28 md:text-right">
                          {typeof event.value === 'number' ? (
                            <>
                              <p
                                className="inline-flex rounded-full border px-4 py-2 text-xl font-bold"
                                style={{
                                  borderColor: activeTheme.accentBorder,
                                  background: activeTheme.accentSoft,
                                  color: activeTheme.accentText,
                                  boxShadow: `0 0 22px ${activeTheme.accentSoft}`
                                }}
                              >
                                {currencyFormatter.format(event.value)}
                              </p>
                            </>
                          ) : (
                            <p className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary">
                              Action
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
            {visibleEvents.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-text-secondary">
                No reminders yet. Select cards and add dates to preview the calendar.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
