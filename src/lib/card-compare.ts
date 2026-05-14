import type { CardDetail, RewardDetail, SignUpBonusDetail } from '@/lib/cards';
import { isOffsettingCreditBenefit } from '@/lib/cards/presentation-metrics';

export const cardComparisonSpendCategories = [
  'dining',
  'groceries',
  'travel',
  'gas',
  'general'
] as const;

export type CardComparisonSpendCategory =
  (typeof cardComparisonSpendCategories)[number];

export type CardComparisonAssumptions = {
  monthlySpend: Record<CardComparisonSpendCategory, number>;
  pointValueCents: number;
  benefitValuations: Record<string, CardComparisonBenefitValuation>;
};

export type CardComparisonCategoryBreakdown = {
  category: CardComparisonSpendCategory;
  annualSpend: number;
  annualValue: number;
  effectiveReturnPercent: number;
  rewardLabel: string;
};

export type CardComparisonBenefitValuation = {
  included?: boolean;
  annualValue?: number;
};

export type CardComparisonBenefitBreakdown = {
  key: string;
  category: string;
  name: string;
  description: string;
  isCredit: boolean;
  included: boolean;
  estimatedValue: number | null;
  defaultAnnualValue: number;
  annualValue: number;
  hasCustomValue: boolean;
};

export type CardComparisonCardSummary = {
  card: CardDetail;
  annualSpendTotal: number;
  annualRewardsValue: number;
  effectiveReturnPercent: number;
  usedCreditsValue: number;
  usedPerksValue: number;
  usedBenefitsValue: number;
  welcomeOfferValue: number;
  firstYearValue: number;
  ongoingValue: number;
  bonusSpendRequired: number | null;
  bonusSpendWindowMonths: number | null;
  monthlySpendCapacity: number;
  monthlySpendNeededForBonus: number | null;
  bonusSpendRatio: number | null;
  bonusEffort: 'easy' | 'manageable' | 'stretch' | 'none';
  transferPartnersCount: number;
  fitLabel: string;
  strengths: string[];
  cautions: string[];
  categoryBreakdown: CardComparisonCategoryBreakdown[];
  benefitBreakdown: CardComparisonBenefitBreakdown[];
};

export type CardComparisonResult = {
  assumptions: CardComparisonAssumptions;
  a: CardComparisonCardSummary;
  b: CardComparisonCardSummary;
  firstYearWinner: 'a' | 'b' | 'tie';
  ongoingWinner: 'a' | 'b' | 'tie';
  overallWinner: 'a' | 'b' | 'tie';
  verdictTitle: string;
  verdictSummary: string;
  reasonsForA: string[];
  reasonsForB: string[];
  breakevenAnnualSpend: number | null;
};

const monthlySpendDefaults: Record<CardComparisonSpendCategory, number> = {
  dining: 450,
  groceries: 650,
  travel: 250,
  gas: 160,
  general: 920
};

export const defaultCardComparisonAssumptions: CardComparisonAssumptions = {
  monthlySpend: monthlySpendDefaults,
  pointValueCents: 1,
  benefitValuations: {}
};

const spendCategoryToRewardCategory: Record<
  CardComparisonSpendCategory,
  RewardDetail['category'] | 'all'
