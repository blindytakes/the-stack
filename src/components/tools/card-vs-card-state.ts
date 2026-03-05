'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCardDetail, useCardsDirectory } from '@/lib/cards-client';

export function useCardVsCardState() {
  const searchParams = useSearchParams();
  const initializedFromQuery = useRef(false);
  const [slugA, setSlugA] = useState<string | null>(null);
  const [slugB, setSlugB] = useState<string | null>(null);

  const cardsDirectory = useCardsDirectory(100);
  const detailA = useCardDetail(slugA);
  const detailB = useCardDetail(slugB);

  useEffect(() => {
    if (initializedFromQuery.current) return;
    if (cardsDirectory.loading) return;

    initializedFromQuery.current = true;
    const queryA = searchParams.get('a');
    const queryB = searchParams.get('b');
    const availableSlugs = new Set(cardsDirectory.cards.map((card) => card.slug));

    if (queryA && availableSlugs.has(queryA)) {
      setSlugA(queryA);
    }

    if (queryB && queryB !== queryA && availableSlugs.has(queryB)) {
      setSlugB(queryB);
    }
  }, [cardsDirectory.cards, cardsDirectory.loading, searchParams]);

  return {
    cards: cardsDirectory.cards,
    loadingCards: cardsDirectory.loading,
    cardsError: cardsDirectory.error,
    slugA,
    setSlugA,
    slugB,
    setSlugB,
    detailA,
    detailB
  };
}
