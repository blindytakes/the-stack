import { z } from 'zod';

export const spendingCategoryValues = [
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
] as const;
export const cardTypeValues = ['personal', 'business', 'student', 'secured'] as const;
export const rewardTypeValues = ['cashback', 'points', 'miles'] as const;
export const creditTierValues = ['excellent', 'good', 'fair', 'building'] as const;
export const cardImageAssetTypes = ['card_art', 'brand_logo', 'text_fallback'] as const;

export const spendingCategorySchema = z.enum(spendingCategoryValues);
export const cardTypeSchema = z.enum(cardTypeValues);
export const rewardTypeSchema = z.enum(rewardTypeValues);
export const creditTierSchema = z.enum(creditTierValues);
export const cardImageAssetTypeSchema = z.enum(cardImageAssetTypes);
export const cardImageUrlSchema = z.string().trim().min(1).refine((value) => {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Image URL must be an absolute http(s) URL or a root-relative asset path');

export const cardRecordSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  imageUrl: cardImageUrlSchema.optional(),
  imageAssetType: cardImageAssetTypeSchema,
  cardType: cardTypeSchema,
  rewardType: rewardTypeSchema,
  topCategories: z.array(spendingCategorySchema),
  annualFee: z.number().finite(),
  foreignTxFee: z.number().finite().optional(),
  creditTierMin: creditTierSchema,
  headline: z.string().min(1),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  lastVerified: z.string().datetime().optional(),
  editorRating: z.number().finite().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  bestSignUpBonusValue: z.number().finite().optional(),
  bestSignUpBonusSpendRequired: z.number().finite().optional(),
  bestSignUpBonusSpendPeriodDays: z.number().int().positive().optional(),
  offsettingCreditsValue: z.number().finite().default(0),
  totalBenefitsValue: z.number().finite().default(0),
  plannerBenefitsValue: z.number().finite().default(0)
});

export const rewardDetailSchema = z.object({
  category: spendingCategorySchema,
  rate: z.number().finite(),
  rateType: rewardTypeSchema,
  capAmount: z.number().finite().optional(),
  capPeriod: z.string().optional(),
  isRotating: z.boolean().optional(),
  notes: z.string().optional()
});

export const signUpBonusDetailSchema = z.object({
  bonusValue: z.number().finite(),
  bonusType: z.string().min(1),
  displayHeadline: z.string().min(1).optional(),
  displayDescription: z.string().min(1).optional(),
  bonusPoints: z.number().finite().optional(),
  spendRequired: z.number().finite(),
  spendPeriodDays: z.number().int(),
  isCurrentOffer: z.boolean().optional()
});

export const benefitDetailSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedValue: z.number().finite().optional(),
  activationMethod: z.string().optional()
});

export const transferPartnerDetailSchema = z.object({
  partnerName: z.string().min(1),
  partnerType: z.string().min(1),
  transferRatio: z.number().finite()
});

export const cardDetailSchema = cardRecordSchema.extend({
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

export const cardsPaginationSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0)
});

export const cardsListResponseSchema = z.object({
  results: z.array(cardRecordSchema),
  pagination: cardsPaginationSchema
});

export const cardDetailResponseSchema = z.object({
  card: cardDetailSchema
});

type CardRecordTransport = z.infer<typeof cardRecordSchema>;
type CardDetailTransport = z.infer<typeof cardDetailSchema>;

export type SpendingCategoryValue = z.infer<typeof spendingCategorySchema>;
export type CardTypeValue = z.infer<typeof cardTypeSchema>;
export type RewardTypeValue = z.infer<typeof rewardTypeSchema>;
export type CreditTierValue = z.infer<typeof creditTierSchema>;
export type CardImageAssetType = z.infer<typeof cardImageAssetTypeSchema>;
export type CardRecord = Omit<CardRecordTransport, 'offsettingCreditsValue'> & {
  offsettingCreditsValue?: number;
};
export type RewardDetail = z.infer<typeof rewardDetailSchema>;
export type SignUpBonusDetail = z.infer<typeof signUpBonusDetailSchema>;
export type BenefitDetail = z.infer<typeof benefitDetailSchema>;
export type TransferPartnerDetail = z.infer<typeof transferPartnerDetailSchema>;
export type CardDetail = Omit<CardDetailTransport, 'offsettingCreditsValue'> & {
  offsettingCreditsValue?: number;
};
export type CardsListResponse = z.infer<typeof cardsListResponseSchema>;
export type CardDetailResponse = z.infer<typeof cardDetailResponseSchema>;

export const cardsQuerySchema = z.object({
  issuer: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CardsQuery = z.infer<typeof cardsQuerySchema>;
