import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import type { BankingBonusListItem, BankingBonusRecord } from '@/lib/banking/schema';

const curatedOfferUrlBySlug: Record<string, string> = {
  'alliant-ultimate-opportunity-savings-100':
    'https://promo.alliantcreditunion.org/ultimate-opportunity-savings'
};

export function sortByBonusAmountDesc<T extends BankingBonusListItem>(bonuses: T[]): T[] {
  return [...bonuses].sort(
    (a, b) => b.bonusAmount - a.bonusAmount || b.estimatedNetValue - a.estimatedNetValue
  );
}

export function isOfferExpired(expiresAt?: string, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}

export function resolveBankingOfferUrl(slug: string, offerUrl?: string) {
  return curatedOfferUrlBySlug[slug] ?? offerUrl;
}

export function toBankingBonusListItem(record: BankingBonusRecord): BankingBonusListItem {
  return {
    ...record,
    imageUrl: resolveBankingBrandImageUrl(record.bankName, record.imageUrl),
    offerUrl: resolveBankingOfferUrl(record.slug, record.offerUrl),
    estimatedNetValue: Number((record.bonusAmount - record.estimatedFees).toFixed(2))
  };
}
