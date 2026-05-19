const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

function replaceControlChars(text: string): string {
  let normalized = '';

  for (const char of text) {
    const code = char.charCodeAt(0);
    const isUnsafeControl =
      (code >= 0 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127;

    normalized += isUnsafeControl ? ' ' : char;
  }

  return normalized;
}

export function normalizeAssistantText(text: string): string {
  return replaceControlChars(text.normalize('NFKC').replace(ZERO_WIDTH_CHARS, ''));
}
