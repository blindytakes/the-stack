'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import { getCardImageDisplay } from '@/lib/card-image-presentation';
import type { CardRecord } from '@/lib/cards';

type CardPickerProps = {
  cards: CardRecord[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  placeholder?: string;
  label?: string;
  tone?: 'neutral' | 'gold' | 'teal';
  size?: 'default' | 'large';
};

const pickerToneClassNames = {
  neutral: {
    button:
      'border-white/10 bg-bg-surface shadow-none hover:border-white/20',
    issuer: 'text-text-muted',
    change: 'text-text-muted',
    input: 'focus:border-brand-teal'
  },
  gold: {
    button:
      'border-brand-gold/25 bg-[linear-gradient(90deg,rgba(245,180,72,0.12),rgba(255,255,255,0.035)_42%,rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(245,180,72,0.14)] hover:border-brand-gold/45',
    issuer: 'text-brand-gold',
    change: 'text-brand-gold',
    input: 'focus:border-brand-gold'
  },
  teal: {
    button:
      'border-brand-teal/25 bg-[linear-gradient(90deg,rgba(45,212,191,0.12),rgba(255,255,255,0.035)_42%,rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(45,212,191,0.14)] hover:border-brand-teal/45',
    issuer: 'text-brand-teal',
    change: 'text-brand-teal',
    input: 'focus:border-brand-teal'
  }
};

const pickerSizeClassNames = {
  default: {
    button: 'px-4 py-3 text-sm',
    input: 'px-4 py-3 text-sm',
    change: 'text-xs',
    dropdown: 'max-h-64 rounded-2xl',
    option: 'gap-3 px-4 py-3 text-sm',
    empty: 'px-4 py-3 text-sm',
    thumbnail: 'h-11 w-[4.35rem] rounded-lg',
    fallbackText: 'text-xs sm:text-xs'
  },
  large: {
    button: 'min-h-[4.35rem] px-5 py-4 text-base',
    input: 'min-h-[4.35rem] px-5 py-4 text-base',
    change: 'text-sm',
    dropdown: 'max-h-[28rem] rounded-[1.25rem]',
    option: 'gap-4 px-5 py-4 text-base',
    empty: 'px-5 py-4 text-base',
    thumbnail: 'h-14 w-[5.6rem] rounded-xl',
    fallbackText: 'text-xs sm:text-sm'
  }
};

function CardPickerThumbnail({
  card,
  sizeClassNames
}: {
  card: CardRecord;
  sizeClassNames: (typeof pickerSizeClassNames)[keyof typeof pickerSizeClassNames];
}) {
  const cardImage = getCardImageDisplay({
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    imageUrl: card.imageUrl,
    imageAssetType: card.imageAssetType
  });
  const imageClassName =
    cardImage.imageAssetType === 'brand_logo'
      ? 'bg-black/10 px-1.5 py-1'
      : cardImage.presentation.imgClassName;
  const imageScale =
    cardImage.imageAssetType === 'brand_logo'
      ? Math.max(cardImage.presentation.scale ?? 1, 1.08)
      : cardImage.presentation.scale;

  return (
    <EntityImage
      src={cardImage.src}
      alt={cardImage.alt}
      label={cardImage.label}
      className={`${sizeClassNames.thumbnail} shrink-0`}
      imgClassName={imageClassName}
      fallbackClassName="bg-black/10"
      fallbackTextClassName={sizeClassNames.fallbackText}
      fallbackVariant={cardImage.fallbackVariant}
      fit={cardImage.presentation.fit}
      position={cardImage.presentation.position}
      scale={imageScale}
    />
  );
}

export function CardPicker({
  cards,
  selectedSlug,
  onSelect,
  placeholder = 'Search for a card...',
  label,
  tone = 'neutral',
  size = 'default'
}: CardPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCard = useMemo(
    () => cards.find((c) => c.slug === selectedSlug) ?? null,
    [cards, selectedSlug]
  );
  const toneClassNames = pickerToneClassNames[tone];
  const sizeClassNames = pickerSizeClassNames[size];

  const filtered = useMemo(() => {
    if (!query.trim()) return cards;
    const q = query.toLowerCase();
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q)
    );
  }, [cards, query]);

  /* Reset highlight when filtered list changes */
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  /* Close on click outside */
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  /* Scroll highlighted item into view */
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          onSelect(filtered[highlightedIndex].slug);
          close();
        }
        break;
    }
  }

  function handleSelect(slug: string) {
    onSelect(slug);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      )}

      {/* Input / display */}
      {selectedCard && !isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={`flex w-full items-center justify-between rounded-2xl border text-left transition ${sizeClassNames.button} ${toneClassNames.button}`}
        >
          <span className="min-w-0 flex-1 truncate pr-4">
            <span className={toneClassNames.issuer}>{selectedCard.issuer}</span>
            <span className="mx-2 text-white/20">·</span>
            <span className="text-text-primary">{selectedCard.name}</span>
          </span>
          <span className={`shrink-0 font-semibold ${sizeClassNames.change} ${toneClassNames.change}`}>Change</span>
        </button>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-white/10 bg-bg-surface text-text-primary placeholder:text-text-muted transition focus:outline-none ${sizeClassNames.input} ${toneClassNames.input}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-y-auto border border-white/10 bg-bg-elevated shadow-lg ${sizeClassNames.dropdown}`}
        >
          {filtered.length === 0 ? (
            <p className={`${sizeClassNames.empty} text-text-muted`}>No cards found</p>
          ) : (
            filtered.map((card, i) => (
              <button
                key={card.slug}
                type="button"
                role="option"
                aria-selected={i === highlightedIndex}
                onClick={() => handleSelect(card.slug)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`flex w-full items-center text-left transition ${sizeClassNames.option} ${
                  i === highlightedIndex
                    ? 'bg-brand-teal/10 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-surface'
                } ${card.slug === selectedSlug ? 'border-l-2 border-brand-teal' : ''}`}
              >
                <CardPickerThumbnail card={card} sizeClassNames={sizeClassNames} />
                <span className="min-w-0">
                  <span className="block text-xs text-text-muted">{card.issuer}</span>
                  <span className="mt-0.5 block truncate text-text-primary">{card.name}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
