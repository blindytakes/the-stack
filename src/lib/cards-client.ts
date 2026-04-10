'use client';

import { useEffect, useState } from 'react';
import {
  cardDetailResponseSchema,
  cardsListResponseSchema,
  type CardDetail,
  type CardRecord
} from '@/lib/cards';

export async function fetchCardList(limit = 100): Promise<CardRecord[]> {
  const res = await fetch(`/api/cards?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Cards request failed');
  }

  const parsed = cardsListResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error('Invalid cards payload');
  }

  return parsed.data.results;
}

export async function fetchCardDetail(slug: string): Promise<CardDetail> {
  const res = await fetch(`/api/cards/${slug}`);
  if (!res.ok) {
    throw new Error('Card detail request failed');
  }

  const parsed = cardDetailResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error('Invalid card detail payload');
  }

  return parsed.data.card;
}

export function useCardsDirectory(limit = 100) {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchCardList(limit)
      .then((results) => {
        if (!cancelled) setCards(results);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load card list.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { cards, loading, error };
}

export function useCardDetail(slug: string | null) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setCard(null);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchCardDetail(slug)
      .then((result) => {
        if (!cancelled) setCard(result);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load card details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { card, loading, error };
}
