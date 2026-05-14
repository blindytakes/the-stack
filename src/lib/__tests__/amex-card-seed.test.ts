import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cardsSeedDatasetSchema, type CardSeedRecord } from '../card-seed-schema';

function loadCards(fileName: string): CardSeedRecord[] {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'content', fileName), 'utf8')
  ) as { cards: unknown };

  return cardsSeedDatasetSchema.parse(raw.cards);
}

describe('American Express card seed offers', () => {
  it('keeps Amex Gold populated with its current variable welcome offer', () => {
    const cards = loadCards('cards-foundation.json');
    const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));

    expect(cardsBySlug.get('amex-gold-card')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 1000,
      bonusType: 'points',
      bonusPoints: 100000,
      spendRequired: 8000,
      spendPeriodDays: 180,
      isCurrentOffer: true,
      displayHeadline: 'Up to 100,000 Membership Rewards points'
    });
    expect(
      cardsBySlug.get('amex-gold-card')?.signUpBonuses?.[0]?.displayDescription
    ).toContain('Welcome offers vary.');
  });

  it('models Membership Rewards cards as points products with current Amex travel earn rows', () => {
    const cards = loadCards('cards-foundation.json');
    const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
    const gold = cardsBySlug.get('amex-gold-card');
    const platinum = cardsBySlug.get('amex-platinum-card');

    expect(gold?.rewardType).toBe('points');
    expect(gold?.topCategories).toEqual(['dining', 'groceries', 'travel']);
    expect(gold?.rewards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'travel',
          rate: 5,
          rateType: 'points',
          notes: expect.stringContaining('prepaid hotels')
        }),
        expect.objectContaining({
          category: 'travel',
          rate: 2,
          rateType: 'points',
          notes: expect.stringContaining('car rentals and cruises')
        })
      ])
    );

    expect(platinum?.rewardType).toBe('points');
    expect(platinum?.topCategories).toEqual(['travel']);
  });
});
