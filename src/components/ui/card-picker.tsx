'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardRecord } from '@/lib/cards';

type CardPickerProps = {
  cards: CardRecord[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  placeholder?: string;
  label?: string;
};

export function CardPicker({
  cards,
  selectedSlug,
  onSelect,
  placeholder = 'Search for a card...',
  label
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
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-bg-surface px-4 py-3 text-left text-sm transition hover:border-white/20"
        >
          <span>
            <span className="text-text-muted">{selectedCard.issuer}</span>
            <span className="mx-2 text-white/20">·</span>
            <span className="text-text-primary">{selectedCard.name}</span>
          </span>
          <span className="text-xs text-text-muted">Change</span>
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
          className="w-full rounded-2xl border border-white/10 bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
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
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-bg-elevated shadow-lg"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">No cards found</p>
          ) : (
            filtered.map((card, i) => (
              <button
                key={card.slug}
                type="button"
                role="option"
                aria-selected={i === highlightedIndex}
                onClick={() => handleSelect(card.slug)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  i === highlightedIndex
                    ? 'bg-brand-teal/10 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-surface'
                } ${card.slug === selectedSlug ? 'border-l-2 border-brand-teal' : ''}`}
              >
                <span className="min-w-[80px] text-xs text-text-muted">{card.issuer}</span>
                <span className="text-text-primary">{card.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
