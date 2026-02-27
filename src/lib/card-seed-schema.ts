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

export const spendingCategorySchema = z.enum(spendingCategoryValues);

export type SpendingCategoryValue = z.infer<typeof spendingCategorySchema>;

const rewardStructureSchema = z.object({
  category: spendingCategorySchema,
  rate: z.number(),
  rateType: z.enum(['cashback', 'points', 'miles']),
  capAmount: z.number().optional(),
  capPeriod: z.string().optional(),
  isRotating: z.boolean().optional(),
  rotationQuarter: z.number().int().min(1).max(4).optional(),
  notes: z.string().optional()
});

const signUpBonusSchema = z.object({
  bonusValue: z.number(),
  bonusType: z.string(),
  bonusPoints: z.number().int().optional(),
  spendRequired: z.number(),
  spendPeriodDays: z.number().int().positive(),
  isCurrentOffer: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

const benefitSchema = z.object({
  category: z.string(),
  name: z.string(),
  description: z.string(),
  estimatedValue: z.number().optional(),
  activationMethod: z.string().optional(),
  finePrint: z.string().optional()
});

const transferPartnerSchema = z.object({
  partnerName: z.string(),
  partnerType: z.string(),
  transferRatio: z.number().optional(),
  bonusMultiplier: z.number().optional(),
  bonusExpiresAt: z.string().datetime().optional()
});

export const cardSeedRecordSchema = z.object({
  slug: z.string(),
  name: z.string(),
  issuer: z.string(),
  cardType: z.enum(['personal', 'business', 'student', 'secured']).optional(),
  rewardType: z.enum(['cashback', 'points', 'miles']),
  topCategories: z.array(spendingCategorySchema),
  annualFee: z.number(),
  creditTierMin: z.enum(['excellent', 'good', 'fair', 'building']),
  headline: z.string(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  editorRating: z.number().min(0).max(5).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  network: z.enum(['visa', 'mastercard', 'amex', 'discover']).optional(),
  introApr: z.string().optional(),
  regularAprMin: z.number().optional(),
  regularAprMax: z.number().optional(),
  foreignTxFee: z.number().optional(),
  imageUrl: z.string().url().optional(),
  applyUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  lastVerified: z.string().datetime().optional(),
  rewards: z.array(rewardStructureSchema).optional(),
  signUpBonuses: z.array(signUpBonusSchema).optional(),
  benefits: z.array(benefitSchema).optional(),
  transferPartners: z.array(transferPartnerSchema).optional()
});

export const cardsSeedDatasetSchema = z.array(cardSeedRecordSchema);

export type CardSeedRecord = z.infer<typeof cardSeedRecordSchema>;
