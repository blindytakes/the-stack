import { describe, expect, it } from 'vitest';
import { isLowValueCardImageUrl } from '../entity-image-source';

describe('isLowValueCardImageUrl', () => {
  it('treats favicon-style issuer assets as low-value card-slot images', () => {
    expect(
      isLowValueCardImageUrl('https://www.chase.com/etc/designs/chase-ux/favicon-152.png')
    ).toBe(true);
    expect(
      isLowValueCardImageUrl(
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
      )
    ).toBe(true);
    expect(
      isLowValueCardImageUrl(
        'https://www.bankofamerica.com/homepage/spa-assets/images/assets-images-global-favicon-apple-touch-icon-CSX889b28c.png'
      )
    ).toBe(true);
    expect(
      isLowValueCardImageUrl(
        'https://www.usbank.com/etc.clientlibs/ecm-global/clientlibs/clientlib-resources/resources/images/svg/logo-personal.svg'
      )
    ).toBe(true);
  });

  it('treats bank favicon-style assets as low-value card images', () => {
    expect(
      isLowValueCardImageUrl(
        'https://www.pnc.com/etc.clientlibs/pnc-aem-base/clientlibs/clientlib-site/resources/apple-touch-icon.png'
      )
    ).toBe(true);
    expect(isLowValueCardImageUrl('https://www.sofi.com/favicon.ico')).toBe(true);
  });

  it('keeps real card art URLs eligible for the cards grid', () => {
    expect(
      isLowValueCardImageUrl('https://ecm.capitalone.com/WCM/card/products/new-savor-card-art.png')
    ).toBe(false);
    expect(
      isLowValueCardImageUrl(
        'https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/ink_business_premier_card.png'
      )
    ).toBe(false);
    expect(
      isLowValueCardImageUrl(
        'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png'
      )
    ).toBe(false);
  });

  it('returns false when there is no image URL', () => {
    expect(isLowValueCardImageUrl()).toBe(false);
    expect(isLowValueCardImageUrl(null)).toBe(false);
  });
});
