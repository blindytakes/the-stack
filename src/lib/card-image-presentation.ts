import { getCardFallbackLabel } from '@/lib/card-image-fallback';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { CHASE_CARD_LOGO_URL } from '@/lib/cards/fallback-enrichment';
import type { CardImageAssetType } from '@/lib/cards/schema';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';

const LEGACY_WELLS_FARGO_LOGO_URL =
  'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png';

export type CardImagePresentation = {
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
  imgClassName?: string;
};

export type CardImageDisplay = {
  alt: string;
  src?: string;
  label: string;
  fallbackVariant: 'initials' | 'wordmark';
  imageAssetType: CardImageAssetType;
  presentation: CardImagePresentation;
};

const defaultPresentationByAssetType: Record<CardImageAssetType, Required<CardImagePresentation>> = {
  card_art: {
    fit: 'cover',
    position: 'center center',
    scale: 1,
    imgClassName: 'bg-transparent p-0'
  },
  brand_logo: {
    fit: 'contain',
    position: 'center center',
    scale: 1.02,
    imgClassName: 'bg-black/10 px-5 py-3'
  },
  text_fallback: {
    fit: 'contain',
    position: 'center center',
    scale: 1,
    imgClassName: 'bg-black/10 p-0'
  }
};

const presentationBySlug: Record<string, CardImagePresentation> = {
  'discover-it-cash-back': {
    scale: 1.02,
    imgClassName: 'bg-transparent p-0'
  }
};

function getImageUrlPresentation(
  imageUrl: string | undefined,
  imageAssetType: CardImageAssetType
): CardImagePresentation | null {
  if (!imageUrl) return null;
  const normalizedImageUrl = imageUrl.toLowerCase();

  if (imageUrl === CHASE_CARD_LOGO_URL) {
    return {
      imgClassName: 'bg-white px-4 py-2',
      scale: 1.08
    };
  }

  if (imageAssetType === 'card_art' && imageUrl.startsWith('/card-logos/')) {
    return {
      scale: 1.02,
      imgClassName: 'bg-transparent p-0'
    };
  }

  if (
    imageAssetType === 'card_art' &&
    normalizedImageUrl.includes('creditcards.wellsfargo.com/w-card-marketplace/')
  ) {
    return {
      scale: 1.08,
      imgClassName: 'bg-transparent p-0'
    };
  }

  return null;
}

function normalizeCardImageAssetType(
  imageAssetType?: CardImageAssetType,
  imageUrl?: string | null,
  issuer?: string
): CardImageAssetType {
  if (imageAssetType) return imageAssetType;
  if (!imageUrl || isLowValueCardImageUrl(imageUrl)) return 'text_fallback';

  const normalizedImageUrl = imageUrl.trim().toLowerCase();
  const normalizedIssuer = issuer?.trim().toLowerCase();
  const normalizedIssuerLogoUrl = issuer
    ? resolveBankingBrandImageUrl(issuer)?.trim().toLowerCase()
    : null;
  if (
    normalizedImageUrl === CHASE_CARD_LOGO_URL.toLowerCase() ||
    normalizedImageUrl.includes('/bank-logos/') ||
    (normalizedIssuer === 'wells fargo' &&
      normalizedImageUrl === LEGACY_WELLS_FARGO_LOGO_URL.toLowerCase()) ||
    (normalizedIssuerLogoUrl != null && normalizedImageUrl === normalizedIssuerLogoUrl)
  ) {
    return 'brand_logo';
  }

  return 'card_art';
}

export function getCardImagePresentation(
  slug: string,
  imageUrl?: string | null,
  imageAssetType?: CardImageAssetType,
  issuer?: string
): CardImagePresentation {
  const normalizedImageUrl = imageUrl?.trim();
  const normalizedAssetType = normalizeCardImageAssetType(imageAssetType, normalizedImageUrl, issuer);
  const basePresentation = defaultPresentationByAssetType[normalizedAssetType];
  const slugPresentation = presentationBySlug[slug];
  const imagePresentation = getImageUrlPresentation(normalizedImageUrl, normalizedAssetType);

  return {
    fit: slugPresentation?.fit ?? imagePresentation?.fit ?? basePresentation.fit,
    position: slugPresentation?.position ?? imagePresentation?.position ?? basePresentation.position,
    scale: slugPresentation?.scale ?? imagePresentation?.scale ?? basePresentation.scale,
    imgClassName:
      slugPresentation?.imgClassName ?? imagePresentation?.imgClassName ?? basePresentation.imgClassName
  };
}

export function getCardImageDisplay(input: {
  slug: string;
  name: string;
  issuer: string;
  imageUrl?: string | null;
  imageAssetType?: CardImageAssetType;
}): CardImageDisplay {
  const normalizedImageUrl = input.imageUrl?.trim();
  const normalizedAssetType = normalizeCardImageAssetType(
    input.imageAssetType,
    normalizedImageUrl,
    input.issuer
  );
  const hasImage = normalizedAssetType !== 'text_fallback' && Boolean(normalizedImageUrl);

  return {
    alt: `${input.name} ${normalizedAssetType === 'brand_logo' ? 'logo' : 'card art'}`,
    src: hasImage ? normalizedImageUrl : undefined,
    label: hasImage ? input.name : getCardFallbackLabel(input.name, input.issuer),
    fallbackVariant: hasImage ? 'initials' : 'wordmark',
    imageAssetType: normalizedAssetType,
    presentation: getCardImagePresentation(
      input.slug,
      normalizedImageUrl,
      normalizedAssetType,
      input.issuer
    )
  };
}
