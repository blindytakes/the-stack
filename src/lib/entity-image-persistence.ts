import { resolveBankingBrandImageUrl } from './banking-brand-assets';
import { resolveCardFallbackImageUrl } from './cards/fallback-enrichment';

export type PersistedCardImageInput = {
  slug: string;
  issuer: string;
  name?: string | null;
  imageUrl?: string | null;
};

function normalizePersistedImageUrl(imageUrl?: string | null) {
  const normalizedImageUrl = imageUrl?.trim();
  return normalizedImageUrl ? normalizedImageUrl : undefined;
}

function isLowConfidencePersistedImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  const normalizedImageUrl = imageUrl.trim().toLowerCase();
  if (!normalizedImageUrl) return false;
  if (normalizedImageUrl.endsWith('.ico')) return true;

  return (
    normalizedImageUrl.includes('favicon') ||
    normalizedImageUrl.includes('apple-touch-icon') ||
    normalizedImageUrl.includes('logo-personal.svg')
  );
}

export function resolvePersistedBankingImageUrl(bankName: string, imageUrl?: string | null) {
  const normalizedImageUrl = normalizePersistedImageUrl(imageUrl);
  if (normalizedImageUrl && !isLowConfidencePersistedImageUrl(normalizedImageUrl)) {
    return normalizedImageUrl;
  }

  const canonicalImageUrl = normalizePersistedImageUrl(resolveBankingBrandImageUrl(bankName));
  if (!canonicalImageUrl || isLowConfidencePersistedImageUrl(canonicalImageUrl)) {
    return undefined;
  }

  return canonicalImageUrl;
}

export function resolvePersistedCardImageUrl(input: PersistedCardImageInput) {
  const normalizedImageUrl = normalizePersistedImageUrl(input.imageUrl);
  if (normalizedImageUrl && !isLowConfidencePersistedImageUrl(normalizedImageUrl)) {
    return normalizedImageUrl;
  }

  const fallbackImageUrl = normalizePersistedImageUrl(
    resolveCardFallbackImageUrl(input.slug, input.issuer, input.name ?? undefined)
  );
  if (!fallbackImageUrl || isLowConfidencePersistedImageUrl(fallbackImageUrl)) {
    return undefined;
  }

  return fallbackImageUrl;
}
