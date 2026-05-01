import type { CardDetail, RewardDetail } from '@/lib/cards';

export const cardComparisonSpendCategories = [
  'dining',
  'groceries',
  'travel',
  'gas',
  'online_shopping',
  'general'
] as const;

export type CardComparisonSpendCategory =
  (typeof cardComparisonSpendCategories)[number];

export type CardComparisonAssumptions = {
  monthlySpend: Record<CardComparisonSpendCategory, number>;
  pointValueCents: number;
  creditUsagePercent: number;
};

export type CardComparisonCategoryBreakdown = {
  category: CardComparisonSpendCategory;
  annualSpend: number;
  annualValue: number;
  effectiveReturnPercent: number;
  rewardLabel: string;
};

export type CardComparisonCardSummary = {
  card: CardDetail;
  annualSpendTotal: number;
  annualRewardsValue: number;
  effectiveReturnPercent: number;
  usedCreditsValue: number;
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
  online_shopping: 220,
  general: 700
};

export const defaultCardComparisonAssumptions: CardComparisonAssumptions = {
  monthlySpend: monthlySpendDefaults,
  pointValueCents: 1,
  creditUsagePercent: 70
};

const spendCategoryToRewardCategory: Record<
  CardComparisonSpendCategory,
  RewardDetail['category'] | 'all'
> = {
  dining: 'dining',
  groceries: 'groceries',
  travel: 'travel',
  gas: 'gas',
  online_shopping: 'online_shopping',
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

  return {
    monthlySpend: nextMonthlySpend,
    pointValueCents:
      typeof input?.pointValueCents === 'number' && Number.isFinite(input.pointValueCents)
        ? clamp(Number(input.pointValueCents.toFixed(2)), 0.5, 3)
        : defaultCardComparisonAssumptions.pointValueCents,
    creditUsagePercent:
      typeof input?.creditUsagePercent === 'number' &&
      Number.isFinite(input.creditUsagePercent)
        ? clamp(Math.round(input.creditUsagePercent), 0, 100)
        : defaultCardComparisonAssumptions.creditUsagePercent
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
  if (period.includes('quarter')) return reward.capAmount * 4;
  if (period.includes('week')) return reward.capAmount * 52;

  return reward.capAmount;
}

function getFallbackReward(card: CardDetail): RewardDetail {
  return {
    category: 'all',
    rate: 1,
    rateType: card.rewardType,
    notes: 'Fallback base rate'
  };
}

function getWelcomeOfferValue(card: CardDetail) {
  const currentBonuses = card.signUpBonuses.filter(
    (bonus) => bonus.isCurrentOffer !== false
  );
  const candidates = currentBonuses.length > 0 ? currentBonuses : card.signUpBonuses;
  const bestBonus = [...candidates].sort((a, b) => b.bonusValue - a.bonusValue)[0];
  return bestBonus?.bonusValue ?? card.bestSignUpBonusValue ?? 0;
}

function getBonusSpendRequirement(card: CardDetail) {
  const currentBonuses = card.signUpBonuses.filter(
    (bonus) => bonus.isCurrentOffer !== false
  );
  const candidates = currentBonuses.length > 0 ? currentBonuses : card.signUpBonuses;
  const bestBonus = [...candidates].sort((a, b) => b.bonusValue - a.bonusValue)[0];
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
  assumptions: CardComparisonAssumptions
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
    const annualValue = annualSpend * rewardValuePerDollar(fallbackOrBase, assumptions.pointValueCents);
    return {
      category,
      annualSpend,
      annualValue: roundCurrency(annualValue),
      effectiveReturnPercent: roundCurrency((annualValue / annualSpend) * 100),
      rewardLabel: formatRewardLabel(baseReward)
    };
  }

  const capAmount = annualizeCapAmount(exactReward);
  const exactValuePerDollar = rewardValuePerDollar(exactReward, assumptions.pointValueCents);
  const baseValuePerDollar = rewardValuePerDollar(fallbackOrBase, assumptions.pointValueCents);

  const spendAtBonusRate =
    typeof capAmount === 'number' ? Math.min(annualSpend, capAmount) : annualSpend;
  const spendAtBaseRate = Math.max(0, annualSpend - spendAtBonusRate);
  const annualValue =
    spendAtBonusRate * exactValuePerDollar + spendAtBaseRate * baseValuePerDollar;

  return {
    category,
    annualSpend,
    annualValue: roundCurrency(annualValue),
    effectiveReturnPercent: roundCurrency((annualValue / annualSpend) * 100),
    rewardLabel:
      spendAtBaseRate > 0
        ? `${formatRewardLabel(exactReward)} then ${formatRewardLabel(baseReward)}`
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
    'welcomeOfferValue' | 'usedCreditsValue' | 'bonusEffort' | 'transferPartnersCount'
  >
) {
  const cautions: string[] = [];

  if (card.annualFee > 0 && summary.usedCreditsValue < card.annualFee * 0.45) {
    cautions.push('The annual fee is harder to justify if you do not use the credits consistently.');
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

function summarizeCard(
  card: CardDetail,
  assumptions: CardComparisonAssumptions
): CardComparisonCardSummary {
  const categoryBreakdown = cardComparisonSpendCategories.map((category) =>
    summarizeRewardForCategory(card, category, assumptions)
  );
  const annualSpendTotal = categoryBreakdown.reduce(
    (sum, item) => sum + item.annualSpend,
    0
  );
  const annualRewardsValue = roundCurrency(
    categoryBreakdown.reduce((sum, item) => sum + item.annualValue, 0)
  );
  const usedCreditsValue = roundCurrency(
    (card.offsettingCreditsValue ?? 0) * (assumptions.creditUsagePercent / 100)
  );
  const welcomeOfferValue = roundCurrency(getWelcomeOfferValue(card));
  const firstYearValue = roundCurrency(
    annualRewardsValue + usedCreditsValue + welcomeOfferValue - card.annualFee
  );
  const ongoingValue = roundCurrency(
    annualRewardsValue + usedCreditsValue - card.annualFee
  );
  const monthlySpendCapacity = Object.values(assumptions.monthlySpend).reduce(
    (sum, value) => sum + value,
    0
  );
  const bonusSpendRequirement = getBonusSpendRequirement(card);
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
    categoryBreakdown
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

  const creditsDiff = a.usedCreditsValue - b.usedCreditsValue;
  if (Math.abs(creditsDiff) >= 75) {
    drivers.push({
      winner: creditsDiff > 0 ? 'a' : 'b',
      message: `Lets you realize about $${Math.abs(Math.round(creditsDiff)).toLocaleString()} more in usable recurring credits.`,
      magnitude: Math.abs(creditsDiff)
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
    (a.usedCreditsValue - a.card.annualFee) - (b.usedCreditsValue - b.card.annualFee);

  if (rewardDeltaPerDollar === 0) {
    return null;
  }

  if (fixedDelta >= 0) {
    return 0;
  }

  const annualSpend = -fixedDelta / rewardDeltaPerDollar;
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
