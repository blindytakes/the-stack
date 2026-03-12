export type CardImagePresentation = {
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
  imgClassName?: string;
};

const presentationBySlug: Record<string, CardImagePresentation> = {
  'discover-it-cash-back': {
    fit: 'cover',
    position: 'center center',
    scale: 1.08,
    imgClassName: 'p-0'
  }
};

export function getCardImagePresentation(slug: string): CardImagePresentation | null {
  return presentationBySlug[slug] ?? null;
}
