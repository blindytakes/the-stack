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

export type SpendingCategoryValue = (typeof spendingCategoryValues)[number];
export type CardTypeValue = 'personal' | 'business' | 'student' | 'secured';
export type RewardTypeValue = 'cashback' | 'points' | 'miles';
export type CreditTierValue = 'excellent' | 'good' | 'fair' | 'building';

export type CardRecord = {
  slug: string;
  name: string;
  issuer: string;
  imageUrl?: string;
  cardType: CardTypeValue;
  rewardType: RewardTypeValue;
  topCategories: SpendingCategoryValue[];
  annualFee: number;
  creditTierMin: CreditTierValue;
  headline: string;
  description?: string;
  longDescription?: string;
  editorRating?: number;
  pros?: string[];
  cons?: string[];
  bestSignUpBonusValue?: number;
  bestSignUpBonusSpendRequired?: number;
  bestSignUpBonusSpendPeriodDays?: number;
  offsettingCreditsValue?: number;
  totalBenefitsValue: number;
  plannerBenefitsValue: number;
};

export type RewardDetail = {
  category: SpendingCategoryValue;
  rate: number;
  rateType: RewardTypeValue;
  capAmount?: number;
  capPeriod?: string;
  isRotating?: boolean;
  notes?: string;
};

export type SignUpBonusDetail = {
  bonusValue: number;
  bonusType: string;
  displayHeadline?: string;
  displayDescription?: string;
  bonusPoints?: number;
  spendRequired: number;
  spendPeriodDays: number;
  isCurrentOffer?: boolean;
};

export type BenefitDetail = {
  category: string;
  name: string;
  description: string;
  estimatedValue?: number;
  activationMethod?: string;
};

export type TransferPartnerDetail = {
  partnerName: string;
  partnerType: string;
  transferRatio: number;
};

export type CardDetail = CardRecord & {
  network?: string;
  introApr?: string;
  regularAprMin?: number;
  regularAprMax?: number;
  foreignTxFee: number;
  applyUrl?: string;
  affiliateUrl?: string;
  rewards: RewardDetail[];
  signUpBonuses: SignUpBonusDetail[];
  benefits: BenefitDetail[];
  transferPartners: TransferPartnerDetail[];
};

export const cardsQuerySchema = z.object({
  issuer: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CardsQuery = z.infer<typeof cardsQuerySchema>;
