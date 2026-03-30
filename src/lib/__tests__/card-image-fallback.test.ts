import { describe, expect, it } from 'vitest';
import { cardNameReferencesIssuer, getCardFallbackLabel } from '../card-image-fallback';

describe('cardNameReferencesIssuer', () => {
  it('allows issuer-logo fallbacks for issuer-branded cards', () => {
    expect(cardNameReferencesIssuer('Chase Sapphire Preferred Card', 'Chase')).toBe(true);
    expect(cardNameReferencesIssuer('The Platinum Card from American Express', 'American Express')).toBe(
      true
    );
    expect(cardNameReferencesIssuer('U.S. Bank Altitude Reserve Visa Infinite Card', 'U.S. Bank')).toBe(
      true
    );
  });

  it('keeps Chase cards on the Chase-logo fallback even for co-brands', () => {
    expect(cardNameReferencesIssuer('IHG One Rewards Premier Business Credit Card', 'Chase')).toBe(true);
    expect(cardNameReferencesIssuer('United Quest Card', 'Chase')).toBe(true);
  });

  it('blocks issuer-logo fallbacks for non-Chase co-branded cards', () => {
    expect(cardNameReferencesIssuer('AAdvantage Aviator Red World Elite Mastercard', 'Barclays')).toBe(
      false
    );
  });
});

describe('getCardFallbackLabel', () => {
  it('extracts a concise label for co-branded cards', () => {
    expect(getCardFallbackLabel('IHG One Rewards Premier Business Credit Card', 'Chase')).toBe('IHG');
    expect(getCardFallbackLabel('United Quest Card', 'Chase')).toBe('United Quest');
    expect(getCardFallbackLabel('World of Hyatt Business Credit Card', 'Chase')).toBe('Hyatt');
  });
});
