import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cardsSeedDatasetSchema, type CardSeedRecord } from '../card-seed-schema';

const cardSeedFiles = [
  'cards-foundation.json',
  'cards-expansion.json',
  'cards-expansion-batch-2.json'
] as const;

const knownNoPublicWelcomeOfferSlugs = new Set([
  'apple-card',
  'robinhood-gold-card',
  'us-bank-smartly-visa-signature',
  'us-bank-business-shield',
  'sofi-unlimited-2-credit-card',
  'paypal-cashback-mastercard',
  'fidelity-rewards-visa-signature',
  'venmo-credit-card'
]);

function loadCards(fileName: string): CardSeedRecord[] {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'content', fileName), 'utf8')
  ) as { cards: unknown };

  return cardsSeedDatasetSchema.parse(raw.cards);
}

function loadAllCards() {
  return cardSeedFiles.flatMap((fileName) => loadCards(fileName));
}

function currentBonusFor(card: CardSeedRecord | undefined) {
  return card?.signUpBonuses?.find((bonus) => bonus.isCurrentOffer !== false);
}

describe('card offer audit coverage', () => {
  it('keeps card rewardType aligned with seeded reward rows', () => {
    const mismatches = loadAllCards()
      .filter((card) => (card.rewards ?? []).length > 0)
      .filter((card) => (card.rewards ?? []).every((reward) => reward.rateType !== card.rewardType))
      .map((card) => card.slug);

    expect(mismatches).toEqual([]);
  });

  it('has no unexpected active card records missing a current welcome offer', () => {
    const missingUnexpected = loadAllCards()
      .filter((card) => card.isActive !== false)
      .filter((card) => !currentBonusFor(card))
      .filter((card) => !knownNoPublicWelcomeOfferSlugs.has(card.slug))
      .map((card) => card.slug);

    expect(missingUnexpected).toEqual([]);
  });

  it.each([
    ['bilt-mastercard', 100, undefined, 0, 1],
    ['chase-ihg-one-rewards-traveler', 625, 125000, 4000, 180],
    ['capital-one-ventureone-rewards', 200, 20000, 500, 90],
    ['amex-business-gold-card', 2000, 200000, 15000, 90],
    ['amex-business-platinum-card', 3000, 300000, 20000, 90],
    ['amex-blue-business-cash', 250, undefined, 3000, 90],
    ['amex-business-green-rewards', 150, 15000, 3000, 90],
    ['amex-hilton-honors-business', 520, 130000, 6000, 180],
    ['us-bank-triple-cash-rewards-business', 750, undefined, 6000, 180],
    ['us-bank-business-altitude-power', 750, 75000, 10000, 120],
    ['us-bank-business-leverage', 600, undefined, 6000, 120],
    ['bank-of-america-business-advantage-customized-cash-rewards', 500, undefined, 5000, 90],
    ['bank-of-america-business-advantage-unlimited-cash-rewards', 500, undefined, 5000, 90],
    ['bank-of-america-business-advantage-travel-rewards', 500, 50000, 5000, 90],
    ['citi-aadvantage-platinum-select', 500, 50000, 2500, 90],
    ['citi-aadvantage-executive', 700, 70000, 7000, 90],
    ['citi-aadvantage-business', 650, 65000, 4000, 120],
    ['citi-strata-card', 200, 20000, 1000, 90],
    ['barclays-jetblue-card', 100, 10000, 1000, 90],
    ['discover-it-miles', 0, undefined, 0, 365]
  ])(
    'keeps the audited welcome offer populated for %s',
    (slug, bonusValue, bonusPoints, spendRequired, spendPeriodDays) => {
      const cardsBySlug = new Map(loadAllCards().map((card) => [card.slug, card]));
      const expected: Record<string, unknown> = {
        bonusValue,
        spendRequired,
        spendPeriodDays,
        isCurrentOffer: true
      };

      if (bonusPoints !== undefined) expected.bonusPoints = bonusPoints;

      expect(currentBonusFor(cardsBySlug.get(slug as string))).toMatchObject(expected);
    }
  );
});