> = {
  dining: 'dining',
  groceries: 'groceries',
  travel: 'travel',
  gas: 'gas',
  general: 'all'
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function compareNumbers(a: number, b: number): 'a' | 'b' | 'tie' {
  const roundedA = Math.round(a * 100);
  const roundedB = Math.round(b * 100);
  if (roundedA === roundedB) return 'tie';
  return roundedA > roundedB ? 'a' : 'b';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBenefitKeyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCardBenefitValuationKey(
  card: Pick<CardDetail, 'slug'>,
  benefit: Pick<CardComparisonBenefitBreakdown, 'category' | 'name'>
) {
  return `${card.slug}:${normalizeBenefitKeyPart(benefit.category)}:${normalizeBenefitKeyPart(benefit.name)}`;
}

export function normalizeCardComparisonAssumptions(
  input?: Partial<CardComparisonAssumptions>
): CardComparisonAssumptions {
  const nextMonthlySpend = { ...monthlySpendDefaults };
  const monthlySpendInput = input?.monthlySpend;

  if (monthlySpendInput) {
    for (const category of cardComparisonSpendCategories) {
      const candidate = monthlySpendInput[category];
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        nextMonthlySpend[category] = clamp(Math.round(candidate), 0, 50000);
      }
    }
  }

  const benefitValuations: Record<string, CardComparisonBenefitValuation> = {};
  for (const [key, value] of Object.entries(input?.benefitValuations ?? {})) {
    if (!value || typeof value !== 'object') continue;

    const normalizedValue: CardComparisonBenefitValuation = {};
    if (typeof value.included === 'boolean') {
      normalizedValue.included = value.included;
    }
    if (typeof value.annualValue === 'number' && Number.isFinite(value.annualValue)) {
      normalizedValue.annualValue = clamp(Math.round(value.annualValue), 0, 50000);
    }

    if (Object.keys(normalizedValue).length > 0) {
      benefitValuations[key] = normalizedValue;
    }
  }

  return {
    monthlySpend: nextMonthlySpend,
    pointValueCents:
      typeof input?.pointValueCents === 'number' && Number.isFinite(input.pointValueCents)
        ? clamp(Number(input.pointValueCents.toFixed(2)), 0.5, 3)
        : defaultCardComparisonAssumptions.pointValueCents,
    benefitValuations
  };
}

function rewardValuePerDollar(
  reward: Pick<RewardDetail, 'rate' | 'rateType'>,
  pointValueCents: number
) {
  if (reward.rateType === 'cashback') {
    return reward.rate / 100;
  }

  return (reward.rate * pointValueCents) / 100;
}

function formatRewardLabel(
  reward: Pick<
    RewardDetail,
    'rate' | 'rateType' | 'capAmount' | 'capPeriod'
  > | null
) {
  if (!reward) {
    return 'Base issuer rate';
  }

  const rateLabel =
    reward.rateType === 'cashback' ? `${reward.rate}%` : `${reward.rate}x`;

  if (!reward.capAmount) {
    return rateLabel;
  }

  return `${rateLabel} up to $${Math.round(reward.capAmount).toLocaleString()}${
    reward.capPeriod ? `/${reward.capPeriod}` : ''
  }`;
}

function pickBestReward(
  rewards: RewardDetail[],
  pointValueCents: number
): RewardDetail | null {
  if (rewards.length === 0) return null;

  return [...rewards].sort((a, b) => {
    const valueDiff =
      rewardValuePerDollar(b, pointValueCents) -
      rewardValuePerDollar(a, pointValueCents);
    if (valueDiff !== 0) return valueDiff;

    const aCap = typeof a.capAmount === 'number' ? a.capAmount : Number.POSITIVE_INFINITY;
    const bCap = typeof b.capAmount === 'number' ? b.capAmount : Number.POSITIVE_INFINITY;
    return bCap - aCap;
  })[0];
}

function isPortalTravelReward(reward: RewardDetail) {
  if (reward.category !== 'travel') return false;
  const notes = reward.notes?.toLowerCase() ?? '';

  return (
    notes.includes('booked through') ||
    notes.includes('purchased through') ||
    notes.includes('capital one travel') ||
    notes.includes('capital one business travel') ||
    notes.includes('chase travel') ||
    notes.includes('travel portal')
  );
}

function pickRepresentativeReward(
  rewards: RewardDetail[],
  category: RewardDetail['category'] | 'all',
  pointValueCents: number
) {
  if (category === 'travel') {
    const broadTravelRewards = rewards.filter((reward) => !isPortalTravelReward(reward));
    return pickBestReward(broadTravelRewards, pointValueCents);
  }

  return pickBestReward(rewards, pointValueCents);
}

function annualizeCapAmount(
  reward: Pick<RewardDetail, 'capAmount' | 'capPeriod'>
): number | null {
  if (typeof reward.capAmount !== 'number' || reward.capAmount <= 0) {
    return null;
  }

  const period = reward.capPeriod?.toLowerCase() ?? '';
  if (period.includes('month')) return reward.capAmount * 12;
  if (period.includes('billing')) return reward.capAmount * 12;
  if (period.includes('quarter')) return reward.capAmount * 4;
  if (period.includes('week')) return reward.capAmount * 52;

  return reward.capAmount;
}

function buildRewardCapUsageKey(card: CardDetail, reward: RewardDetail): string {
  const notes = reward.notes?.toLowerCase() ?? '';
  const categoryKey = notes.includes('combined') ? 'combined' : reward.category;

  return [
    card.slug,
    categoryKey,
    reward.rate,
    reward.rateType,
    reward.capAmount ?? 'uncapped',
    reward.capPeriod ?? 'annual'
  ].join(':');
}

function splitSpendByRewardCap(
  card: CardDetail,
  reward: RewardDetail,
  annualSpend: number,
  capUsage: Map<string, number>
) {
  const capAmount = annualizeCapAmount(reward);
  if (capAmount == null) {
    return {
      spendAtBonusRate: annualSpend,
      spendAtBaseRate: 0
    };
  }

  const capKey = buildRewardCapUsageKey(card, reward);
  const usedCap = capUsage.get(capKey) ?? 0;
  const remainingCap = Math.max(0, capAmount - usedCap);
  const spendAtBonusRate = Math.min(annualSpend, remainingCap);
  const spendAtBaseRate = Math.max(0, annualSpend - spendAtBonusRate);

  capUsage.set(capKey, usedCap + spendAtBonusRate);

  return {
    spendAtBonusRate,
    spendAtBaseRate
  };
}

function getFallbackReward(card: CardDetail): RewardDetail {
  return {
    category: 'all',
    rate: 1,
    rateType: card.rewardType,
    notes: 'Fallback base rate'
  };
}

function getCalculatedSignUpBonusValue(
  bonus: SignUpBonusDetail,
  pointValueCents: number
) {
  const bonusType = bonus.bonusType.toLowerCase();
  const hasPointLikeBonus =
    bonusType.includes('point') || bonusType.includes('mile');

  if (
    hasPointLikeBonus &&
    typeof bonus.bonusPoints === 'number' &&
    Number.isFinite(bonus.bonusPoints)
  ) {
    return roundCurrency((bonus.bonusPoints * pointValueCents) / 100);
  }

  return bonus.bonusValue;
}

function pickBestSignUpBonus(card: CardDetail, pointValueCents: number) {
  const currentBonuses = card.signUpBonuses.filter(
    (bonus) => bonus.isCurrentOffer !== false
  );
  const candidates = currentBonuses.length > 0 ? currentBonuses : card.signUpBonuses;

  return [...candidates].sort(
    (a, b) =>
      getCalculatedSignUpBonusValue(b, pointValueCents) -
      getCalculatedSignUpBonusValue(a, pointValueCents)
  )[0];
}

function getWelcomeOfferValue(card: CardDetail, pointValueCents: number) {
  const bestBonus = pickBestSignUpBonus(card, pointValueCents);
  return bestBonus
    ? getCalculatedSignUpBonusValue(bestBonus, pointValueCents)
    : card.bestSignUpBonusValue ?? 0;
}

function getBonusSpendRequirement(card: CardDetail, pointValueCents: number) {
  const bestBonus = pickBestSignUpBonus(card, pointValueCents);
  if (bestBonus) {
    return {
      spendRequired: bestBonus.spendRequired,
      spendPeriodDays: bestBonus.spendPeriodDays
    };
  }

  if (
    typeof card.bestSignUpBonusSpendRequired === 'number' &&
    typeof card.bestSignUpBonusSpendPeriodDays === 'number'
  ) {
    return {
      spendRequired: card.bestSignUpBonusSpendRequired,
      spendPeriodDays: card.bestSignUpBonusSpendPeriodDays
    };
  }

  return null;
}

function summarizeRewardForCategory(
  card: CardDetail,
  category: CardComparisonSpendCategory,
  assumptions: CardComparisonAssumptions,
  capUsage: Map<string, number>
): CardComparisonCategoryBreakdown {
  const annualSpend = assumptions.monthlySpend[category] * 12;
  const rewardCategory = spendCategoryToRewardCategory[category];
  const exactReward =
    rewardCategory === 'all'
      ? null
      : pickRepresentativeReward(
          card.rewards.filter((reward) => reward.category === rewardCategory),
          rewardCategory,
          assumptions.pointValueCents
        );
  const baseReward = pickBestReward(
    card.rewards.filter((reward) => reward.category === 'all'),
    assumptions.pointValueCents
  );
  const fallbackReward = getFallbackReward(card);
  const fallbackOrBase = baseReward ?? fallbackReward;

  if (annualSpend <= 0) {
    return {
      category,
      annualSpend: 0,
      annualValue: 0,
      effectiveReturnPercent: 0,
      rewardLabel:
        rewardCategory === 'all'
          ? formatRewardLabel(baseReward)
          : formatRewardLabel(exactReward ?? baseReward)
    };
  }

  if (!exactReward || rewardCategory === 'all') {
    const { spendAtBonusRate, spendAtBaseRate } = splitSpendByRewardCap(
      card,
      fallbackOrBase,
      annualSpend,
      capUsage
    );
    const rewardValue = rewardValuePerDollar(fallbackOrBase, assumptions.pointValueCents);
    const fallbackValue = rewardValuePerDollar(fallbackReward, assumptions.pointValueCents);
    const annualValue = spendAtBonusRate * rewardValue + spendAtBaseRate * fallbackValue;

    return {
      category,
      annualSpend,
      annualValue: roundCurrency(annualValue),
      effectiveReturnPercent: roundCurrency((annualValue / annualSpend) * 100),
      rewardLabel:
        spendAtBaseRate > 0
          ? `${formatRewardLabel(fallbackOrBase)} then ${formatRewardLabel(fallbackReward)}`
          : formatRewardLabel(fallbackOrBase)
    };
  }

  const exactValuePerDollar = rewardValuePerDollar(exactReward, assumptions.pointValueCents);
  const baseValuePerDollar = rewardValuePerDollar(fallbackOrBase, assumptions.pointValueCents);
  const { spendAtBonusRate, spendAtBaseRate } = splitSpendByRewardCap(
    card,
    exactReward,
    annualSpend,
    capUsage
  );
  const annualValue =
    spendAtBonusRate * exactValuePerDollar + spendAtBaseRate * baseValuePerDollar;

  return {
    category,
    annualSpend,
    annualValue: roundCurrency(annualValue),
    effectiveReturnPercent: roundCurrency((annualValue / annualSpend) * 100),
    rewardLabel:
      spendAtBaseRate > 0
        ? `${formatRewardLabel(exactReward)} then ${formatRewardLabel(fallbackOrBase)}`
        : formatRewardLabel(exactReward)
  };
}

function classifyBonusEffort(
  monthlySpendNeededForBonus: number | null,
  monthlySpendCapacity: number
): CardComparisonCardSummary['bonusEffort'] {
  if (!monthlySpendNeededForBonus || monthlySpendNeededForBonus <= 0) return 'none';
  if (monthlySpendCapacity <= 0) return 'stretch';

  const ratio = monthlySpendNeededForBonus / monthlySpendCapacity;
  if (ratio <= 0.55) return 'easy';
  if (ratio <= 0.95) return 'manageable';
  return 'stretch';
}

function describeFit(card: CardDetail, usedCreditsValue: number) {
  if (card.annualFee === 0) return 'No-fee keeper';
  if (card.rewardType === 'cashback' && card.annualFee <= 95) {
    return 'Low-friction cash back';
  }
  if (card.transferPartners.length >= 8 && card.foreignTxFee === 0) {
    return 'Transfer-partner travel';
  }
  if (usedCreditsValue >= card.annualFee * 0.75) {
    return 'Best if you use the credits';
  }
  if (card.foreignTxFee === 0) return 'Travel-friendly everyday card';
  return 'General rewards fit';
}

function buildAbsoluteStrengths(
  card: CardDetail,
  summary: Pick<
    CardComparisonCardSummary,
    | 'welcomeOfferValue'
    | 'effectiveReturnPercent'
    | 'usedCreditsValue'
    | 'transferPartnersCount'
    | 'bonusEffort'
  >
) {
  const strengths: string[] = [];

  if (summary.welcomeOfferValue >= 900) {
    strengths.push('Comes with a particularly strong welcome offer.');
  } else if (summary.welcomeOfferValue >= 500) {
    strengths.push('Still delivers meaningful first-year upside from the welcome offer.');
  }

  if (summary.effectiveReturnPercent >= 2.5) {
    strengths.push('Earns well on the spend mix you entered.');
  }

  if (card.annualFee > 0 && summary.usedCreditsValue >= card.annualFee * 0.7) {
    strengths.push('Your expected credit usage offsets most of the annual fee.');
  }

  if (summary.transferPartnersCount >= 8) {
    strengths.push('Offers broad transfer-partner flexibility.');
  }

  if (card.foreignTxFee === 0) {
    strengths.push('Stays usable for international purchases.');
  }

  return strengths.slice(0, 3);
}

function buildAbsoluteCautions(
  card: CardDetail,
  summary: Pick<
    CardComparisonCardSummary,
    'welcomeOfferValue' | 'usedCreditsValue' | 'usedBenefitsValue' | 'bonusEffort' | 'transferPartnersCount'
  >
) {
  const cautions: string[] = [];

  if (card.annualFee > 0 && summary.usedBenefitsValue < card.annualFee * 0.45) {
    cautions.push('The annual fee is harder to justify if you do not use the credits and perks consistently.');
  }

  if (summary.bonusEffort === 'stretch') {
    cautions.push('The listed welcome-offer threshold looks aggressive for your monthly spend capacity.');
  }

  if (card.foreignTxFee > 0) {
    cautions.push('Foreign transaction fees make it weaker for international spend.');
  }

  if (summary.welcomeOfferValue <= 0) {
    cautions.push('There is no meaningful active welcome offer in the current dataset.');
  }

  if (card.rewardType !== 'cashback' && summary.transferPartnersCount === 0) {
    cautions.push('The points value case is thinner without transfer-partner flexibility.');
  }

  return cautions.slice(0, 3);
}

function getFallbackOffsettingCreditsBenefit(card: CardDetail) {
  const estimatedValue = card.offsettingCreditsValue ?? 0;
  if (estimatedValue <= 0) return [];

  return [
    {
      category: 'travel credits',
      name: 'Recurring credits',
      description: 'Estimated annual credit value from this card.',
      estimatedValue
    }
  ];
}

function getDefaultCreditAnnualValue(
  benefit: Pick<CardComparisonBenefitBreakdown, 'category' | 'name' | 'description'>,
  estimatedValue: number
) {
  const searchableText =
    `${benefit.category} ${benefit.name} ${benefit.description}`.toLowerCase();

  if (/oura|equinox/i.test(searchableText)) return 0;

  const merchantCreditMultipliers: Array<[RegExp, number]> = [
    [/airline fee credit/i, 0.6],
    [/hotel credit/i, 0.6],
    [/resy/i, 0.65],
    [/digital entertainment/i, 0.75],
    [/\bdunkin/i, 0.8],
    [/uber cash/i, 0.8],
    [/uber one/i, 0.5],
    [/saks/i, 0.5],
    [/walmart\+/i, 0.5],
    [/lululemon/i, 0.5]
  ];
  const multiplier = merchantCreditMultipliers.find(([pattern]) =>
    pattern.test(searchableText)
  )?.[1];

  return roundCurrency(estimatedValue * (multiplier ?? 1));
}

function buildBenefitBreakdown(
  card: CardDetail,
  assumptions: CardComparisonAssumptions
): CardComparisonBenefitBreakdown[] {
  const benefits =
    card.benefits.length > 0 ? card.benefits : getFallbackOffsettingCreditsBenefit(card);

  return benefits.map((benefit) => {
    const key = buildCardBenefitValuationKey(card, benefit);
    const isCredit = isOffsettingCreditBenefit(benefit);
    const estimatedValue =
      typeof benefit.estimatedValue === 'number' && Number.isFinite(benefit.estimatedValue)
        ? benefit.estimatedValue
        : null;
    const defaultAnnualValue =
      estimatedValue == null
        ? 0
        : isCredit
          ? getDefaultCreditAnnualValue(benefit, estimatedValue)
          : roundCurrency(estimatedValue);
    const defaultIncluded = isCredit && defaultAnnualValue > 0;
    const valuation = assumptions.benefitValuations[key];
    const included = valuation?.included ?? defaultIncluded;
    const hasCustomValue = typeof valuation?.annualValue === 'number';
    const annualValue = included
      ? roundCurrency(hasCustomValue ? valuation?.annualValue ?? 0 : defaultAnnualValue)
      : 0;

    return {
      key,
      category: benefit.category,
      name: benefit.name,
      description: benefit.description,
      isCredit,
      included,
      estimatedValue,
      defaultAnnualValue,
      annualValue,
      hasCustomValue
    };
  });
}

function summarizeCard(
  card: CardDetail,
  assumptions: CardComparisonAssumptions
): CardComparisonCardSummary {
  const capUsage = new Map<string, number>();
  const categoryBreakdown = cardComparisonSpendCategories.map((category) =>
    summarizeRewardForCategory(card, category, assumptions, capUsage)
  );
  const annualSpendTotal = categoryBreakdown.reduce(
    (sum, item) => sum + item.annualSpend,
    0
  );
  const annualRewardsValue = roundCurrency(
    categoryBreakdown.reduce((sum, item) => sum + item.annualValue, 0)
  );
  const benefitBreakdown = buildBenefitBreakdown(card, assumptions);
  const usedCreditsValue = roundCurrency(
    benefitBreakdown
      .filter((benefit) => benefit.isCredit)
      .reduce((sum, benefit) => sum + benefit.annualValue, 0)
  );
  const usedPerksValue = roundCurrency(
    benefitBreakdown
      .filter((benefit) => !benefit.isCredit)
      .reduce((sum, benefit) => sum + benefit.annualValue, 0)
  );
  const usedBenefitsValue = roundCurrency(
    usedCreditsValue + usedPerksValue
  );
  const welcomeOfferValue = roundCurrency(
    getWelcomeOfferValue(card, assumptions.pointValueCents)
  );
  const firstYearValue = roundCurrency(
    annualRewardsValue + usedBenefitsValue + welcomeOfferValue - card.annualFee
  );
  const ongoingValue = roundCurrency(
    annualRewardsValue + usedBenefitsValue - card.annualFee
  );
  const monthlySpendCapacity = Object.values(assumptions.monthlySpend).reduce(
    (sum, value) => sum + value,
    0
  );
  const bonusSpendRequirement = getBonusSpendRequirement(
    card,
    assumptions.pointValueCents
  );
  const bonusMonths = bonusSpendRequirement
    ? Math.max(1, Math.round(bonusSpendRequirement.spendPeriodDays / 30))
    : null;
  const monthlySpendNeededForBonus =
    bonusSpendRequirement && bonusMonths
      ? roundCurrency(bonusSpendRequirement.spendRequired / bonusMonths)
      : null;
  const bonusSpendRequired = bonusSpendRequirement?.spendRequired ?? null;
  const bonusSpendRatio =
    monthlySpendNeededForBonus && monthlySpendCapacity > 0
      ? roundCurrency(monthlySpendNeededForBonus / monthlySpendCapacity)
      : null;
  const effectiveReturnPercent =
    annualSpendTotal > 0
      ? roundCurrency((annualRewardsValue / annualSpendTotal) * 100)
      : 0;

  const fitLabel = describeFit(card, usedCreditsValue);
  const transferPartnersCount = card.transferPartners.length;
  const bonusEffort = classifyBonusEffort(
    monthlySpendNeededForBonus,
    monthlySpendCapacity
  );

  const summary: CardComparisonCardSummary = {
    card,
    annualSpendTotal,
    annualRewardsValue,
    effectiveReturnPercent,
    usedCreditsValue,
    usedPerksValue,
    usedBenefitsValue,
    welcomeOfferValue,
    firstYearValue,
    ongoingValue,
    bonusSpendRequired,
    bonusSpendWindowMonths: bonusMonths,
    monthlySpendCapacity,
    monthlySpendNeededForBonus,
    bonusSpendRatio,
    bonusEffort,
    transferPartnersCount,
    fitLabel,
    strengths: [],
    cautions: [],
    categoryBreakdown,
    benefitBreakdown
  };

  summary.strengths = buildAbsoluteStrengths(card, summary);
  summary.cautions = buildAbsoluteCautions(card, summary);

  return summary;
}

export function buildCardComparisonCardSummary(
  card: CardDetail,
  assumptionsInput?: Partial<CardComparisonAssumptions>
) {
  return summarizeCard(card, normalizeCardComparisonAssumptions(assumptionsInput));
}

type RelativeDriver = {
  winner: 'a' | 'b';
  message: string;
  magnitude: number;
};

function buildRelativeDrivers(
  a: CardComparisonCardSummary,
  b: CardComparisonCardSummary
): RelativeDriver[] {
  const drivers: RelativeDriver[] = [];

  const welcomeDiff = a.welcomeOfferValue - b.welcomeOfferValue;
  if (Math.abs(welcomeDiff) >= 100) {
    drivers.push({
      winner: welcomeDiff > 0 ? 'a' : 'b',
      message: `Has about $${Math.abs(Math.round(welcomeDiff)).toLocaleString()} more welcome-offer value in year one.`,
      magnitude: Math.abs(welcomeDiff)
    });
  }

  const annualRewardsDiff = a.annualRewardsValue - b.annualRewardsValue;
  if (Math.abs(annualRewardsDiff) >= 50) {
    drivers.push({
      winner: annualRewardsDiff > 0 ? 'a' : 'b',
      message: `Earns about $${Math.abs(Math.round(annualRewardsDiff)).toLocaleString()} more per year at your current spend mix.`,
      magnitude: Math.abs(annualRewardsDiff)
    });
  }

  const benefitsDiff = a.usedBenefitsValue - b.usedBenefitsValue;
  if (Math.abs(benefitsDiff) >= 75) {
    drivers.push({
      winner: benefitsDiff > 0 ? 'a' : 'b',
      message: `Lets you realize about $${Math.abs(Math.round(benefitsDiff)).toLocaleString()} more in usable credits and perks.`,
      magnitude: Math.abs(benefitsDiff)
    });
  }

  const feeDiff = a.card.annualFee - b.card.annualFee;
  if (Math.abs(feeDiff) >= 50) {
    drivers.push({
      winner: feeDiff < 0 ? 'a' : 'b',
      message: `Carries a $${Math.abs(Math.round(feeDiff)).toLocaleString()} lower annual fee.`,
      magnitude: Math.abs(feeDiff)
    });
  }

  const transferPartnerDiff = a.transferPartnersCount - b.transferPartnersCount;
  if (Math.abs(transferPartnerDiff) >= 4) {
    drivers.push({
      winner: transferPartnerDiff > 0 ? 'a' : 'b',
      message: `Comes with ${Math.abs(transferPartnerDiff)} more transfer partners.`,
      magnitude: Math.abs(transferPartnerDiff) * 35
    });
  }

  const foreignFeeDiff = a.card.foreignTxFee - b.card.foreignTxFee;
  if (foreignFeeDiff !== 0) {
    drivers.push({
      winner: foreignFeeDiff < 0 ? 'a' : 'b',
      message: foreignFeeDiff < 0 ? 'Avoids foreign transaction fees.' : 'Avoids foreign transaction fees.',
      magnitude: 80
    });
  }

  return drivers.sort((left, right) => right.magnitude - left.magnitude);
}

function selectReasons(
  winner: 'a' | 'b',
  drivers: RelativeDriver[],
  summary: CardComparisonCardSummary
) {
  const reasons = drivers
    .filter((driver) => driver.winner === winner)
    .slice(0, 2)
    .map((driver) => driver.message);

  for (const fallback of summary.strengths) {
    if (reasons.length >= 3) break;
    reasons.push(fallback);
  }

  return reasons.slice(0, 3);
}

function computeBreakevenAnnualSpend(
  a: CardComparisonCardSummary,
  b: CardComparisonCardSummary
) {
  const rewardDeltaPerDollar =
    a.annualSpendTotal > 0
      ? (a.annualRewardsValue - b.annualRewardsValue) / a.annualSpendTotal
      : 0;
  const fixedDelta =
    (a.usedBenefitsValue - a.card.annualFee) - (b.usedBenefitsValue - b.card.annualFee);

  if (rewardDeltaPerDollar === 0) {
    return null;
  }

  const fixedAdvantageForHigherRewardCard =
    fixedDelta * Math.sign(rewardDeltaPerDollar);
  if (fixedAdvantageForHigherRewardCard >= 0) {
    return 0;
  }

  const annualSpend = Math.abs(fixedDelta) / Math.abs(rewardDeltaPerDollar);
  if (!Number.isFinite(annualSpend) || annualSpend <= 0) {
    return null;
  }

  return Math.round(annualSpend);
}

function buildVerdict(
  a: CardComparisonCardSummary,
  b: CardComparisonCardSummary,
  firstYearWinner: 'a' | 'b' | 'tie',
  ongoingWinner: 'a' | 'b' | 'tie'
) {
  if (firstYearWinner === 'a' && ongoingWinner === 'a') {
    return {
      overallWinner: 'a' as const,
      verdictTitle: `${a.card.name} is the stronger fit under these assumptions.`,
      verdictSummary:
        'It wins on both year-one value and the keep-or-cancel math after the welcome offer is gone.'
    };
  }

  if (firstYearWinner === 'b' && ongoingWinner === 'b') {
    return {
      overallWinner: 'b' as const,
      verdictTitle: `${b.card.name} is the stronger fit under these assumptions.`,
      verdictSummary:
        'It wins on both year-one value and the keep-or-cancel math after the welcome offer is gone.'
    };
  }

  if (firstYearWinner !== 'tie' && ongoingWinner !== 'tie' && firstYearWinner !== ongoingWinner) {
    const firstYearCard = firstYearWinner === 'a' ? a.card.name : b.card.name;
    const ongoingCard = ongoingWinner === 'a' ? a.card.name : b.card.name;

    return {
      overallWinner: 'tie' as const,
      verdictTitle: `${firstYearCard} is the better opener. ${ongoingCard} is the better keeper.`,
      verdictSummary:
        'One card wins on immediate sign-up-bonus value, while the other is easier to justify once the bonus is gone.'
    };
  }

  return {
    overallWinner: 'tie' as const,
    verdictTitle: 'These cards are closer than they look.',
    verdictSummary:
      'The result depends more on how much of the credits you will use and how much of your spend really lands in the bonus categories.'
  };
}

export function buildCardComparison(
  cardA: CardDetail,
  cardB: CardDetail,
  assumptionsInput?: Partial<CardComparisonAssumptions>
): CardComparisonResult {
  const assumptions = normalizeCardComparisonAssumptions(assumptionsInput);
  const a = summarizeCard(cardA, assumptions);
  const b = summarizeCard(cardB, assumptions);
  const firstYearWinner = compareNumbers(a.firstYearValue, b.firstYearValue);
  const ongoingWinner = compareNumbers(a.ongoingValue, b.ongoingValue);
  const verdict = buildVerdict(a, b, firstYearWinner, ongoingWinner);
  const drivers = buildRelativeDrivers(a, b);

  return {
    assumptions,
    a,
    b,
    firstYearWinner,
    ongoingWinner,
    overallWinner: verdict.overallWinner,
    verdictTitle: verdict.verdictTitle,
    verdictSummary: verdict.verdictSummary,
    reasonsForA: selectReasons('a', drivers, a),
    reasonsForB: selectReasons('b', drivers, b),
    breakevenAnnualSpend: computeBreakevenAnnualSpend(a, b)
  };
}
