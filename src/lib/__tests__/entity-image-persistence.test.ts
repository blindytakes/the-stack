import { describe, expect, it } from 'vitest';
import {
  resolvePersistedBankingImageUrl,
  resolvePersistedCardImageUrl
} from '../entity-image-persistence';

describe('resolvePersistedBankingImageUrl', () => {
  it('fills known banking brands when the record is missing imageUrl', () => {
    expect(resolvePersistedBankingImageUrl('Capital One')).toBe('/bank-logos/capital-one.svg');
    expect(resolvePersistedBankingImageUrl('Chase')).toBe(
      'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
    );
  });

  it('upgrades known broken or low-fidelity banking image URLs before persistence', () => {
    expect(
      resolvePersistedBankingImageUrl(
        'Alliant Credit Union',
        'https://www.alliantcreditunion.org/resources/favicon.ico'
      )
    ).toBe('https://www.alliantcreditunion.org/assets/dist/images/logo.png');
    expect(
      resolvePersistedBankingImageUrl(
        'Citibank',
        'https://www.citi.com/cbol-hp-static-assets/assets/favicon.ico'
      )
    ).toBe('/bank-logos/citi.svg');
  });
});

describe('resolvePersistedCardImageUrl', () => {
  it('stores curated fallback art for cards with missing imageUrl', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'discover-it-cash-back',
        issuer: 'Discover',
        name: 'Discover it Cash Back'
      })
    ).toBe('/card-logos/discover.svg');
  });

  it('stores slug-specific issuer logos for known unresolved cards', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'bank-of-america-business-advantage-travel-rewards',
        issuer: 'Bank of America',
        name: 'Business Advantage Travel Rewards World Mastercard credit card'
      })
    ).toBe(
      'https://www1.bac-assets.com/homepage/spa-assets/images/assets-images-global-logos-bac-logo-v2-CSX3648cbbb.svg'
    );
    expect(
      resolvePersistedCardImageUrl({
        slug: 'barclays-wyndham-earner-plus',
        issuer: 'Barclays',
        name: 'Wyndham Rewards Earner Plus Card'
      })
    ).toBe('/bank-logos/barclays.svg');
  });

  it('stores issuer-brand fallbacks for cards with only weak image URLs', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'amex-gold-card',
        issuer: 'American Express',
        name: 'American Express Gold Card',
        imageUrl: 'https://www.americanexpress.com/favicon.ico'
      })
    ).toBe('/card-logos/american-express.svg');
  });

  it('preserves explicit card art that is not favicon-style junk', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'alaska-airlines-visa-signature',
        issuer: 'Bank of America',
        name: 'Alaska Airlines Visa Signature',
        imageUrl:
          'https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/1bbt_sigcm_v_atmos_ascent_250.png'
      })
    ).toBe(
      'https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/1bbt_sigcm_v_atmos_ascent_250.png'
    );
  });

  it('preserves strong explicit card art URLs', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'amex-gold-card',
        issuer: 'American Express',
        name: 'American Express Gold Card',
        imageUrl: 'https://assets.example.com/amex-gold-card.png'
      })
    ).toBe('https://assets.example.com/amex-gold-card.png');
  });

  it('leaves unknown issuers unresolved when there is no fallback', () => {
    expect(
      resolvePersistedCardImageUrl({
        slug: 'unknown-card',
        issuer: 'Unknown Bank',
        name: 'Mystery Rewards Card',
        imageUrl: 'https://www.example.com/favicon.ico'
      })
    ).toBeUndefined();
  });

  it('replaces low-fidelity banking icons with canonical banking logos', () => {
    expect(resolvePersistedBankingImageUrl('Wells Fargo')).toBe(
      'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png'
    );
    expect(
      resolvePersistedBankingImageUrl(
        'Wells Fargo',
        'https://www17.wellsfargomedia.com/assets/images/icons/apple-touch-icon_120x120.png'
      )
    ).toBe('https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png');
  });
});
