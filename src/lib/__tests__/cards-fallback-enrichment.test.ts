import { describe, expect, it } from 'vitest';
import { resolveCardBrandImageUrl, resolveCardImage } from '../cards/fallback-enrichment';
import { isLowValueCardImageUrl } from '../entity-image-source';

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

  it('uses slug-specific art for curated co-brand cards', () => {
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
    expect(
      resolveCardBrandImageUrl(
        'chase-united-quest',
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'United Quest Card'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });
});

describe('resolveCardImage', () => {
  it('classifies curated card-style fallback art as card art', () => {
    expect(resolveCardImage('alaska-airlines-visa-signature', 'Bank of America')).toMatchObject({
      imageUrl: '/card-logos/alaska-airlines.svg',
      imageAssetType: 'card_art'
    });
    expect(resolveCardImage('discover-it-cash-back', 'Discover')).toMatchObject({
      imageUrl: '/card-logos/discover.svg',
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

  it('classifies explicit issuer logo URLs as brand logos', () => {
    expect(
      resolveCardImage(
        'wells-fargo-autograph-journey',
        'Wells Fargo',
        'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png',
        'Wells Fargo Autograph Journey Card'
      )
    ).toMatchObject({
      imageUrl: 'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png',
      imageAssetType: 'brand_logo'
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
