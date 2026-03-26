'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { CardDetail, CardRecord } from '@/lib/cards';

const cardTypeSchema = z.enum(['personal', 'business', 'student', 'secured']);
const rewardTypeSchema = z.enum(['cashback', 'points', 'miles']);
const categorySchema = z.enum([
  'dining',
  'groceries',
  'travel',
  'gas',
  'streaming',
  'online_shopping',
  'entertainment',
  'utilities',
  'all',
  'other'
]);
const creditTierSchema = z.enum(['excellent', 'good', 'fair', 'building']);

const cardRecordSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  cardType: cardTypeSchema,
  rewardType: rewardTypeSchema,
  topCategories: z.array(categorySchema),
  annualFee: z.number().finite(),
  creditTierMin: creditTierSchema,
  headline: z.string().min(1),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  editorRating: z.number().finite().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  offsettingCreditsValue: z.number().finite().default(0),
  totalBenefitsValue: z.number().finite().default(0),
  plannerBenefitsValue: z.number().finite().default(0)
});

const rewardDetailSchema = z.object({
  category: categorySchema,
  rate: z.number().finite(),
  rateType: rewardTypeSchema,
  capAmount: z.number().finite().optional(),
  capPeriod: z.string().optional(),
  isRotating: z.boolean().optional(),
  notes: z.string().optional()
});

const signUpBonusDetailSchema = z.object({
  bonusValue: z.number().finite(),
  bonusType: z.string().min(1),
  displayHeadline: z.string().min(1).optional(),
  displayDescription: z.string().min(1).optional(),
  bonusPoints: z.number().finite().optional(),
  spendRequired: z.number().finite(),
  spendPeriodDays: z.number().int(),
  isCurrentOffer: z.boolean().optional()
});

const benefitDetailSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedValue: z.number().finite().optional(),
  activationMethod: z.string().optional()
});

const transferPartnerDetailSchema = z.object({
  partnerName: z.string().min(1),
  partnerType: z.string().min(1),
  transferRatio: z.number().finite()
});

const cardDetailSchema = cardRecordSchema.extend({
  network: z.string().optional(),
  introApr: z.string().optional(),
  regularAprMin: z.number().finite().optional(),
  regularAprMax: z.number().finite().optional(),
  foreignTxFee: z.number().finite(),
  applyUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  rewards: z.array(rewardDetailSchema),
  signUpBonuses: z.array(signUpBonusDetailSchema),
  benefits: z.array(benefitDetailSchema),
  transferPartners: z.array(transferPartnerDetailSchema)
});

const cardListResponseSchema = z.object({
  results: z.array(cardRecordSchema)
});

const cardDetailResponseSchema = z.object({
  card: cardDetailSchema
});

export async function fetchCardList(limit = 100): Promise<CardRecord[]> {
  const res = await fetch(`/api/cards?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Cards request failed');
  }

  const parsed = cardListResponseSchema.safeParse(await res.json());
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
