import { describe, expect, it } from 'vitest';
import {
  getCardImageDisplay,
  getCardImagePresentation
} from '../card-image-presentation';

describe('getCardImagePresentation', () => {
  it('defaults remote card art to a moderate full-bleed treatment', () => {
    expect(
      getCardImagePresentation(
        'capital-one-venture-rewards',
        'https://ecm.capitalone.com/WCM/card/products/venture-card-art.png',
        'card_art'
      )
    ).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.04,
      imgClassName: 'bg-transparent p-0'
    });
  });

  it('keeps the stronger zoom for Wells Fargo marketplace card art', () => {
    expect(
      getCardImagePresentation(
        'wells-fargo-active-cash',
        'https://creditcards.wellsfargo.com/W-Card-MarketPlace/v3-10-26/images/Products/ActiveCash/WF_ActiveCash_VS_Collateral_Front_RGB.png',
        'card_art'
      )
    ).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.08,
      imgClassName: 'bg-transparent p-0'
    });
  });

  it('keeps curated local fallback card art slightly less zoomed', () => {
    expect(
      getCardImagePresentation('discover-it-cash-back', '/card-logos/discover.svg', 'card_art')
    ).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.02,
      imgClassName: 'bg-transparent p-0'
    });
  });

  it('keeps issuer-logo fallbacks inset by default', () => {
    expect(
      getCardImagePresentation('us-bank-altitude-reserve', '/bank-logos/us-bank.svg', 'brand_logo')
    ).toMatchObject({
      fit: 'contain',
      position: 'center center',
      scale: 1.02,
      imgClassName: 'bg-black/10 px-5 py-3'
    });
  });

  it('uses a white plaque for the official Chase logo fallback asset', () => {
    expect(
      getCardImagePresentation(
        'chase-ihg-one-rewards-premier-business',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg',
        'brand_logo'
      )
    ).toMatchObject({
      imgClassName: 'bg-white px-4 py-2',
      scale: 1.08
    });
  });
});

describe('getCardImageDisplay', () => {
  it('falls back to a wordmark when no renderable image is available', () => {
    expect(
      getCardImageDisplay({
        slug: 'some-card',
        name: 'Test Rewards Card',
        issuer: 'Test Bank',
        imageAssetType: 'text_fallback'
      })
    ).toMatchObject({
      src: undefined,
      fallbackVariant: 'wordmark',
      imageAssetType: 'text_fallback'
    });
  });
});
