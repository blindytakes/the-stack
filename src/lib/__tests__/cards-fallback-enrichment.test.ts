import { describe, expect, it } from 'vitest';
import {
  resolveCardBrandImageUrl,
  resolveCardFallbackBenefits,
  resolveCardImage
} from '../cards/fallback-enrichment';
import { isLowValueCardImageUrl } from '../entity-image-source';

const AMEX_GREEN_CARD_ART_URL =
  'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/green-card.png';
const CHASE_UNITED_QUEST_CARD_ART_URL =
  'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/united_quest_card_tilted.png';
const WELLS_FARGO_AUTOGRAPH_JOURNEY_CARD_ART_URL =
  'https://creditcards.wellsfargo.com/W-Card-MarketPlace/v4-29-26/images/Products/AutographJourney/WF_Autograph_Journey_Card_d.png';

describe('resolveCardBrandImageUrl', () => {
  it('uses curated local issuer assets for previously weak fallback issuers', () => {
    expect(resolveCardBrandImageUrl('amex-gold-card', 'American Express')).toBe('/card-logos/american-express.svg');
    expect(resolveCardBrandImageUrl('apple-card', 'Apple')).toBe('/card-logos/apple.svg');
    expect(resolveCardBrandImageUrl('barclays-arrival-plus', 'Barclays')).toBe('/card-logos/barclays.svg');
    expect(resolveCardBrandImageUrl('chase-sapphire-preferred', 'Chase')).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
    expect(resolveCardBrandImageUrl('citi-strata-premier', 'Citi')).toBe('/card-logos/citi.svg');
    expect(resolveCardBrandImageUrl('discover-it-cash-back', 'Discover')).toBe('/card-logos/discover.svg');
    expect(resolveCardBrandImageUrl('fidelity-rewards-visa', 'Fidelity')).toBe('/card-logos/fidelity.svg');
    expect(resolveCardBrandImageUrl('paypal-cashback-mastercard', 'PayPal')).toBe('/card-logos/paypal.svg');
    expect(resolveCardBrandImageUrl('robinhood-gold-card', 'Robinhood')).toBe('/card-logos/robinhood.svg');
    expect(resolveCardBrandImageUrl('venmo-credit-card', 'Venmo')).toBe('/card-logos/venmo.svg');
  });

  it('reuses banking-brand fallbacks when there is no curated card logo', () => {
    const usBank = resolveCardBrandImageUrl('us-bank-altitude-reserve', 'U.S. Bank');

    expect(usBank).toBe('/bank-logos/us-bank.svg');
    expect(isLowValueCardImageUrl(usBank)).toBe(false);
  });

  it('preserves explicit card imagery when a record already has imageUrl', () => {
    expect(resolveCardBrandImageUrl('amex-gold-card', 'American Express', 'https://assets.example.com/card.png')).toBe(
      'https://assets.example.com/card.png'
    );
  });

  it('replaces issuer-logo fallbacks with slug-specific card art', () => {
    expect(
      resolveCardBrandImageUrl(
        'amex-green-card',
        'American Express',
        '/card-logos/american-express.svg',
        'American Express Green Card'
      )
    ).toBe(AMEX_GREEN_CARD_ART_URL);
  });

  it('uses slug-specific art for curated co-brand cards', () => {
    expect(resolveCardBrandImageUrl('amex-green-card', 'American Express')).toBe(
      AMEX_GREEN_CARD_ART_URL
    );
    expect(resolveCardBrandImageUrl('alaska-airlines-visa-signature', 'Bank of America')).toBe(
      '/card-logos/alaska-airlines.svg'
    );
    expect(
      resolveCardBrandImageUrl(
        'bank-of-america-business-advantage-customized-cash-rewards',
        'Bank of America',
        undefined,
        'Business Advantage Customized Cash Rewards Mastercard credit card'
      )
    ).toBe(
      'https://www1.bac-assets.com/homepage/spa-assets/images/assets-images-global-logos-bac-logo-v2-CSX3648cbbb.svg'
    );
    expect(resolveCardBrandImageUrl('barclays-jetblue-card', 'Barclays')).toBe('/card-logos/jetblue.svg');
    expect(resolveCardBrandImageUrl('barclays-jetblue-plus', 'Barclays')).toBe('/card-logos/jetblue.svg');
    expect(resolveCardBrandImageUrl('barclays-wyndham-earner-plus', 'Barclays')).toBe(
      '/bank-logos/barclays.svg'
    );
    expect(resolveCardBrandImageUrl('barclays-aadvantage-aviator-red', 'Barclays')).toBe(
      '/card-logos/aviator-red.svg'
    );
    expect(resolveCardBrandImageUrl('chase-united-quest', 'Chase')).toBe(
      CHASE_UNITED_QUEST_CARD_ART_URL
    );
    expect(resolveCardBrandImageUrl('wells-fargo-autograph-journey', 'Wells Fargo')).toBe(
      WELLS_FARGO_AUTOGRAPH_JOURNEY_CARD_ART_URL
    );
  });

  it('replaces Chase header/footer logo URLs with the curated card logo', () => {
    expect(
      resolveCardBrandImageUrl(
        'chase-sapphire-preferred',
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'Chase Sapphire Preferred Card'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });

  it('keeps Chase co-branded cards on the Chase logo when art is missing', () => {
    expect(
      resolveCardBrandImageUrl(
        'chase-ihg-one-rewards-premier-business',
        'Chase',
        undefined,
        'IHG One Rewards Premier Business Credit Card'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });

  it('replaces the Chase logo with United Quest card art', () => {
    expect(
      resolveCardBrandImageUrl(
        'chase-united-quest',
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'United Quest Card'
      )
    ).toBe(CHASE_UNITED_QUEST_CARD_ART_URL);
  });
});

describe('resolveCardImage', () => {
  it('classifies curated card-style fallback art as card art', () => {
    expect(
      resolveCardImage(
        'amex-green-card',
        'American Express',
        '/card-logos/american-express.svg',
        'American Express Green Card'
      )
    ).toMatchObject({
      imageUrl: AMEX_GREEN_CARD_ART_URL,
      imageAssetType: 'card_art'
    });
    expect(resolveCardImage('alaska-airlines-visa-signature', 'Bank of America')).toMatchObject({
      imageUrl: '/card-logos/alaska-airlines.svg',
      imageAssetType: 'card_art'
    });
    expect(resolveCardImage('chase-united-quest', 'Chase')).toMatchObject({
      imageUrl: CHASE_UNITED_QUEST_CARD_ART_URL,
      imageAssetType: 'card_art'
    });
    expect(resolveCardImage('discover-it-cash-back', 'Discover')).toMatchObject({
      imageUrl: '/card-logos/discover.svg',
      imageAssetType: 'card_art'
    });
    expect(resolveCardImage('wells-fargo-autograph-journey', 'Wells Fargo')).toMatchObject({
      imageUrl: WELLS_FARGO_AUTOGRAPH_JOURNEY_CARD_ART_URL,
      imageAssetType: 'card_art'
    });
  });

  it('classifies issuer logo fallbacks as brand logos', () => {
    expect(
      resolveCardImage(
        'chase-ihg-one-rewards-premier-business',
        'Chase',
        undefined,
        'IHG One Rewards Premier Business Credit Card'
      )
    ).toMatchObject({
      imageUrl:
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
      imageAssetType: 'brand_logo'
    });
  });

  it('replaces explicit issuer logo URLs with slug-specific card art', () => {
    expect(
      resolveCardImage(
        'wells-fargo-autograph-journey',
        'Wells Fargo',
        'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png',
        'Wells Fargo Autograph Journey Card'
      )
    ).toMatchObject({
      imageUrl: WELLS_FARGO_AUTOGRAPH_JOURNEY_CARD_ART_URL,
      imageAssetType: 'card_art'
    });
  });

  it('classifies bank-logo slug overrides as brand logos', () => {
    expect(
      resolveCardImage(
        'bank-of-america-business-advantage-unlimited-cash-rewards',
        'Bank of America'
      )
    ).toMatchObject({
      imageUrl:
        'https://www1.bac-assets.com/homepage/spa-assets/images/assets-images-global-logos-bac-logo-v2-CSX3648cbbb.svg',
      imageAssetType: 'brand_logo'
    });
    expect(resolveCardImage('barclays-wyndham-earner-plus', 'Barclays')).toMatchObject({
      imageUrl: '/bank-logos/barclays.svg',
      imageAssetType: 'brand_logo'
    });
  });

  it('drops unresolved low-value image URLs to text fallback', () => {
    expect(
      resolveCardImage(
        'unknown-card',
        'Unknown Bank',
        'https://www.sofi.com/favicon.ico',
        'Some Co-Branded Card'
      )
    ).toEqual({
      imageAssetType: 'text_fallback'
    });
  });
});

describe('resolveCardFallbackBenefits', () => {
  it('prices United Quest recurring credits for comparison fallback math', () => {
    const benefits = resolveCardFallbackBenefits({
      slug: 'chase-united-quest',
      issuer: 'Chase',
      name: 'United Quest Card',
      cardType: 'personal',
      annualFee: 350,
      foreignTxFee: 0,
      rewardType: 'miles',
      topCategories: ['travel', 'dining', 'all']
    });

    expect(benefits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'TRAVEL_CREDITS',
          name: 'United Quest Annual Partner Credits',
          estimatedValue: 860
        }),
        expect.objectContaining({
          category: 'TSA_GLOBAL_ENTRY',
          name: 'Global Entry, TSA PreCheck, or NEXUS Fee Credit',
          estimatedValue: 30
        })
      ])
    );
  });

  it('prices United business-card partner credits without trusted traveler value', () => {
    const benefits = resolveCardFallbackBenefits({
      slug: 'chase-united-business',
      issuer: 'Chase',
      name: 'United Business Card',
      cardType: 'business',
      annualFee: 150,
      foreignTxFee: 0,
      rewardType: 'miles',
      topCategories: ['travel', 'all']
    });

    expect(benefits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'TRAVEL_CREDITS',
          name: 'United Business Annual Partner Credits',
          estimatedValue: 620
        })
      ])
    );
    expect(benefits.some((benefit) => benefit.category === 'TSA_GLOBAL_ENTRY')).toBe(false);
  });
});
