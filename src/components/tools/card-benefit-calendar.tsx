'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import {
  benefitCalendarCards,
  buildBenefitCalendarEvents,
  buildBenefitCalendarIcs,
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

export function CardBenefitCalendar() {
  const defaultDate = todayInputValue();
  const selectorRef = useRef<HTMLDivElement>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [cardQuery, setCardQuery] = useState('');
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
  const availableCards = benefitCalendarCards.filter((card) => card.id !== activeCardId);
  const filteredAvailableCards = availableCards.filter((card) =>
    `${card.name} ${card.shortName} ${card.issuer}`.toLowerCase().includes(cardQuery.trim().toLowerCase())
  );
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
        setCardQuery('');
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectorOpen(false);
        setCardQuery('');
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

  const addCard = (cardId: BenefitCalendarCardId) => {
    setSelectedCardIds((current) => (current.includes(cardId) ? current : [...current, cardId]));
    setActiveCardId(cardId);
    setSelectorOpen(false);
    setCardQuery('');
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
        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div
            ref={selectorRef}
            className="relative z-20 rounded-[1.15rem] border p-4 backdrop-blur md:p-5"
            style={activeTheme.panelStyle}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${activeTheme.eyebrowClassName}`}>
                  Card Benefit Calendar
                </p>
                <h1 className="mt-3 font-heading text-[clamp(1.9rem,3.2vw,3.1rem)] leading-[0.96] text-text-primary lg:whitespace-nowrap">
                  Pick the cards you carry.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
                  Then export a calendar for credits, annual fees, and renewal decisions.
                </p>
              </div>
            </div>

            <div className="mt-5">
              {activeCard && activeCardSettings ? (
                <article
                  className="relative overflow-hidden rounded-xl border p-3"
                  style={activeTheme.cardStyle}
                >
                  <div className="grid items-center gap-5 md:grid-cols-[13.5rem_1fr]">
                    <div className="relative flex items-center justify-center py-3">
                      {/* Product art is issuer-hosted card imagery from curated card metadata. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeCard.artUrl}
                        alt={`${activeCard.shortName} card art`}
                        className="w-full max-w-[14rem] object-contain drop-shadow-[0_18px_38px_rgba(0,0,0,0.42)] md:max-w-[13.5rem]"
                      />
                    </div>
                    <div>
                      <p className="whitespace-nowrap text-[clamp(1.35rem,6.2vw,1.875rem)] font-semibold text-text-primary">
                        {activeCard.shortName}
                      </p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-text-muted md:text-base">
                        {activeCard.issuer} - {currencyFormatter.format(activeCard.annualFee)}
                      </p>
                      <div className="mt-5">
                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted md:text-sm">
                            Card anniversary / annual fee date
                          </span>
                          <input
                            type="date"
                            value={activeCardSettings.anniversaryDate}
                            onChange={(event) =>
                              updateCardSettings(activeCard.id, 'anniversaryDate', event.currentTarget.value)
                            }
                            className="mt-2 w-full rounded-xl border bg-black/25 px-4 py-3 text-base text-text-primary outline-none focus:border-white md:text-lg"
                            style={activeTheme.inputStyle}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </article>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectorOpen(true)}
                  className="min-h-48 w-full rounded-xl border border-dashed border-brand-teal/35 bg-brand-teal/[0.06] p-5 text-left transition hover:bg-brand-teal/[0.1]"
                >
                  <span className="text-lg font-semibold text-text-primary">Choose your first card</span>
                  <span className="mt-2 block text-sm leading-6 text-text-secondary">
                    Add a card to build the reminder schedule.
                  </span>
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {availableCards.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectorOpen((open) => !open)}
                  className="rounded-full border px-4 py-2 text-sm font-semibold text-text-primary transition hover:opacity-90"
                  style={activeTheme.browseStyle}
                >
                  Browse supported cards
                </button>
              ) : null}
            </div>

            {selectorOpen ? (
              <div className="absolute left-4 right-4 top-[calc(100%-0.75rem)] z-40 rounded-xl border border-white/14 bg-[linear-gradient(180deg,rgba(22,28,42,0.99),rgba(11,15,25,0.99))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.48)] md:left-5 md:right-5">
                <input
                  type="text"
                  value={cardQuery}
                  onChange={(event) => setCardQuery(event.currentTarget.value)}
                  placeholder="Search by card or issuer"
                  autoFocus
                  className="w-full rounded-lg border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-white"
                  style={activeTheme.inputStyle}
                />
                <div role="listbox" className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredAvailableCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      role="option"
                      onClick={() => addCard(card.id)}
                      className="grid grid-cols-[5.2rem_1fr] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.07]"
                    >
                      <EntityImage
                        src={card.artUrl}
                        alt={`${card.shortName} card art`}
                        label={card.shortName}
                        className="h-14 rounded-md bg-black/18"
                        imgClassName="p-1.5"
                        fit="contain"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-text-primary">{card.shortName}</span>
                        <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-text-muted">
                          {card.issuer} - {currencyFormatter.format(card.annualFee)}
                        </span>
                      </span>
                    </button>
                  ))}
                  {filteredAvailableCards.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-sm text-text-muted">
                      No supported cards matched that search.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="flex h-full flex-col gap-4 rounded-[1.15rem] border border-white/12 bg-white/[0.055] p-4 backdrop-blur md:p-5">
            <div className="flex flex-1 flex-col rounded-xl border p-4" style={activeTheme.exportStyle}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${activeTheme.exportEyebrowClassName}`}>
                Calendar export
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg border border-white/10 bg-black/16 p-4 text-center">
                  <p className="text-3xl font-semibold text-text-primary">{visibleEvents.length}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">Benefit reminders</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/16 p-4 text-center">
                  <p className="text-3xl font-semibold text-text-primary">{currencyFormatter.format(totalTrackedValue)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">Tracked value</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-secondary">
                Download one file for Apple Calendar, Outlook, or Google Calendar import.
              </p>
              <div className="flex-1" />
              <button
                type="button"
                onClick={downloadIcs}
                disabled={visibleEvents.length === 0}
                className="mt-4 w-full rounded-full px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={activeTheme.exportButtonStyle}
              >
                Download .ics
              </button>
              <a
                href="https://calendar.google.com/calendar/u/0/r/settings/export"
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-full border border-white/14 px-5 py-2.5 text-center text-sm font-semibold text-text-primary transition hover:border-white/28"
              >
                Open Google Calendar import
              </a>
            </div>
          </aside>
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
