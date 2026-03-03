'use client';

import { motion } from 'framer-motion';
import { CardPicker } from '@/components/ui/card-picker';
import {
  BenefitCard,
  HiddenBenefitsDetailSkeleton,
  NoBenefitsState,
  ValueSummaryBar
} from '@/components/tools/hidden-benefits-sections';
import { useHiddenBenefitsState } from '@/components/tools/hidden-benefits-state';

export function HiddenBenefitsTool() {
  const {
    selectedSlug,
    setSelectedSlug,
    cards,
    loadingCards,
    cardsError,
    cardDetail,
    loadingDetail,
    detailError,
    metrics
  } = useHiddenBenefitsState();

  const error = cardsError || detailError;

  return (
    <section className="rounded-3xl border border-white/10 bg-bg-elevated p-6 md:p-10">
      {loadingCards ? (
        <div className="h-12 animate-pulse rounded-2xl bg-bg-surface" />
      ) : (
        <CardPicker
          cards={cards}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          placeholder="Search for your card..."
        />
      )}

      {error && <p className="mt-6 text-sm text-brand-coral">{error}</p>}

      {loadingDetail && <HiddenBenefitsDetailSkeleton />}

      {cardDetail && !loadingDetail && cardDetail.benefits.length === 0 && (
        <NoBenefitsState cardName={cardDetail.name} />
      )}

      {cardDetail && !loadingDetail && cardDetail.benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <ValueSummaryBar
            totalValue={metrics.totalBenefitValue}
            annualFee={metrics.annualFee}
            netValue={metrics.netValue}
          />

          <div className="mt-6 space-y-3">
            {cardDetail.benefits.map((benefit, i) => (
              <BenefitCard key={i} benefit={benefit} />
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
