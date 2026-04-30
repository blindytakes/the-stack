import { CardType, CreditTier, Network, type Prisma } from '@prisma/client';
import {
  derivePlannerBenefitsValue,
  deriveTotalBenefitsValue
} from '@/lib/cards/planner-benefits';
import { deriveOffsettingCreditsValue } from '@/lib/cards/presentation-metrics';
import {
  resolveCardImage,
  resolveCardFallbackBenefits
} from '@/lib/cards/fallback-enrichment';
import type {
  CardDetail,
  CardRecord,
  CreditTierValue,
  RewardDetail,
  RewardTypeValue,
  SpendingCategoryValue
} from '@/lib/cards/schema';

export type DbCardRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
    signUpBonuses: true;
    benefits: true;
  };
}>;

export type DbCardDetailRow = Prisma.CardGetPayload<{
  include: {
    rewards: true;
    signUpBonuses: true;
    benefits: true;
    transferPartners: true;
  };
}>;

const creditTierFromDb: Record<CreditTier, CreditTierValue> = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  BUILDING: 'building'
};

const cardTypeFromDb: Record<CardType, CardRecord['cardType']> = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  STUDENT: 'student',
  SECURED: 'secured'
};

const spendingCategoryFromDb: Record<string, SpendingCategoryValue> = {
  DINING: 'dining',
  GROCERIES: 'groceries',
  TRAVEL: 'travel',
  GAS: 'gas',
  STREAMING: 'streaming',
  ONLINE_SHOPPING: 'online_shopping',
  ENTERTAINMENT: 'entertainment',
  UTILITIES: 'utilities',
  ALL: 'all',
  OTHER: 'other'
};

const networkFromDb: Record<Network, string> = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover'
};

const rateTypeFromDb: Record<string, RewardDetail['rateType']> = {
  CASHBACK: 'cashback',
  POINTS: 'points',
  MILES: 'miles'
};

function deriveRewardType(rewards: DbCardRow['rewards']): RewardTypeValue {
  const rateType = rewards[0]?.rateType;
  if (rateType === 'POINTS') return 'points';
  if (rateType === 'MILES') return 'miles';
  return 'cashback';
}

function deriveTopCategories(rewards: DbCardRow['rewards']): SpendingCategoryValue[] {
  if (rewards.length === 0) return ['all'];
  return Array.from(
    new Set(rewards.map((reward) => spendingCategoryFromDb[reward.category] ?? 'other'))
  );
}

function deriveBestSignUpBonus(signUpBonuses: DbCardRow['signUpBonuses']) {
  if (signUpBonuses.length === 0) return null;
  const active = signUpBonuses.filter((bonus) => bonus.isCurrentOffer !== false);
  const candidates = active.length > 0 ? active : signUpBonuses;
  const best = [...candidates].sort(
    (a, b) => Number(b.bonusValue) - Number(a.bonusValue) || a.id.localeCompare(b.id)
  )[0];
  if (!best) return null;

  return {
    bonusValue: Number(best.bonusValue),
    spendRequired: Number(best.spendRequired),
    spendPeriodDays: best.spendPeriodDays
  };
}

function toResolvedBenefits(row: Pick<
  DbCardDetailRow,
  'slug' | 'issuer' | 'name' | 'cardType' | 'annualFee' | 'foreignTxFee' | 'rewards' | 'benefits'
>) {
  if (row.benefits.length > 0) {
    return row.benefits.map((benefit) => ({
      category: benefit.category,
      name: benefit.name,
      description: benefit.description,
      estimatedValue: benefit.estimatedValue,
      activationMethod: benefit.activationMethod
    }));
  }

  return resolveCardFallbackBenefits({
    slug: row.slug,
    issuer: row.issuer,
    name: row.name,
    cardType: cardTypeFromDb[row.cardType],
    annualFee: Number(row.annualFee),
    foreignTxFee: Number(row.foreignTxFee),
    rewardType: deriveRewardType(row.rewards),
    topCategories: deriveTopCategories(row.rewards)
  });
}

