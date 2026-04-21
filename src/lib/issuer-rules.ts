import type { CardRecord } from '@/lib/cards';
import type { Chase524Status } from '@/lib/planner/types';

export type CardIssuerEligibilityReason = 'amex_lifetime_rule' | 'chase_5_24';
type CardIssuerEligibilityInput = {
  amexLifetimeBlockedSlugs: string[];
  chase524Status: Chase524Status;
};

const AMEX_ISSUER = 'American Express';
const CHASE_ISSUER = 'Chase';

export function isAmexCard(card: Pick<CardRecord, 'issuer'>): boolean {
  return card.issuer === AMEX_ISSUER;
}

export function isChaseCard(card: Pick<CardRecord, 'issuer'>): boolean {
  return card.issuer === CHASE_ISSUER;
}

export function getCardIssuerEligibilityReasons(
  card: Pick<CardRecord, 'slug' | 'issuer'>,
  input: CardIssuerEligibilityInput
): CardIssuerEligibilityReason[] {
  const reasons: CardIssuerEligibilityReason[] = [];

  if (isAmexCard(card) && input.amexLifetimeBlockedSlugs.includes(card.slug)) {
    reasons.push('amex_lifetime_rule');
  }

  if (isChaseCard(card) && input.chase524Status === 'at_or_over_5_24') {
    reasons.push('chase_5_24');
  }

  return reasons;
}

export function isCardBlockedByIssuerRules(
  card: Pick<CardRecord, 'slug' | 'issuer'>,
  input: CardIssuerEligibilityInput
): boolean {
  return getCardIssuerEligibilityReasons(card, input).length > 0;
}
