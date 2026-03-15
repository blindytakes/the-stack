import type { Prisma } from '@prisma/client';

type BenefitValueSource = Array<{
  category: string;
  name: string;
  estimatedValue: Prisma.Decimal | number | null;
}>;

const plannerBenefitCategorySet = new Set<string>([
  'TRAVEL_CREDITS',
  'DINING_CREDITS',
  'STREAMING_CREDITS',
  'TSA_GLOBAL_ENTRY'
]);

const plannerBenefitNameAllowlist = [
  /anniversary bonus miles/i,
  /hotel credit/i,
  /uber cash/i,
  /resy/i,
  /\bdunkin/i
];

const plannerBenefitNameBlocklist = [
  /dashpass/i,
  /membership/i,
  /lyft pink/i,
  /instacart/i,
  /\blounge\b/i,
  /priority pass/i,
  /\bstatus\b/i,
  /\belite\b/i,
  /concierge/i
];

const plannerBenefitCategoryMultipliers: Record<string, number> = {
  TRAVEL_CREDITS: 0.9,
  DINING_CREDITS: 0.8,
  STREAMING_CREDITS: 0.75,
  TSA_GLOBAL_ENTRY: 1
};

const plannerBenefitNameMultipliers: Array<[RegExp, number]> = [
  [/airline fee credit/i, 0.6],
  [/hotel credit/i, 0.6],
  [/resy/i, 0.65],
  [/\bdunkin/i, 0.8],
  [/uber cash/i, 0.8],
  [/anniversary bonus miles/i, 0.9]
];

export function deriveTotalBenefitsValue(benefits: BenefitValueSource): number {
  return Number(
    benefits
      .reduce((sum, benefit) => sum + (benefit.estimatedValue != null ? Number(benefit.estimatedValue) : 0), 0)
      .toFixed(2)
  );
}

function derivePlannerBenefitRealizationMultiplier(category: string, benefitName: string): number {
  const nameMultiplier = plannerBenefitNameMultipliers.find(([pattern]) => pattern.test(benefitName))?.[1];
  if (typeof nameMultiplier === 'number') {
    return nameMultiplier;
  }

  return plannerBenefitCategoryMultipliers[category] ?? 1;
}

export function derivePlannerBenefitsValue(benefits: BenefitValueSource): number {
  return Number(
    benefits
      .reduce((sum, benefit) => {
        const estimatedValue = benefit.estimatedValue != null ? Number(benefit.estimatedValue) : 0;
        if (estimatedValue <= 0) return sum;

        const benefitName = benefit.name.toLowerCase();
        if (plannerBenefitNameBlocklist.some((pattern) => pattern.test(benefitName))) {
          return sum;
        }

        if (plannerBenefitNameAllowlist.some((pattern) => pattern.test(benefitName))) {
          return sum + estimatedValue * derivePlannerBenefitRealizationMultiplier(benefit.category, benefitName);
        }

        if (plannerBenefitCategorySet.has(benefit.category)) {
          return sum + estimatedValue * derivePlannerBenefitRealizationMultiplier(benefit.category, benefitName);
        }

        return sum;
      }, 0)
      .toFixed(2)
  );
}
