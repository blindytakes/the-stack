import { describe, expect, it } from 'vitest';
import { resolveCardBrandImageUrl } from '../cards/fallback-enrichment';
import { isLowValueCardImageUrl } from '../entity-image-source';

describe('resolveCardBrandImageUrl', () => {
  it('uses curated local issuer assets for previously weak fallback issuers', () => {
    expect(resolveCardBrandImageUrl('American Express')).toBe('/card-logos/american-express.svg');
    expect(resolveCardBrandImageUrl('Apple')).toBe('/card-logos/apple.svg');
    expect(resolveCardBrandImageUrl('Barclays')).toBe('/card-logos/barclays.svg');
    expect(resolveCardBrandImageUrl('Chase')).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
    expect(resolveCardBrandImageUrl('Citi')).toBe('/card-logos/citi.svg');
    expect(resolveCardBrandImageUrl('Discover')).toBe('/card-logos/discover.svg');
    expect(resolveCardBrandImageUrl('Fidelity')).toBe('/card-logos/fidelity.svg');
    expect(resolveCardBrandImageUrl('PayPal')).toBe('/card-logos/paypal.svg');
    expect(resolveCardBrandImageUrl('Robinhood')).toBe('/card-logos/robinhood.svg');
    expect(resolveCardBrandImageUrl('Venmo')).toBe('/card-logos/venmo.svg');
  });

  it('reuses banking-brand fallbacks when there is no curated card logo', () => {
    const usBank = resolveCardBrandImageUrl('U.S. Bank');

    expect(usBank).toBe('/bank-logos/us-bank.svg');
    expect(isLowValueCardImageUrl(usBank)).toBe(false);
  });

  it('preserves explicit card imagery when a record already has imageUrl', () => {
    expect(resolveCardBrandImageUrl('American Express', 'https://assets.example.com/card.png')).toBe(
      'https://assets.example.com/card.png'
    );
  });

  it('replaces Chase header/footer logo URLs with the curated card logo', () => {
    expect(
      resolveCardBrandImageUrl(
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'Chase Sapphire Preferred Card'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });

  it('keeps Chase co-branded cards on the Chase logo when art is missing', () => {
    expect(resolveCardBrandImageUrl('Chase', undefined, 'IHG One Rewards Premier Business Credit Card')).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
    expect(
      resolveCardBrandImageUrl(
        'Chase',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'United Quest Card'
      )
    ).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });
});
