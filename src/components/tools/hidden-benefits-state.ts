'use client';

import { useMemo, useState } from 'react';
import { useCardDetail, useCardsDirectory } from '@/lib/cards-client';

export function useHiddenBenefitsState() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const cardsDirectory = useCardsDirectory(100);
  const cardDetail = useCardDetail(selectedSlug);

  const metrics = useMemo(() => {
    const benefits = cardDetail.card?.benefits ?? [];
    const totalBenefitValue = benefits.reduce(
      (sum, benefit) => sum + (benefit.estimatedValue ?? 0),
      0
    );
    const annualFee = cardDetail.card?.annualFee ?? 0;
    return {
      totalBenefitValue,
      annualFee,
      netValue: totalBenefitValue - annualFee
    };
  }, [cardDetail.card]);

  return {
    selectedSlug,
    setSelectedSlug,
    cards: cardsDirectory.cards,
    loadingCards: cardsDirectory.loading,
    cardsError: cardsDirectory.error,
    cardDetail: cardDetail.card,
    loadingDetail: cardDetail.loading,
    detailError: cardDetail.error,
    metrics
  };
}
