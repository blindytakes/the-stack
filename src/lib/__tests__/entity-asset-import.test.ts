import { describe, expect, it } from 'vitest';
import {
  buildStorageObjectPath,
  buildSupabasePublicObjectUrl,
  discoverImageUrlFromHtml,
  entityAssetImportDatasetSchema,
  extractEntityAssetImportRows,
  resolveImageFileExtension
} from '../entity-asset-import';

describe('entityAssetImportDatasetSchema', () => {
  it('accepts card rows that update image and apply links together', () => {
    const parsed = entityAssetImportDatasetSchema.safeParse([
      {
        entityType: 'card',
        slug: 'test-card',
        sourcePageUrl: 'https://issuer.example.com/test-card',
        applyUrl: 'https://issuer.example.com/apply/test-card'
      }
    ]);

    expect(parsed.success).toBe(true);
  });

  it('rejects storagePath when no image source fields are present', () => {
    const parsed = entityAssetImportDatasetSchema.safeParse([
      {
        entityType: 'card',
        slug: 'test-card',
        storagePath: 'cards/test-card.png',
        applyUrl: 'https://issuer.example.com/apply/test-card'
      }
    ]);

    expect(parsed.success).toBe(false);
  });
});

describe('discoverImageUrlFromHtml', () => {
  it('prefers og:image and resolves relative URLs', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="/assets/card.png" />
          <meta name="twitter:image" content="https://cdn.example.com/fallback.png" />
        </head>
      </html>
    `;

    expect(discoverImageUrlFromHtml('https://issuer.example.com/card', html)).toBe(
      'https://issuer.example.com/assets/card.png'
    );
  });

  it('falls back to image_src links and img tags', () => {
    const html = `
      <html>
        <head>
          <link rel="image_src" href="https://cdn.example.com/card-art.webp" />
        </head>
        <body>
          <img src="/backup.png" />
        </body>
      </html>
    `;

    expect(discoverImageUrlFromHtml('https://issuer.example.com/card', html)).toBe(
      'https://cdn.example.com/card-art.webp'
    );
  });
});

describe('buildStorageObjectPath', () => {
  it('places records into card and banking folders', () => {
    expect(buildStorageObjectPath('card', 'Amex Gold Card', '.png')).toBe('cards/amex-gold-card.png');
    expect(buildStorageObjectPath('banking_bonus', 'Chase-Checking-300', '.svg')).toBe(
      'banking/chase-checking-300.svg'
    );
  });
});

describe('buildSupabasePublicObjectUrl', () => {
  it('builds the default public object URL', () => {
    expect(
      buildSupabasePublicObjectUrl('https://project.supabase.co', 'entity-images', 'cards/test-card.png')
    ).toBe(
      'https://project.supabase.co/storage/v1/object/public/entity-images/cards/test-card.png'
    );
  });

  it('supports a custom public base URL', () => {
    expect(
      buildSupabasePublicObjectUrl(
        'https://project.supabase.co',
        'entity-images',
        'cards/test-card.png',
        'https://cdn.example.com/storage/public'
      )
    ).toBe('https://cdn.example.com/storage/public/entity-images/cards/test-card.png');
  });
});

describe('resolveImageFileExtension', () => {
  it('prefers content type over URL suffix', () => {
    expect(resolveImageFileExtension('https://cdn.example.com/card', 'image/webp')).toBe('.webp');
  });

  it('falls back to the URL suffix when content type is missing', () => {
    expect(resolveImageFileExtension('https://cdn.example.com/card.jpeg', null)).toBe('.jpg');
  });
});

describe('extractEntityAssetImportRows', () => {
  it('extracts the nested assets array', () => {
    expect(extractEntityAssetImportRows({ assets: [{ entityType: 'card', slug: 'a', applyUrl: 'https://x.com' }] })).toEqual([
      { entityType: 'card', slug: 'a', applyUrl: 'https://x.com' }
    ]);
  });
});
