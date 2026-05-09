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

describe('United card seed offers', () => {
  it('keeps current United welcome offers populated across the lineup', () => {
    const cards = [
      ...loadCards('cards-expansion.json'),
      ...loadCards('cards-expansion-batch-2.json')
    ];
    const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));

    expect(cardsBySlug.get('chase-united-gateway')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 400,
      bonusPoints: 40000,
      spendRequired: 1000,
      displayHeadline: 'Earn up to 40,000 bonus miles'
    });
    expect(cardsBySlug.get('chase-united-explorer')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 800,
      bonusPoints: 80000,
      spendRequired: 3000,
      displayHeadline: 'Earn up to 80,000 bonus miles'
    });
    expect(cardsBySlug.get('chase-united-quest')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 1000,
      bonusPoints: 100000,
      spendRequired: 4000,
      displayHeadline: 'Earn up to 100,000 bonus miles + 3,000 Premier qualifying points'
    });
    expect(cardsBySlug.get('chase-united-club')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 1100,
      bonusPoints: 110000,
      spendRequired: 5000,
      displayHeadline: 'Earn up to 110,000 bonus miles + 3,000 Premier qualifying points'
    });
    expect(cardsBySlug.get('chase-united-business')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 1100,
      bonusPoints: 110000,
      spendRequired: 5000,
      displayHeadline: 'Earn up to 110,000 bonus miles + 2,000 Premier qualifying points'
    });
    expect(cardsBySlug.get('chase-united-club-business')?.signUpBonuses?.[0]).toMatchObject({
      bonusValue: 1100,
      bonusPoints: 110000,
      spendRequired: 5000,
      displayHeadline: 'Earn up to 110,000 bonus miles + 2,000 Premier qualifying points'
    });
  });
});
