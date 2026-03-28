import { describe, expect, it } from 'vitest';
import { isLowValueEntityImageUrl } from '../entity-image-source';

describe('isLowValueEntityImageUrl', () => {
  it('treats favicon-style issuer assets as low-value grid images', () => {
    expect(
      isLowValueEntityImageUrl('https://www.chase.com/etc/designs/chase-ux/favicon-152.png')
    ).toBe(true);
    expect(
      isLowValueEntityImageUrl(
        'https://www.bankofamerica.com/homepage/spa-assets/images/assets-images-global-favicon-apple-touch-icon-CSX889b28c.png'
      )
    ).toBe(true);
    expect(
      isLowValueEntityImageUrl(
        'https://www.usbank.com/etc.clientlibs/ecm-global/clientlibs/clientlib-resources/resources/images/svg/logo-personal.svg'
      )
    ).toBe(true);
  });

  it('treats bank favicon-style assets as low-value images', () => {
    expect(
      isLowValueEntityImageUrl(
        'https://www.pnc.com/etc.clientlibs/pnc-aem-base/clientlibs/clientlib-site/resources/apple-touch-icon.png'
      )
    ).toBe(true);
    expect(
      isLowValueEntityImageUrl('https://www.sofi.com/favicon.ico')
    ).toBe(true);
  });

  it('keeps real card art URLs eligible for the cards grid', () => {
    expect(
      isLowValueEntityImageUrl('https://ecm.capitalone.com/WCM/card/products/new-savor-card-art.png')
    ).toBe(false);
    expect(
      isLowValueEntityImageUrl(
        'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png'
      )
    ).toBe(false);
  });

  it('returns false when there is no image URL', () => {
    expect(isLowValueEntityImageUrl()).toBe(false);
    expect(isLowValueEntityImageUrl(null)).toBe(false);
  });
});
