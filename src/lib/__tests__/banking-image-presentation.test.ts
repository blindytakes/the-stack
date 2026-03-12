import { describe, expect, it } from 'vitest';
import { getBankingImagePresentation } from '../banking-image-presentation';

describe('getBankingImagePresentation', () => {
  it('returns configured logo presentation for known banks', () => {
    expect(getBankingImagePresentation('Bank of America')).toMatchObject({
      scale: 1.2
    });
    expect(getBankingImagePresentation('U.S. Bank')).toMatchObject({
      imgClassName: 'bg-black/10 px-5 py-4'
    });
  });

  it('normalizes names and leaves unknown banks untouched', () => {
    expect(getBankingImagePresentation('  Huntington Bank  ')).toMatchObject({
      scale: 1.28
    });
    expect(getBankingImagePresentation('Summit National Bank')).toBeNull();
  });
});