export function toCardRecordFromDb(row: DbCardRow): CardRecord {
  const bestSignUpBonus = deriveBestSignUpBonus(row.signUpBonuses);
  const resolvedBenefits = toResolvedBenefits(row);
  const resolvedCardImage = resolveCardImage(
    row.slug,
    row.issuer,
    row.imageUrl ?? undefined,
    row.name
  );
  const resolvedBenefitValues = resolvedBenefits.map((benefit) => ({
    ...benefit,
    estimatedValue: benefit.estimatedValue ?? null
  }));
  const normalizedBenefitsForPresentation = resolvedBenefits.map((benefit) => ({
    category: String(benefit.category),
    name: benefit.name,
    description: benefit.description,
    estimatedValue: benefit.estimatedValue != null ? Number(benefit.estimatedValue) : null
  }));

  return {
    slug: row.slug,
    name: row.name,
    issuer: row.issuer,
    imageUrl: resolvedCardImage.imageUrl,
    imageAssetType: resolvedCardImage.imageAssetType,
    cardType: cardTypeFromDb[row.cardType],
    rewardType: deriveRewardType(row.rewards),
    topCategories: deriveTopCategories(row.rewards),
    annualFee: Number(row.annualFee),
    foreignTxFee: Number(row.foreignTxFee),
    creditTierMin: creditTierFromDb[row.creditScoreMin],
    headline: `${row.name} by ${row.issuer}${Number(row.annualFee) === 0 ? ' with no annual fee' : ''}`.trim(),
    description: row.description ?? undefined,
    longDescription: row.longDescription ?? undefined,
    lastVerified: row.lastVerified.toISOString(),
    editorRating: row.editorRating != null ? Number(row.editorRating) : undefined,
    pros: row.pros.length > 0 ? row.pros : undefined,
    cons: row.cons.length > 0 ? row.cons : undefined,
    bestSignUpBonusValue: bestSignUpBonus?.bonusValue,
    bestSignUpBonusSpendRequired: bestSignUpBonus?.spendRequired,
    bestSignUpBonusSpendPeriodDays: bestSignUpBonus?.spendPeriodDays,
    offsettingCreditsValue: deriveOffsettingCreditsValue(normalizedBenefitsForPresentation),
    totalBenefitsValue: deriveTotalBenefitsValue(resolvedBenefitValues),
    plannerBenefitsValue: derivePlannerBenefitsValue(resolvedBenefitValues)
  };
}

export function toCardDetailFromDb(row: DbCardDetailRow): CardDetail {
  const base = toCardRecordFromDb(row);
  const resolvedBenefits = toResolvedBenefits(row);

  return {
    ...base,
    network: row.network ? networkFromDb[row.network] : undefined,
    introApr: row.introApr ?? undefined,
    regularAprMin: row.regularAprMin != null ? Number(row.regularAprMin) : undefined,
    regularAprMax: row.regularAprMax != null ? Number(row.regularAprMax) : undefined,
    foreignTxFee: Number(row.foreignTxFee),
    applyUrl: row.applyUrl ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
    rewards: row.rewards.map((reward) => ({
      category: spendingCategoryFromDb[reward.category] ?? 'other',
      rate: Number(reward.rate),
      rateType: rateTypeFromDb[reward.rateType] ?? 'cashback',
      capAmount: reward.capAmount != null ? Number(reward.capAmount) : undefined,
      capPeriod: reward.capPeriod ?? undefined,
      isRotating: reward.isRotating ?? undefined,
      notes: reward.notes ?? undefined
    })),
    signUpBonuses: row.signUpBonuses.map((bonus) => ({
      bonusValue: Number(bonus.bonusValue),
      bonusType: bonus.bonusType,
      displayHeadline: bonus.displayHeadline ?? undefined,
      displayDescription: bonus.displayDescription ?? undefined,
      bonusPoints: bonus.bonusPoints ?? undefined,
      spendRequired: Number(bonus.spendRequired),
      spendPeriodDays: bonus.spendPeriodDays,
      isCurrentOffer: bonus.isCurrentOffer
    })),
    benefits: resolvedBenefits.map((benefit) => ({
      category: benefit.category.toLowerCase().replace(/_/g, ' '),
      name: benefit.name,
      description: benefit.description,
      estimatedValue: benefit.estimatedValue != null ? Number(benefit.estimatedValue) : undefined,
      activationMethod: benefit.activationMethod ?? undefined
    })),
    transferPartners: row.transferPartners.map((partner) => ({
      partnerName: partner.partnerName,
      partnerType: partner.partnerType.toLowerCase(),
      transferRatio: Number(partner.transferRatio)
    }))
  };
}
