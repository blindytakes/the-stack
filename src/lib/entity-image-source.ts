const LOW_VALUE_CARD_IMAGE_TOKENS = [
  'favicon',
  'apple-touch-icon',
  'logo-personal.svg',
  'logo_chase_headerfooter.svg'
] as const;

export function isLowValueCardImageUrl(url?: string | null) {
  if (!url) return false;

  const normalizedUrl = url.trim().toLowerCase();
  if (!normalizedUrl) return false;
  if (normalizedUrl.endsWith('.ico')) return true;

  return LOW_VALUE_CARD_IMAGE_TOKENS.some((token) => normalizedUrl.includes(token));
}
