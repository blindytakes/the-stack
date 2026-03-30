import { describe, expect, it } from 'vitest';
import { getBankingImagePresentation } from '../banking-image-presentation';

describe('getBankingImagePresentation', () => {
  it('returns configured logo presentation for known banks', () => {
    expect(getBankingImagePresentation('Bank of America')).toMatchObject({
      imgClassName:
        'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-7 py-4',
      scale: 1.14
    });
    expect(getBankingImagePresentation('Chase')).toMatchObject({
      imgClassName: 'bg-white px-4 py-2',
      compactImgClassName: 'bg-white px-2.5 py-1.5',
      miniImgClassName: 'bg-white px-2 py-1',
      microImgClassName: 'bg-white px-1 py-0.5',
      scale: 1.08
    });
    expect(getBankingImagePresentation('U.S. Bank')).toMatchObject({
      imgClassName:
        'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-5 py-4',
      compactImgClassName:
        'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-2 py-2',
      microImgClassName:
        'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-1 py-1.5'
    });
  });

  it('normalizes names and leaves unknown banks untouched', () => {
    expect(getBankingImagePresentation('  Huntington Bank  ')).toMatchObject({
      scale: 1.28
    });
    expect(getBankingImagePresentation('Summit National Bank')).toBeNull();
  });
});
