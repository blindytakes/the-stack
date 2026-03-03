'use client';

import { useState } from 'react';
import { useCardDetail, useCardsDirectory } from '@/lib/cards-client';

export function useCardVsCardState() {
  const [slugA, setSlugA] = useState<string | null>(null);
  const [slugB, setSlugB] = useState<string | null>(null);

  const cardsDirectory = useCardsDirectory(100);
  const detailA = useCardDetail(slugA);
  const detailB = useCardDetail(slugB);

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
