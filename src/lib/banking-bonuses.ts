import { BankingAccountType, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { db, isDatabaseConfigured } from '@/lib/db';
import { getNodeEnv } from '@/lib/config/runtime';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import {
  bankingAccountTypeSchema,
  bankingBonusesSeedDatasetSchema,
  type BankingBonusSeedRecord
} from '@/lib/banking-bonus-seed-schema';

const bankingBonusSeedData = bankingBonusesSeedDatasetSchema.parse([
  {
    slug: 'summit-national-checking-300',
    bankName: 'Summit National Bank',
    offerName: 'Smart Checking Bonus',
    accountType: 'checking',
    headline: 'Earn $300 after qualifying direct deposits and keeping the account open.',
    bonusAmount: 300,
    estimatedFees: 12,
    directDeposit: {
      required: true,
      minimumAmount: 1000
    },
    holdingPeriodDays: 180,
    requiredActions: [
      'Receive one or more qualifying direct deposits within 90 days.',
      'Keep the account open through the payout date.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/summit-national-checking-300',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'harbor-federal-checking-savings-500',
    bankName: 'Harbor Federal',
    offerName: 'Checking + Savings Bundle',
    accountType: 'bundle',
    headline: 'Up to $500 total bonus for opening and funding both accounts.',
    bonusAmount: 500,
    estimatedFees: 25,
    directDeposit: {
      required: true,
      minimumAmount: 1500
    },
    minimumOpeningDeposit: 2500,
    holdingPeriodDays: 120,
    requiredActions: [
      'Open both checking and savings accounts in the same application.',
      'Maintain the minimum combined balance during the qualifying window.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/harbor-federal-checking-savings-500',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'atlas-online-savings-250',
    bankName: 'Atlas Online Bank',
    offerName: 'High-Yield Savings Bonus',
    accountType: 'savings',
    headline: 'Earn $250 for depositing fresh funds and maintaining balance targets.',
    bonusAmount: 250,
    estimatedFees: 0,
    minimumOpeningDeposit: 15000,
    holdingPeriodDays: 90,
    requiredActions: [
      'Deposit qualifying new funds within 30 days of opening.',
      'Maintain minimum required balance until bonus posts.'
    ],
    offerUrl: 'https://www.thestackhq.com/banking/atlas-online-savings-250',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'maple-street-checking-225',
    bankName: 'Maple Street Bank',
    offerName: 'Everyday Checking Bonus',
    accountType: 'checking',
    headline: 'Earn $225 after qualifying card activity and direct deposits.',
    bonusAmount: 225,
    estimatedFees: 10,
    directDeposit: {
      required: true,
      minimumAmount: 750
    },
    holdingPeriodDays: 120,
    requiredActions: [
      'Complete 10 debit card purchases in the first 60 days.',
      'Receive qualifying direct deposit activity.'
    ],
    stateRestrictions: ['CA', 'OR', 'WA'],
    offerUrl: 'https://www.thestackhq.com/banking/maple-street-checking-225',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'granite-state-checking-150',
    bankName: 'Granite State Credit Union',
    offerName: 'Starter Checking Bonus',
    accountType: 'checking',
    headline: 'Simple $150 starter bonus with low friction requirements.',
    bonusAmount: 150,
    estimatedFees: 0,
    directDeposit: {
      required: false
    },
    holdingPeriodDays: 60,
    requiredActions: ['Enroll in e-statements and complete five debit transactions.'],
    offerUrl: 'https://www.thestackhq.com/banking/granite-state-checking-150',
    lastVerified: '2026-03-01T00:00:00.000Z'
  },
  {
    slug: 'oak-legacy-checking-300-legacy',
    bankName: 'Oak Legacy Bank',
    offerName: 'Legacy Checking Promotion',
    accountType: 'checking',
    headline: 'Legacy campaign retained for historical comparison only.',
    bonusAmount: 300,
    estimatedFees: 30,
    directDeposit: {
      required: true,
      minimumAmount: 2000
    },
    holdingPeriodDays: 180,
    requiredActions: ['Receive qualifying payroll direct deposit.'],
    offerUrl: 'https://www.thestackhq.com/banking/oak-legacy-checking-300-legacy',
    isActive: false,
    lastVerified: '2025-12-01T00:00:00.000Z'
  }
]);

export type BankingBonusRecord = BankingBonusSeedRecord;

export type BankingBonusListItem = BankingBonusRecord & {
  estimatedNetValue: number;
};

export type BankingBonusesDataSource = 'db' | 'seed';
export type BankingOfferCashRequirementLevel = 'none' | 'light' | 'medium' | 'high';
export type BankingOfferTimelineBucket = 'fast' | 'standard' | 'long' | 'unknown';
export type BankingBonusesSort = 'net' | 'easy' | 'fast' | 'low_cash';

const accountTypeFromDb: Record<BankingAccountType, BankingBonusRecord['accountType']> = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  BUNDLE: 'bundle'
};

const bankingDifficultySchema = z.enum(['low', 'medium', 'high']);
const bankingCashRequirementSchema = z.enum(['none', 'light', 'medium', 'high']);
const bankingTimelineSchema = z.enum(['fast', 'standard', 'long']);
const bankingSortSchema = z.enum(['net', 'easy', 'fast', 'low_cash']);

export const bankingBonusesQuerySchema = z.object({
  accountType: bankingAccountTypeSchema.optional(),
  requiresDirectDeposit: z.enum(['yes', 'no']).optional(),
  difficulty: bankingDifficultySchema.optional(),
  cashRequirement: bankingCashRequirementSchema.optional(),
  timeline: bankingTimelineSchema.optional(),
  stateLimited: z.enum(['yes', 'no']).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  sort: bankingSortSchema.default('net'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type BankingBonusesQuery = z.infer<typeof bankingBonusesQuerySchema>;

export type BankingOfferDifficultyLevel = 'low' | 'medium' | 'high';

export type BankingOfferDifficulty = {
  level: BankingOfferDifficultyLevel;
  label: string;
  shortLabel: string;
  detail: string;
};

export type BankingOfferTimeline = {
  label: string;
  shortLabel: string;
  detail: string;
  isKnown: boolean;
};

export type BankingOfferChecklistStep = {
  timing: string;
  title: string;
  detail: string;
};

type DbBankingBonusRow = Prisma.BankingBonusGetPayload<Record<string, never>>;

function sortByNetValueDesc<T extends BankingBonusListItem>(bonuses: T[]): T[] {
  return [...bonuses].sort((a, b) => b.estimatedNetValue - a.estimatedNetValue);
}

function getBankingOfferDifficultyScore(
  offer: Pick<
    BankingBonusRecord,
    'requiredActions' | 'directDeposit' | 'minimumOpeningDeposit' | 'holdingPeriodDays'
  >
) {
  return (
    offer.requiredActions.length +
    (offer.directDeposit.required ? 2 : 0) +
    (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000
      ? 1
      : 0) +
    (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays >= 120 ? 1 : 0)
  );
}

function getOpeningDepositAmount(offer: Pick<BankingBonusRecord, 'minimumOpeningDeposit'>) {
  return offer.minimumOpeningDeposit ?? 0;
}

function getHoldingPeriodForSort(offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>) {
  return offer.holdingPeriodDays ?? Number.POSITIVE_INFINITY;
}

function toListItem(record: BankingBonusRecord): BankingBonusListItem {
  return {
    ...record,
    imageUrl: resolveBankingBrandImageUrl(record.bankName, record.imageUrl),
    estimatedNetValue: Number((record.bonusAmount - record.estimatedFees).toFixed(2))
  };
}

function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function trimTrailingPunctuation(value: string): string {
  return value.trim().replace(/[.?!]+$/, '');
}

export function formatBankingCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatBankingAccountType(accountType: BankingBonusRecord['accountType']) {
  if (accountType === 'bundle') return 'Checking + savings';
  if (accountType === 'savings') return 'Savings';
  return 'Checking';
}

export function getBankingOfferDifficulty(
  offer: Pick<
    BankingBonusRecord,
    'requiredActions' | 'directDeposit' | 'minimumOpeningDeposit' | 'holdingPeriodDays'
  >
): BankingOfferDifficulty {
  const score = getBankingOfferDifficultyScore(offer);

  if (score <= 2) {
    return {
      level: 'low',
      label: 'Low friction',
      shortLabel: 'Low friction',
      detail: 'Lighter checklist with no direct-deposit routing and limited funding drag.'
    };
  }

  if (score <= 4) {
    return {
      level: 'medium',
      label: 'Moderate friction',
      shortLabel: 'Moderate friction',
      detail: offer.directDeposit.required
        ? 'Expect payroll routing or a few coordinated tasks, but the workload is still manageable.'
        : 'There are enough steps or holding time to warrant a tracker, even without payroll routing.'
    };
  }

  return {
    level: 'high',
    label: 'High friction',
    shortLabel: 'High friction',
    detail:
      'Higher cash commitment, longer hold periods, or several moving parts make this a more hands-on execution play.'
  };
}

export function getBankingOfferCashRequirementLevel(
  offer: Pick<BankingBonusRecord, 'minimumOpeningDeposit'>
): BankingOfferCashRequirementLevel {
  const openingDeposit = getOpeningDepositAmount(offer);

  if (openingDeposit <= 0) return 'none';
  if (openingDeposit <= 2500) return 'light';
  if (openingDeposit < 10000) return 'medium';
  return 'high';
}

export function getBankingOfferTimelineBucket(
  offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>
): BankingOfferTimelineBucket {
  const days = offer.holdingPeriodDays;

  if (!days) return 'unknown';
  if (days <= 90) return 'fast';
  if (days <= 150) return 'standard';
  return 'long';
}

export function getBankingOfferTimeline(
  offer: Pick<BankingBonusRecord, 'holdingPeriodDays'>
): BankingOfferTimeline {
  const days = offer.holdingPeriodDays;

  if (!days) {
    return {
      label: 'Check live terms',
      shortLabel: 'Varies',
      detail: 'The completion timeline is not clearly listed in this dataset, so confirm the live offer before you start.',
      isKnown: false
    };
  }

  if (days <= 60) {
    return {
      label: `${days} days`,
      shortLabel: `${days} days`,
      detail: 'Fast by bank-bonus standards if you stay on top of the checklist.',
      isKnown: true
    };
  }

  const months = Math.round(days / 30);
  if (days <= 120) {
    return {
      label: `~${months} months`,
      shortLabel: `~${months} months`,
      detail: `A standard multi-month offer window with roughly ${days} days of follow-through.`,
      isKnown: true
    };
  }

  return {
    label: `~${months} months`,
    shortLabel: `~${months} months`,
    detail: `Longer runway: plan on about ${days} days before the account is truly done.`,
    isKnown: true
  };
}

export function getBankingOfferAvailabilityLabel(
  offer: Pick<BankingBonusRecord, 'stateRestrictions'>
) {
  if (!offer.stateRestrictions || offer.stateRestrictions.length === 0) {
    return 'No state restriction listed';
  }

  return offer.stateRestrictions.length <= 4
    ? `Limited to ${formatList(offer.stateRestrictions)}`
    : `Limited to ${offer.stateRestrictions.length} states`;
}

export function getBankingOfferExecutionSummary(offer: BankingBonusRecord) {
  const timeline = getBankingOfferTimeline(offer);
  const timelineText = timeline.isKnown
    ? `for about ${timeline.label.toLowerCase()}`
    : 'through the bank’s published qualification window';

  if (offer.accountType === 'bundle') {
    return `This is a bundle play: open both accounts, satisfy the balance and activity rules, and stay organized ${timelineText}.`;
  }

  if (
    offer.accountType === 'savings' &&
    typeof offer.minimumOpeningDeposit === 'number' &&
    offer.minimumOpeningDeposit > 0
  ) {
    return `This is more cash parking than payroll routing: move at least ${formatBankingCurrency(offer.minimumOpeningDeposit)} in fresh funds and leave the account alone ${timelineText}.`;
  }

  if (offer.directDeposit.required && typeof offer.minimumOpeningDeposit === 'number') {
    return `Works best if you can route qualifying payroll, fund the account with at least ${formatBankingCurrency(offer.minimumOpeningDeposit)}, and keep it active ${timelineText}.`;
  }

  if (offer.directDeposit.required) {
    return `Works best if you can route qualifying payroll and stay on top of the account ${timelineText}.`;
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    return `Works best if you can park at least ${formatBankingCurrency(offer.minimumOpeningDeposit)} without straining working cash and leave the account open ${timelineText}.`;
  }

  return `A lighter execution path: no direct deposit, no large opening deposit, and ${timelineText} of follow-through.`;
}

export function getBankingOfferPrimaryRequirement(offer: BankingBonusRecord) {
  if (offer.accountType === 'bundle') {
    if (offer.directDeposit.required && typeof offer.directDeposit.minimumAmount === 'number') {
      return `Open both accounts and route ${formatBankingCurrency(offer.directDeposit.minimumAmount)}+ in payroll.`;
    }

    if (offer.directDeposit.required) {
      return 'Open both accounts and route qualifying payroll.';
    }

    if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
      return `Open both accounts and fund ${formatBankingCurrency(offer.minimumOpeningDeposit)}+.`;
    }

    return 'Open both accounts in one application.';
  }

  if (offer.directDeposit.required) {
    return typeof offer.directDeposit.minimumAmount === 'number'
      ? `Route ${formatBankingCurrency(offer.directDeposit.minimumAmount)}+ in qualifying payroll.`
      : 'Route qualifying payroll direct deposit.';
  }

  if (offer.accountType === 'savings' && typeof offer.minimumOpeningDeposit === 'number') {
    return `Move ${formatBankingCurrency(offer.minimumOpeningDeposit)} in fresh funds.`;
  }

  if (offer.requiredActions.some((action) => /debit/i.test(action))) {
    return 'Complete the required debit activity.';
  }

  if (offer.requiredActions.some((action) => /e-?statement/i.test(action))) {
    return 'Enroll in e-statements and finish the activity step.';
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    return `Open with ${formatBankingCurrency(offer.minimumOpeningDeposit)}.`;
  }

  const firstAction = trimTrailingPunctuation(offer.requiredActions[0] ?? '');
  if (firstAction.length > 0 && firstAction.length <= 60) {
    return `${firstAction}.`;
  }

  return 'Complete the required activity step.';
}

export function getBankingOfferPrimaryConstraint(offer: BankingBonusRecord) {
  if (offer.stateRestrictions && offer.stateRestrictions.length > 0) {
    return offer.stateRestrictions.length <= 3
      ? `Only for ${formatList(offer.stateRestrictions)} residents.`
      : `State-limited to ${offer.stateRestrictions.length} states.`;
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000) {
    return `Locks up ${formatBankingCurrency(offer.minimumOpeningDeposit)} in cash.`;
  }

  if (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays > 0) {
    const timeline = getBankingOfferTimeline(offer);
    return timeline.isKnown
      ? `Keep the account open for ${timeline.label.toLowerCase()}.`
      : 'Confirm the hold period in the live terms.';
  }

  if (offer.requiredActions.length > 1) {
    return `${offer.requiredActions.length} requirements to track.`;
  }

  if (offer.estimatedFees > 0) {
    return `Avoid about ${formatBankingCurrency(offer.estimatedFees)} in fees.`;
  }

  return offer.directDeposit.required
    ? 'Payroll setup must code as qualifying.'
    : 'Confirm the live terms before opening.';
}

export function getBankingOfferWhyInteresting(offer: BankingBonusListItem) {
  const netValue = formatBankingCurrency(offer.estimatedNetValue);

  if (offer.accountType === 'bundle') {
    return `The appeal here is payout density: you are taking on a more involved setup, but the combined offer still models to ${netValue} after estimated fees. For people willing to manage both accounts together, that can beat stacking multiple smaller bonus paths.`;
  }

  if (
    offer.accountType === 'savings' &&
    typeof offer.minimumOpeningDeposit === 'number' &&
    offer.minimumOpeningDeposit >= 10000
  ) {
    return `This is a cash-deployment play more than a behavior change. If you already have idle funds, you can trade that balance for a modeled ${netValue} net return without rerouting payroll.`;
  }

  if (!offer.directDeposit.required && (offer.minimumOpeningDeposit ?? 0) <= 2000) {
    return `The strongest part of this offer is the execution profile: a modeled ${netValue} net value without payroll rerouting and without a heavy upfront funding requirement. That makes it easier to complete cleanly than many checking bonuses.`;
  }

  if (offer.directDeposit.required) {
    return `This is a classic checking-bonus execution page: the upside is meaningful if payroll routing is easy for you and the bonus still clears fees. The model lands at about ${netValue} net, so the decision is really about operational fit, not just the headline.`;
  }

  return `The value proposition is straightforward: a modeled ${netValue} net return with a manageable set of requirements. The real question is whether the steps fit your current cash flow and attention budget.`;
}

export function getBankingOfferBestFit(offer: BankingBonusRecord): string[] {
  const bullets: string[] = [];
  const timeline = getBankingOfferTimeline(offer);

  if (offer.directDeposit.required) {
    bullets.push(
      typeof offer.directDeposit.minimumAmount === 'number'
        ? `You can route at least ${formatBankingCurrency(offer.directDeposit.minimumAmount)} in qualifying direct deposit without disrupting your main bank setup.`
        : 'You can route a qualifying payroll or employer direct deposit without extra hassle.'
    );
  } else {
    bullets.push('You want a bonus path that does not depend on rerouting payroll.');
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    bullets.push(
      `You can keep ${formatBankingCurrency(offer.minimumOpeningDeposit)} parked without stressing your working cash.`
    );
  } else {
    bullets.push('You prefer offers that do not require a meaningful opening balance.');
  }

  if (offer.stateRestrictions && offer.stateRestrictions.length > 0) {
    bullets.push(`You are eligible in ${formatList(offer.stateRestrictions)}.`);
  } else if (offer.accountType === 'bundle') {
    bullets.push('You are willing to manage two new accounts at once for a larger combined payout.');
  } else if (offer.accountType === 'savings') {
    bullets.push('You would rather move cash than change everyday banking habits or card spend.');
  } else {
    bullets.push(
      timeline.isKnown
        ? `You can keep another checking account open for about ${timeline.label.toLowerCase()} without needing a quick exit.`
        : 'You are comfortable monitoring the live offer terms and payout timing yourself.'
    );
  }

  return bullets.slice(0, 3);
}

export function getBankingOfferThinkTwiceIf(offer: BankingBonusRecord): string[] {
  const bullets: string[] = [];

  if (offer.directDeposit.required) {
    bullets.push('Your payroll setup makes qualifying direct deposit hard to move or hard to verify.');
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit >= 10000) {
    bullets.push(
      `Tying up ${formatBankingCurrency(offer.minimumOpeningDeposit)} in fresh funds feels too expensive for the payout.`
    );
  } else if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    bullets.push(
      `You do not want to commit ${formatBankingCurrency(offer.minimumOpeningDeposit)} to a new bank account.`
    );
  }

  if (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays >= 120) {
    bullets.push('You prefer faster-turn bonuses instead of multi-month hold periods.');
  }

  if (offer.stateRestrictions && offer.stateRestrictions.length > 0) {
    bullets.push('You are outside the listed eligible states or may move during the qualification window.');
  }

  if (offer.estimatedFees > 0) {
    bullets.push(
      `Missing the fee waiver would eat about ${formatBankingCurrency(offer.estimatedFees)} of the modeled value.`
    );
  }

  if (offer.requiredActions.length >= 2) {
    bullets.push('You want a near-hands-off offer with only one step to track.');
  }

  if (bullets.length === 0) {
    bullets.push('You are not willing to track dates and keep a copy of the live offer terms.');
  }

  return bullets.slice(0, 3);
}

export function getBankingOfferGotchas(offer: BankingBonusListItem): string[] {
  const items: string[] = [];

  if (offer.directDeposit.required) {
    items.push(
      typeof offer.directDeposit.minimumAmount === 'number'
        ? `The offer depends on qualifying direct deposits totaling at least ${formatBankingCurrency(offer.directDeposit.minimumAmount)}.`
        : 'The offer depends on a qualifying direct deposit, and not every ACH transfer will count.'
    );
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    items.push(
      `Opening or funding requires at least ${formatBankingCurrency(offer.minimumOpeningDeposit)}, which reduces flexibility while the bonus is open.`
    );
  }

  if (typeof offer.holdingPeriodDays === 'number') {
    items.push(
      `Do not treat the account as finished until roughly day ${offer.holdingPeriodDays}; early closure can wipe out the payout.`
    );
  }

  if (offer.stateRestrictions && offer.stateRestrictions.length > 0) {
    items.push(`Eligibility is limited to ${formatList(offer.stateRestrictions)}.`);
  }

  if (offer.estimatedFees > 0) {
    items.push(
      `Estimated net value already assumes about ${formatBankingCurrency(offer.estimatedFees)} in fees, so missed waivers can shrink real value further.`
    );
  }

  if (offer.notes) {
    items.push(`${trimTrailingPunctuation(offer.notes)}.`);
  }

  if (items.length === 0) {
    items.push('Terms, payout timing, and qualifying transaction rules can change, so confirm the live offer before you start.');
  }

  return items.slice(0, 4);
}

export function getBankingOfferChecklist(offer: BankingBonusRecord): BankingOfferChecklistStep[] {
  const steps: BankingOfferChecklistStep[] = [];
  const timeline = getBankingOfferTimeline(offer);

  steps.push({
    timing: 'At opening',
    title:
      offer.accountType === 'bundle'
        ? 'Open both required accounts'
        : `Open the ${formatBankingAccountType(offer.accountType).toLowerCase()} account`,
    detail:
      typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0
        ? `Fund it with at least ${formatBankingCurrency(offer.minimumOpeningDeposit)} and save a copy of the offer terms before you begin.`
        : 'Save the confirmation email and a copy of the live offer terms before you begin.'
  });

  if (offer.directDeposit.required) {
    steps.push({
      timing: 'During qualification window',
      title: 'Route qualifying direct deposit',
      detail:
        typeof offer.directDeposit.minimumAmount === 'number'
          ? `Send at least ${formatBankingCurrency(offer.directDeposit.minimumAmount)} in qualifying payroll or employer direct deposits and verify the bank counts it correctly.`
          : 'Make sure at least one qualifying payroll or employer direct deposit lands before the deadline.'
    });
  }

  offer.requiredActions
    .filter((action) => !(offer.directDeposit.required && action.toLowerCase().includes('direct deposit')))
    .forEach((action, index, actions) => {
      steps.push({
        timing: 'During qualification window',
        title: actions.length === 1 ? 'Complete the activity requirement' : `Complete requirement ${index + 1}`,
        detail: `${trimTrailingPunctuation(action)}.`
      });
    });

  steps.push({
    timing: offer.holdingPeriodDays ? `Through day ${offer.holdingPeriodDays}` : 'Before closing',
    title: 'Keep the account open until the bonus is safe',
    detail: timeline.isKnown
      ? `Plan on about ${timeline.label.toLowerCase()} before you consider the offer done. Wait for the bonus to post before you move money or close the account.`
      : 'Do not close or drain the account until the bonus posts and the live terms say the account is safe to exit.'
  });

  return steps;
}

function toRecordFromDb(row: DbBankingBonusRow): BankingBonusRecord {
  const stateRestrictions = row.stateRestrictions.map((state) => state.trim().toUpperCase());

  return {
    slug: row.slug,
    bankName: row.bankName,
    offerName: row.offerName,
    accountType: accountTypeFromDb[row.accountType],
    headline: row.headline,
    imageUrl: row.imageUrl ?? undefined,
    bonusAmount: Number(row.bonusAmount),
    estimatedFees: Number(row.estimatedFees),
    directDeposit: {
      required: row.directDepositRequired,
      ...(row.directDepositRequired && row.directDepositMinimumAmount != null
        ? { minimumAmount: Number(row.directDepositMinimumAmount) }
        : {})
    },
    minimumOpeningDeposit:
      row.minimumOpeningDeposit != null ? Number(row.minimumOpeningDeposit) : undefined,
    holdingPeriodDays: row.holdingPeriodDays ?? undefined,
    requiredActions: row.requiredActions,
    stateRestrictions: stateRestrictions.length > 0 ? stateRestrictions : undefined,
    notes: row.notes ?? undefined,
    offerUrl: row.offerUrl ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
    isActive: row.isActive,
    lastVerified: row.lastVerified.toISOString()
  };
}

function getActiveSeedBankingBonuses(): BankingBonusListItem[] {
  return sortByNetValueDesc(
    bankingBonusSeedData.filter((record) => record.isActive).map(toListItem)
  );
}

function shouldUseDbSource(): boolean {
  if (!isDatabaseConfigured()) return false;
  if (getNodeEnv() === 'test') return false;
  return true;
}

async function getActiveDbBankingBonuses(): Promise<BankingBonusListItem[]> {
  const rows = await db.bankingBonus.findMany({
    where: { isActive: true },
    orderBy: [{ bankName: 'asc' }, { offerName: 'asc' }]
  });

  return sortByNetValueDesc(rows.map(toRecordFromDb).map(toListItem));
}

export function getBankingOfferRequirements(offer: BankingBonusRecord): string[] {
  const requirements: string[] = [];

  if (offer.directDeposit.required) {
    const amount =
      typeof offer.directDeposit.minimumAmount === 'number'
        ? ` of at least $${offer.directDeposit.minimumAmount.toLocaleString()}`
        : '';
    requirements.push(`Qualifying direct deposit${amount}`);
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    requirements.push(`Open with at least $${offer.minimumOpeningDeposit.toLocaleString()}`);
  }

  if (typeof offer.holdingPeriodDays === 'number' && offer.holdingPeriodDays > 0) {
    requirements.push(`Keep account open for ${offer.holdingPeriodDays} days`);
  }

  requirements.push(...offer.requiredActions);
  return requirements;
}

export async function getBankingBonusesData(): Promise<{
  bonuses: BankingBonusListItem[];
  source: BankingBonusesDataSource;
}> {
  if (!shouldUseDbSource()) {
    return {
      bonuses: getActiveSeedBankingBonuses(),
      source: 'seed'
    };
  }

  try {
    const dbBonuses = await getActiveDbBankingBonuses();
    if (dbBonuses.length > 0) {
      return {
        bonuses: dbBonuses,
        source: 'db'
      };
    }
  } catch (error) {
    console.error('[banking-bonuses] failed to load DB offers; falling back to seed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    bonuses: getActiveSeedBankingBonuses(),
    source: 'seed'
  };
}

export async function getBankingBonusBySlug(slug: string): Promise<BankingBonusListItem | null> {
  if (shouldUseDbSource()) {
    try {
      const dbOffer = await db.bankingBonus.findFirst({
        where: { slug, isActive: true }
      });
      if (dbOffer) {
        return toListItem(toRecordFromDb(dbOffer));
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB offer by slug; falling back to seed', {
        slug,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getActiveSeedBankingBonuses().find((bonus) => bonus.slug === slug) ?? null;
}

export async function getAllBankingBonusSlugs(): Promise<string[]> {
  if (shouldUseDbSource()) {
    try {
      const rows = await db.bankingBonus.findMany({
        where: { isActive: true },
        select: { slug: true }
      });
      if (rows.length > 0) {
        return rows.map((row) => row.slug);
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB slugs; falling back to seed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getActiveSeedBankingBonuses().map((bonus) => bonus.slug);
}

export function filterBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: BankingBonusesQuery
): BankingBonusListItem[] {
  return bonuses.filter((bonus) => {
    if (query.accountType && bonus.accountType !== query.accountType) {
      return false;
    }

    if (query.requiresDirectDeposit === 'yes' && !bonus.directDeposit.required) {
      return false;
    }

    if (query.requiresDirectDeposit === 'no' && bonus.directDeposit.required) {
      return false;
    }

    if (query.difficulty && getBankingOfferDifficulty(bonus).level !== query.difficulty) {
      return false;
    }

    if (
      query.cashRequirement &&
      getBankingOfferCashRequirementLevel(bonus) !== query.cashRequirement
    ) {
      return false;
    }

    if (query.timeline && getBankingOfferTimelineBucket(bonus) !== query.timeline) {
      return false;
    }

    if (query.stateLimited === 'yes' && (!bonus.stateRestrictions || bonus.stateRestrictions.length === 0)) {
      return false;
    }

    if (query.stateLimited === 'no' && bonus.stateRestrictions && bonus.stateRestrictions.length > 0) {
      return false;
    }

    if (
      query.state &&
      bonus.stateRestrictions &&
      bonus.stateRestrictions.length > 0 &&
      !bonus.stateRestrictions.includes(query.state)
    ) {
      return false;
    }

    return true;
  });
}

export function sortBankingBonuses(
  bonuses: BankingBonusListItem[],
  sort: BankingBonusesSort = 'net'
): BankingBonusListItem[] {
  return [...bonuses].sort((left, right) => {
    if (sort === 'easy') {
      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      const directDepositDelta = Number(left.directDeposit.required) - Number(right.directDeposit.required);
      if (directDepositDelta !== 0) return directDepositDelta;

      const depositDelta = getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
      if (depositDelta !== 0) return depositDelta;

      const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
      if (timelineDelta !== 0) return timelineDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    if (sort === 'fast') {
      const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
      if (timelineDelta !== 0) return timelineDelta;

      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    if (sort === 'low_cash') {
      const depositDelta = getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
      if (depositDelta !== 0) return depositDelta;

      const directDepositDelta = Number(left.directDeposit.required) - Number(right.directDeposit.required);
      if (directDepositDelta !== 0) return directDepositDelta;

      const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return right.estimatedNetValue - left.estimatedNetValue;
    }

    const netDelta = right.estimatedNetValue - left.estimatedNetValue;
    if (netDelta !== 0) return netDelta;

    const difficultyDelta = getBankingOfferDifficultyScore(left) - getBankingOfferDifficultyScore(right);
    if (difficultyDelta !== 0) return difficultyDelta;

    const timelineDelta = getHoldingPeriodForSort(left) - getHoldingPeriodForSort(right);
    if (timelineDelta !== 0) return timelineDelta;

    return getOpeningDepositAmount(left) - getOpeningDepositAmount(right);
  });
}

export function paginateBankingBonuses(
  bonuses: BankingBonusListItem[],
  query: Pick<BankingBonusesQuery, 'limit' | 'offset'>
): BankingBonusListItem[] {
  return bonuses.slice(query.offset, query.offset + query.limit);
}
