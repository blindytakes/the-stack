import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { bankingBonusesSeedDatasetSchema } from '@/lib/banking-bonus-seed-schema';
import { readAllCardSeedDatasets } from '@/lib/card-seed-files';
import { resolveCardBrandImageUrl } from '@/lib/cards/fallback-enrichment';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';

type EntityAssetImportDataset = {
  assets: Array<{
    entityType: string;
    slug: string;
  }>;
};

const OFFICIAL_BANKING_HOST_SUFFIXES = [
  'alliantcreditunion.org',
  'axosbank.com',
  'bankofamerica.com',
  'bmo.com',
  'capitalone.com',
  'chase.com',
  'chime.com',
  'citi.com',
  'etrade.com',
  'goldmansachs.com',
  'huntington.com',
  'key.com',
  'marcus.com',
  'pnc.com',
  'sofi.com',
  'td.com',
  'truist.com',
  'usbank.com',
  'wellsfargo.com'
] as const;

const LOW_FIDELITY_BANK_IMAGE_TOKENS = ['favicon', 'apple-touch-icon', 'logo-personal.svg'] as const;
const STALE_THRESHOLD_DAYS = 21;

async function readJson<T>(filePath: string): Promise<T> {
  const resolvedPath = path.join(process.cwd(), filePath);
  const raw = await fs.readFile(resolvedPath, 'utf8');
  return JSON.parse(raw) as T;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-CA', {
    timeZone: process.env.TZ ?? 'America/New_York'
  });
}

function daysOld(isoDate: string | undefined, now: Date) {
  if (!isoDate) return null;
  const diffMs = now.getTime() - new Date(isoDate).getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function isExpired(expiresAt: string | undefined, now: Date) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}

function isOfficialBankingUrl(url: string | undefined) {
  if (!url) return false;

  const hostname = new URL(url).hostname.toLowerCase();
  return OFFICIAL_BANKING_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );
}

function isLowFidelityBankImageUrl(url: string | undefined) {
  if (!url) return true;

  const normalized = url.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.endsWith('.ico')) return true;

  return LOW_FIDELITY_BANK_IMAGE_TOKENS.some((token) => normalized.includes(token));
}

function renderList(items: string[], maxItems = 12) {
  if (items.length === 0) return 'none';
  if (items.length <= maxItems) return items.join(', ');
  const visible = items.slice(0, maxItems).join(', ');
  return `${visible}, +${items.length - maxItems} more`;
}

async function main() {
  const now = new Date();
  const bankingPersonal = bankingBonusesSeedDatasetSchema.parse(
    await readJson<unknown>('content/banking-bonuses.json')
  );
  const bankingBusiness = bankingBonusesSeedDatasetSchema.parse(
    await readJson<unknown>('content/banking-bonuses-business-expansion.json')
  );
  const cardSeedDatasets = await readAllCardSeedDatasets();
  const entityAssets = await readJson<EntityAssetImportDataset>('content/entity-assets.cards.json');

  const allBanking = [...bankingPersonal, ...bankingBusiness];
  const activeBanking = allBanking.filter((record) => record.isActive !== false);
  const activeExpiredBanking = activeBanking.filter((record) => isExpired(record.expiresAt, now));
  const activeBankingWithThirdPartySources = activeBanking.filter(
    (record) => !isOfficialBankingUrl(record.offerUrl)
  );
  const activeBankingWithWeakLogos = activeBanking.filter((record) =>
    isLowFidelityBankImageUrl(resolveBankingBrandImageUrl(record.bankName, record.imageUrl))
  );
  const staleActiveBanking = activeBanking
    .map((record) => ({
      slug: record.slug,
      ageDays: daysOld(record.lastVerified, now)
    }))
    .filter((record) => record.ageDays != null && record.ageDays > STALE_THRESHOLD_DAYS);

  const contentCards = cardSeedDatasets.flatMap((dataset) => dataset.cards);
  const contentCardSlugs = new Set(contentCards.map((record) => record.slug));
  const entityAssetCardSlugs = entityAssets.assets
    .filter((record) => record.entityType === 'card')
    .map((record) => record.slug);
  const entityAssetOnlySlugs = entityAssetCardSlugs.filter((slug) => !contentCardSlugs.has(slug));
  const cardsMissingExplicitImage = contentCards.filter((record) => !record.imageUrl);
  const cardsWithoutCurrentBonus = contentCards.filter(
    (record) => !(record.signUpBonuses ?? []).some((bonus) => bonus.isCurrentOffer !== false)
  );
  const cardsUsingWeakFallbackArtwork = contentCards.filter((record) => {
    if (record.imageUrl) return false;
    return isLowValueCardImageUrl(resolveCardBrandImageUrl(record.slug, record.issuer));
  });
  const staleContentCards = contentCards
    .map((record) => ({
      slug: record.slug,
      ageDays: daysOld(record.lastVerified, now)
    }))
    .filter((record) => record.ageDays != null && record.ageDays > STALE_THRESHOLD_DAYS);

  const lines = [
    '# Catalog Audit',
    '',
    `Generated: ${formatDate(now)}`,
    '',
    '## Banking',
    `- Total records: ${allBanking.length}`,
    `- Active records: ${activeBanking.length}`,
    `- Active-but-expired records: ${activeExpiredBanking.length}`,
    `- Active records with non-official source URLs: ${activeBankingWithThirdPartySources.length}`,
    `- Active records with stale lastVerified (> ${STALE_THRESHOLD_DAYS} days): ${staleActiveBanking.length}`,
    `- Active records with weak or missing effective logos: ${activeBankingWithWeakLogos.length}`,
    `- Expired active slugs: ${renderList(activeExpiredBanking.map((record) => record.slug))}`,
    `- Third-party source slugs: ${renderList(activeBankingWithThirdPartySources.map((record) => record.slug))}`,
    `- Weak-logo banking slugs: ${renderList(activeBankingWithWeakLogos.map((record) => record.slug))}`,
    '',
    '## Cards',
    `- Card seed files: ${cardSeedDatasets.length}`,
    `- Content card records: ${contentCards.length}`,
    `- Entity-asset card records: ${entityAssetCardSlugs.length}`,
    `- Entity-asset-only slugs not represented in content card files: ${entityAssetOnlySlugs.length}`,
    `- Content cards missing explicit imageUrl: ${cardsMissingExplicitImage.length}`,
    `- Content cards without a current sign-up bonus record: ${cardsWithoutCurrentBonus.length}`,
    `- Content cards that degrade to low-value fallback artwork: ${cardsUsingWeakFallbackArtwork.length}`,
    `- Content cards with stale lastVerified (> ${STALE_THRESHOLD_DAYS} days): ${staleContentCards.length}`,
    `- Entity-asset-only slugs: ${renderList(entityAssetOnlySlugs)}`,
    `- No-current-bonus slugs: ${renderList(cardsWithoutCurrentBonus.map((record) => record.slug))}`,
    `- Weak-fallback-art slugs: ${renderList(cardsUsingWeakFallbackArtwork.map((record) => record.slug))}`
  ];

  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error('[catalog:audit] failed', error);
  process.exit(1);
});
