import type {
  BankingBonusListItem,
  BankingBonusRecord,
  BankingOfferChecklistStep
} from '@/lib/banking/schema';
import { getBankingOfferTimeline } from '@/lib/banking/scoring';

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
    ? `for ${timeline.label.toLowerCase()}`
    : 'through the bank’s published qualification window';

  if (offer.accountType === 'bundle') {
    return `This is a bundle play: open both accounts, satisfy the balance and activity rules, and stay organized ${timelineText}.`;
  }

  if (
    offer.accountType === 'savings' &&
    typeof offer.minimumOpeningDeposit === 'number' &&
    offer.minimumOpeningDeposit > 0
  ) {
    return `This is more cash parking than direct-deposit setup: move at least ${formatBankingCurrency(offer.minimumOpeningDeposit)} in fresh funds and leave the account alone ${timelineText}.`;
  }

  if (offer.directDeposit.required && typeof offer.minimumOpeningDeposit === 'number') {
    return `Works best if you can route qualifying direct deposit, fund the account with at least ${formatBankingCurrency(offer.minimumOpeningDeposit)}, and keep it active ${timelineText}.`;
  }

  if (offer.directDeposit.required) {
    return `Works best if you can route qualifying direct deposit and stay on top of the account ${timelineText}.`;
  }

  if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
    return `Works best if you can park at least ${formatBankingCurrency(offer.minimumOpeningDeposit)} without straining working cash and leave the account open ${timelineText}.`;
  }

  return `A lighter execution path: no direct deposit, no large opening deposit, and ${timelineText} of follow-through.`;
}

export function getBankingOfferPrimaryRequirement(offer: BankingBonusRecord) {
  if (offer.accountType === 'bundle') {
    if (offer.directDeposit.required && typeof offer.directDeposit.minimumAmount === 'number') {
      return `Open both accounts and route ${formatBankingCurrency(offer.directDeposit.minimumAmount)}+ in qualifying direct deposit.`;
    }

    if (offer.directDeposit.required) {
      return 'Open both accounts and route qualifying direct deposit.';
    }

    if (typeof offer.minimumOpeningDeposit === 'number' && offer.minimumOpeningDeposit > 0) {
      return `Open both accounts and fund ${formatBankingCurrency(offer.minimumOpeningDeposit)}+.`;
    }

    return 'Open both accounts in one application.';
  }

  if (offer.directDeposit.required) {
    return typeof offer.directDeposit.minimumAmount === 'number'
      ? `Route ${formatBankingCurrency(offer.directDeposit.minimumAmount)}+ in qualifying direct deposit.`
      : 'Route qualifying direct deposit.';
  }

  if (
    offer.accountType === 'savings' &&
    typeof offer.minimumOpeningDeposit === 'number' &&
    offer.minimumOpeningDeposit > 0
  ) {
    return `Move ${formatBankingCurrency(offer.minimumOpeningDeposit)} in fresh funds.`;
  }

  if (offer.accountType === 'savings') {
    if (offer.requiredActions.some((action) => /deposit|fund|balance|new funds/i.test(action))) {
      return 'Fund with qualifying new money and maintain balance.';
    }

    return 'Fund the account and maintain the required balance.';
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
    ? 'Your direct deposit has to code as qualifying.'
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
    return `This is a cash-deployment play more than a behavior change. If you already have idle funds, you can trade that balance for a modeled ${netValue} net return without changing your direct deposit setup.`;
  }

  if (!offer.directDeposit.required && (offer.minimumOpeningDeposit ?? 0) <= 2000) {
    return `The strongest part of this offer is the execution profile: a modeled ${netValue} net value without changing direct deposit and without a heavy upfront funding requirement. That makes it easier to complete cleanly than many checking bonuses.`;
  }

  if (offer.directDeposit.required) {
    return `This is a classic checking-bonus execution page: the upside is meaningful if qualifying direct deposit is easy for you and the bonus still clears fees. The model lands at about ${netValue} net, so the decision is really about operational fit, not just the headline.`;
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
        : 'You can route a qualifying direct deposit without extra hassle.'
    );
  } else {
    bullets.push('You want a bonus path that does not depend on changing direct deposit.');
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
    bullets.push('Your current direct deposit setup makes qualifying direct deposit hard to move or verify.');
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
          ? `Send at least ${formatBankingCurrency(offer.directDeposit.minimumAmount)} in qualifying direct deposits and verify the bank counts them correctly.`
          : 'Make sure at least one qualifying direct deposit lands before the deadline.'
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
