import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bankingBonusesSeedDatasetSchema,
  type BankingBonusSeedRecord
} from '../banking-bonus-seed-schema';

const bankingSeedFiles = [
  'banking-bonuses.json',
  'banking-bonuses-business-expansion.json'
] as const;

const auditReferenceDate = new Date('2026-05-10T12:00:00.000-04:00');

function loadBankingBonuses(fileName: string): BankingBonusSeedRecord[] {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'content', fileName), 'utf8')
  ) as unknown;

  return bankingBonusesSeedDatasetSchema.parse(raw);
}

function loadAllBankingBonuses() {
  return bankingSeedFiles.flatMap((fileName) => loadBankingBonuses(fileName));
}

function isExpiredAtAuditDate(record: BankingBonusSeedRecord) {
  if (!record.expiresAt) return false;
  return new Date(record.expiresAt).getTime() < auditReferenceDate.getTime();
}

describe('banking offer audit coverage', () => {
  it('has no active banking records that were expired on the audit date', () => {
    const expiredActiveSlugs = loadAllBankingBonuses()
      .filter((record) => record.isActive !== false)
      .filter(isExpiredAtAuditDate)
      .map((record) => record.slug);

    expect(expiredActiveSlugs).toEqual([]);
  });

  it.each([
    ['bmo-smart-advantage-checking-400', 400, 4000, '2026-09-08'],
    ['td-complete-checking-200', 200, 500, '2026-07-30'],
    ['td-beyond-checking-300', 300, 2500, '2026-07-30'],
    ['sofi-checking-savings-300', 400, 1000, '2026-12-31'],
    ['chase-business-complete-checking-500', 500, undefined, '2026-06-18'],
    ['wells-fargo-initiate-business-checking-400', 400, undefined, '2026-07-07'],
    ['wells-fargo-navigate-business-checking-400', 400, undefined, '2026-07-07'],
    ['wells-fargo-optimize-business-checking-400', 400, undefined, '2026-07-07'],
    ['bmo-digital-business-checking-1000', 1500, undefined, '2026-08-31'],
    ['bmo-simple-business-checking-1000', 1500, undefined, '2026-08-31'],
    ['bmo-premium-business-checking-1000', 1500, undefined, '2026-08-31'],
    ['bmo-elite-business-checking-1000', 1500, undefined, '2026-08-31']
  ])(
    'keeps the audited banking offer populated for %s',
    (slug, bonusAmount, directDepositMinimumAmount, expiresOn) => {
      const bonusesBySlug = new Map(loadAllBankingBonuses().map((bonus) => [bonus.slug, bonus]));
      const bonus = bonusesBySlug.get(slug as string);

      expect(bonus).toMatchObject({
        bonusAmount,
        expiresAt: expect.stringContaining(expiresOn as string),
        isActive: true
      });
      if (directDepositMinimumAmount !== undefined) {
        expect(bonus?.directDeposit.minimumAmount).toBe(directDepositMinimumAmount);
      }
    }
  );
});
