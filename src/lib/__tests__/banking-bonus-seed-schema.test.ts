import { describe, expect, it } from 'vitest';
import { bankingBonusSeedRecordSchema } from '../banking-bonus-seed-schema';

describe('bankingBonusSeedRecordSchema', () => {
  it('accepts hosted image URLs', () => {
    const parsed = bankingBonusSeedRecordSchema.safeParse({
      slug: 'test-bank-offer',
      bankName: 'Test Bank',
      offerName: 'Checking Bonus',
      accountType: 'checking',
      headline: 'Open an account and complete the steps.',
      imageUrl: 'https://assets.example.com/test-bank-logo.png',
      bonusAmount: 300,
      apyPercent: 4.1,
      apyDisplay: '4.10% APY',
      apySourceUrl: 'https://www.example.com/rates',
      apyAsOf: '2026-03-19',
      requiredActions: ['Open an account']
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects non-http image URLs', () => {
    const parsed = bankingBonusSeedRecordSchema.safeParse({
      slug: 'test-bank-offer',
      bankName: 'Test Bank',
      offerName: 'Checking Bonus',
      accountType: 'checking',
      headline: 'Open an account and complete the steps.',
      imageUrl: 'javascript:alert(1)',
      bonusAmount: 300,
      requiredActions: ['Open an account']
    });

    expect(parsed.success).toBe(false);
  });
});
