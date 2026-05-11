import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import type { BankingBonusListItem, BankingBonusRecord } from '@/lib/banking/schema';

const curatedOfferUrlBySlug: Record<string, string> = {
  'alliant-ultimate-opportunity-savings-100':
    'https://promo.alliantcreditunion.org/ultimate-opportunity-savings'
};

const curatedApySourceUrlBySlug: Record<string, string> = {
  'key-select-checking-500':
    'https://www.key.com/personal/checking/key-select-checking-account.html',
  'pnc-virtual-wallet-performance-select-400':
    'https://www.pnc.com/content/dam/pnc-com/pdf/personal/Checking/fees-vw-performance-select-A.pdf'
};

const bmoBusinessCheckingCanonicalSlug = 'bmo-business-checking-1500';
const bmoBusinessCheckingLegacySlugs = new Set([
  'bmo-digital-business-checking-1000',
  'bmo-simple-business-checking-1000',
  'bmo-premium-business-checking-1000',
  'bmo-elite-business-checking-1000'
]);
const bmoBusinessCheckingRequiredActions = [
  'Open a new eligible BMO business checking account by August 31, 2026 through the business checking offer page.',
  'Eligible accounts include Digital, Simple, Premium, and Elite Business Checking.',
  'Keep at least $100,000 in the account on day 30 and maintain at least $100,000 from day 31 through day 90 to earn the $1,500 top tier.'
];
const bmoBusinessCheckingNotes =
  "BMO's official business checking offer page advertised one up-to-$1,500 offer across eligible business checking accounts from May 1, 2026 through August 31, 2026 when re-verified on May 10, 2026. Lower tiers include $400 with $4,000, $750 with $25,000, and $1,000 with $50,000. The directory consolidates the account variants into one offer because the promo is mutually exclusive in practice; fee estimates use the lowest listed monthly maintenance fee among the eligible accounts.";

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

export function resolveBankingApySourceUrl(slug: string, apySourceUrl?: string) {
  return curatedApySourceUrlBySlug[slug] ?? apySourceUrl;
}

export function isSupersededBankingBonusSlug(slug: string): boolean {
  return bmoBusinessCheckingLegacySlugs.has(slug);
}

export function isConsolidatedBankingBonusSlug(slug: string): boolean {
  return slug === bmoBusinessCheckingCanonicalSlug;
}

function isBmoBusinessCheckingVariant(slug: string): boolean {
  return slug === bmoBusinessCheckingCanonicalSlug || bmoBusinessCheckingLegacySlugs.has(slug);
}

export function consolidateBankingBonusSlugs(slugs: string[]): string[] {
  let hasBmoBusinessChecking = false;
  const consolidatedSlugs: string[] = [];

  for (const slug of slugs) {
    if (isBmoBusinessCheckingVariant(slug)) {
      hasBmoBusinessChecking = true;
      continue;
    }

    consolidatedSlugs.push(slug);
  }

  if (hasBmoBusinessChecking) {
    consolidatedSlugs.push(bmoBusinessCheckingCanonicalSlug);
  }

  return consolidatedSlugs;
}

function buildBmoBusinessCheckingOffer(
  variants: BankingBonusListItem[]
): BankingBonusListItem {
  const representative = [...variants].sort(
    (a, b) => a.estimatedFees - b.estimatedFees || a.offerName.localeCompare(b.offerName)
  )[0];

  return {
    ...representative,
    slug: bmoBusinessCheckingCanonicalSlug,
    offerName: 'Business Checking Bonus',
    headline:
      'Earn up to $1,500 after opening an eligible BMO business checking account and maintaining the qualifying balance tier.',
    bonusAmount: 1500,
    estimatedFees: 10,
    directDeposit: { required: false },
    minimumOpeningDeposit: 100000,
    holdingPeriodDays: 90,
    requiredActions: bmoBusinessCheckingRequiredActions,
    notes: bmoBusinessCheckingNotes,
    estimatedNetValue: 1490
  };
}

export function consolidateBankingBonusVariants(
  bonuses: BankingBonusListItem[]
): BankingBonusListItem[] {
  const bmoBusinessCheckingVariants = bonuses.filter((bonus) =>
    isBmoBusinessCheckingVariant(bonus.slug)
  );

  if (bmoBusinessCheckingVariants.length === 0) {
    return bonuses;
  }

  const canonicalBmoOffer =
    bmoBusinessCheckingVariants.find((bonus) => bonus.slug === bmoBusinessCheckingCanonicalSlug) ??
    buildBmoBusinessCheckingOffer(bmoBusinessCheckingVariants);

  return [
    ...bonuses.filter((bonus) => !isBmoBusinessCheckingVariant(bonus.slug)),
    canonicalBmoOffer
  ];
}

export function toBankingBonusListItem(record: BankingBonusRecord): BankingBonusListItem {
  return {
    ...record,
    imageUrl: resolveBankingBrandImageUrl(record.bankName, record.imageUrl),
    apySourceUrl: resolveBankingApySourceUrl(record.slug, record.apySourceUrl),
    offerUrl: resolveBankingOfferUrl(record.slug, record.offerUrl),
    estimatedNetValue: Number((record.bonusAmount - record.estimatedFees).toFixed(2))
  };
}
