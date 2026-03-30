export type CardImagePresentation = {
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
  imgClassName?: string;
};

const CHASE_LOGO_URL =
  'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg';

const presentationBySlug: Record<string, CardImagePresentation> = {
  'discover-it-cash-back': {
    fit: 'cover',
    position: 'center center',
    scale: 1.08,
    imgClassName: 'p-0'
  }
};

const presentationByImageUrl: Record<string, CardImagePresentation> = {
  [CHASE_LOGO_URL]: {
    imgClassName: 'bg-white px-4 py-2',
    scale: 1.08
  }
};

export function getCardImagePresentation(
  slug: string,
  imageUrl?: string | null
): CardImagePresentation | null {
  return presentationBySlug[slug] ?? (imageUrl ? presentationByImageUrl[imageUrl] ?? null : null);
}
