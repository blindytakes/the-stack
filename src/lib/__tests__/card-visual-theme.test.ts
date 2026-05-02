import { describe, expect, it } from 'vitest';
import { getCardVisualTheme } from '../card-visual-theme';

describe('getCardVisualTheme', () => {
  it('uses a curated product accent for known card slugs', () => {
    expect(
      getCardVisualTheme({
        slug: 'amex-gold-card',
        name: 'American Express Gold Card',
        issuer: 'American Express'
      })
    ).toEqual({
      accentRgb: '212 168 83',
      accentTextRgb: '236 196 105'
    });
  });

  it('prefers card-specific co-brand color over issuer color', () => {
    expect(
      getCardVisualTheme({
        slug: 'chase-united-explorer',
        name: 'United Explorer Card',
        issuer: 'Chase'
      })
    ).toEqual({
      accentRgb: '21 89 168',
      accentTextRgb: '104 175 255'
    });
  });

  it('falls back to the issuer accent when the slug is unknown', () => {
    expect(
      getCardVisualTheme({
        slug: 'future-chase-card',
        name: 'Future Chase Card',
        issuer: 'Chase'
      })
    ).toEqual({
      accentRgb: '0 94 184',
      accentTextRgb: '112 180 255'
    });
  });

  it('falls back to a neutral white accent for unknown issuers', () => {
    expect(
      getCardVisualTheme({
        slug: 'unknown-card',
        name: 'Unknown Card',
        issuer: 'Unknown Bank'
      })
    ).toEqual({
      accentRgb: '255 255 255',
      accentTextRgb: '255 255 255'
    });
  });
});
