import { describe, expect, it } from 'vitest';
import { getCardImagePresentation } from '../card-image-presentation';

describe('getCardImagePresentation', () => {
  it('keeps slug-specific card art presentation rules', () => {
    expect(getCardImagePresentation('discover-it-cash-back')).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.08,
      imgClassName: 'p-0'
    });
    expect(getCardImagePresentation('apple-card')).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.02,
      imgClassName: 'bg-transparent p-0'
    });
    expect(getCardImagePresentation('barclays-jetblue-card')).toMatchObject({
      fit: 'cover',
      position: 'center center',
      scale: 1.02,
      imgClassName: 'bg-transparent p-0'
    });
  });

  it('uses a white plaque for the official Chase logo fallback asset', () => {
    expect(
      getCardImagePresentation(
        'chase-ihg-one-rewards-premier-business',
        'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg'
      )
    ).toMatchObject({
      imgClassName: 'bg-white px-4 py-2',
      scale: 1.08
    });
  });
});
