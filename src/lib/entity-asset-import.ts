import { z } from 'zod';

const httpUrlSchema = z.string().url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}, 'URL must use http or https');

const storagePathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z0-9/_-]+(?:\.[A-Za-z0-9]+)?$/, {
    message: 'storagePath may only contain letters, numbers, "/", "_", "-", and "."'
  });

const imageFieldShape = {
  sourcePageUrl: httpUrlSchema.optional(),
  sourceImageUrl: httpUrlSchema.optional(),
  storagePath: storagePathSchema.optional()
};

const cardAssetImportRecordSchema = z.object({
  entityType: z.literal('card'),
  slug: z.string().trim().min(1),
  ...imageFieldShape,
  applyUrl: httpUrlSchema.optional(),
  affiliateUrl: httpUrlSchema.optional()
});

const bankingAssetImportRecordSchema = z.object({
  entityType: z.literal('banking_bonus'),
  slug: z.string().trim().min(1),
  ...imageFieldShape,
  offerUrl: httpUrlSchema.optional(),
  affiliateUrl: httpUrlSchema.optional()
});

export const entityAssetImportRecordSchema = z
  .discriminatedUnion('entityType', [
    cardAssetImportRecordSchema,
    bankingAssetImportRecordSchema
  ])
  .superRefine((data, ctx) => {
    if (data.storagePath && !data.sourcePageUrl && !data.sourceImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['storagePath'],
        message: 'storagePath requires sourcePageUrl or sourceImageUrl'
      });
    }

    if (
      data.entityType === 'card' &&
      !data.sourcePageUrl &&
      !data.sourceImageUrl &&
      !data.applyUrl &&
      !data.affiliateUrl
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Each card asset record must include image source fields and/or applyUrl/affiliateUrl'
      });
    }

    if (
      data.entityType === 'banking_bonus' &&
      !data.sourcePageUrl &&
      !data.sourceImageUrl &&
      !data.offerUrl &&
      !data.affiliateUrl
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Each banking asset record must include image source fields and/or offerUrl/affiliateUrl'
      });
    }
  });

export const entityAssetImportDatasetSchema = z.array(entityAssetImportRecordSchema);

export type EntityAssetImportRecord = z.infer<typeof entityAssetImportRecordSchema>;

const tagRegexByName: Record<string, RegExp> = {
  meta: /<meta\b[^>]*>/gi,
  link: /<link\b[^>]*>/gi,
  img: /<img\b[^>]*>/gi
};

const attributeRegex =
  /([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const extensionByContentType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif'
};

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of tag.matchAll(attributeRegex)) {
    const [, rawKey, doubleQuoted, singleQuoted, bare] = match;
    const key = rawKey.toLowerCase();
    const value = doubleQuoted ?? singleQuoted ?? bare ?? '';
    attributes[key] = value;
  }

  return attributes;
}

function getTags(html: string, tagName: keyof typeof tagRegexByName): Array<Record<string, string>> {
  return Array.from(html.matchAll(tagRegexByName[tagName]), (match) => parseAttributes(match[0]));
}

function resolveUrl(baseUrl: string, candidate: string | undefined): string | null {
  if (!candidate) return null;

  try {
    const url = new URL(candidate, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function firstSrcsetCandidate(srcset: string | undefined): string | null {
  if (!srcset) return null;
  const first = srcset.split(',')[0]?.trim();
  if (!first) return null;
  return first.split(/\s+/)[0] ?? null;
}

export function discoverImageUrlFromHtml(pageUrl: string, html: string): string | null {
  const metaTags = getTags(html, 'meta');
  const metaPriority = ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'];

  for (const key of metaPriority) {
    const tag = metaTags.find((attributes) => {
      const property = attributes.property?.toLowerCase();
      const name = attributes.name?.toLowerCase();
      return property === key || name === key;
    });

    const resolved = resolveUrl(pageUrl, tag?.content);
    if (resolved) return resolved;
  }

  const imageSrcLink = getTags(html, 'link').find(
    (attributes) => attributes.rel?.toLowerCase() === 'image_src'
  );
  const linkHref = resolveUrl(pageUrl, imageSrcLink?.href);
  if (linkHref) return linkHref;

  for (const attributes of getTags(html, 'img')) {
    const candidate =
      attributes['data-src'] ??
      firstSrcsetCandidate(attributes.srcset) ??
      attributes.src ??
      undefined;
    const resolved = resolveUrl(pageUrl, candidate);
    if (resolved) return resolved;
  }

  return null;
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^-+|-+$/g, '');
}

function extractKnownExtensionFromUrl(sourceUrl: string): string | null {
  try {
    const pathname = new URL(sourceUrl).pathname.toLowerCase();
    const matched = pathname.match(/\.(avif|gif|jpe?g|png|svg|webp)$/);
    if (!matched) return null;
    return matched[0] === '.jpeg' ? '.jpg' : matched[0];
  } catch {
    return null;
  }
}

export function resolveImageFileExtension(sourceUrl: string, contentType: string | null): string {
  const contentTypeValue = contentType?.split(';')[0].trim().toLowerCase() ?? null;
  const contentTypeExtension = contentTypeValue ? extensionByContentType[contentTypeValue] : undefined;
  if (contentTypeExtension) return contentTypeExtension;

  const urlExtension = extractKnownExtensionFromUrl(sourceUrl);
  if (urlExtension) return urlExtension;

  return '.img';
}

export function buildStorageObjectPath(
  entityType: EntityAssetImportRecord['entityType'],
  slug: string,
  extension: string
): string {
  const folder = entityType === 'card' ? 'cards' : 'banking';
  const sanitizedSlug = sanitizePathSegment(slug);
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;

  return `${folder}/${sanitizedSlug}${normalizedExtension}`;
}

export function buildSupabasePublicObjectUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
  overrideBaseUrl?: string | null
): string {
  const base = overrideBaseUrl
    ? new URL(overrideBaseUrl.endsWith('/') ? overrideBaseUrl : `${overrideBaseUrl}/`)
    : new URL('/storage/v1/object/public/', supabaseUrl);

  return new URL(`${bucket}/${objectPath}`, base).href;
}

export function isSupportedImageContentType(contentType: string | null): boolean {
  return Boolean(contentType?.toLowerCase().startsWith('image/'));
}

export function extractEntityAssetImportRows(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object' && 'assets' in raw) {
    const maybeRows = (raw as { assets?: unknown }).assets;
    if (Array.isArray(maybeRows)) return maybeRows;
  }

  return raw;
}
