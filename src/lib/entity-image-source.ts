const LOW_VALUE_IMAGE_TOKENS = [
  'favicon',
  'apple-touch-icon',
  'logo-personal.svg'
] as const;

export function isLowValueEntityImageUrl(url?: string | null) {
  if (!url) return false;

  const normalizedUrl = url.trim().toLowerCase();
  if (!normalizedUrl) return false;
  if (normalizedUrl.endsWith('.ico')) return true;

  return LOW_VALUE_IMAGE_TOKENS.some((token) => normalizedUrl.includes(token));
}
