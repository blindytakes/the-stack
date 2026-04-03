import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCardDetail, fetchCardList } from '../cards-client';

describe('cards-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts relative asset paths in card list responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              slug: 'alaska-airlines-visa-signature',
              name: 'Alaska Airlines Visa Signature',
              issuer: 'Bank of America',
              imageUrl: '/card-logos/alaska-airlines.svg',
              imageAssetType: 'card_art',
              cardType: 'personal',
              rewardType: 'miles',
              topCategories: ['travel'],
              annualFee: 95,
              creditTierMin: 'good',
              headline: 'Travel rewards card',
              totalBenefitsValue: 0,
              plannerBenefitsValue: 0
            }
          ]
        })
      })
    );

    const cards = await fetchCardList();

    expect(cards[0]?.imageUrl).toBe('/card-logos/alaska-airlines.svg');
  });

  it('accepts relative asset paths in card detail responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          card: {
            slug: 'alaska-airlines-visa-signature',
            name: 'Alaska Airlines Visa Signature',
            issuer: 'Bank of America',
            imageUrl: '/card-logos/alaska-airlines.svg',
            imageAssetType: 'card_art',
            cardType: 'personal',
            rewardType: 'miles',
            topCategories: ['travel'],
            annualFee: 95,
            creditTierMin: 'good',
            headline: 'Travel rewards card',
            totalBenefitsValue: 0,
            plannerBenefitsValue: 0,
            foreignTxFee: 0,
            rewards: [],
            signUpBonuses: [],
            benefits: [],
            transferPartners: []
          }
        })
      })
    );

    const card = await fetchCardDetail('alaska-airlines-visa-signature');

    expect(card.imageUrl).toBe('/card-logos/alaska-airlines.svg');
  });
});
