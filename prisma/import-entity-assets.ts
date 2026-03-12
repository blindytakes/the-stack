import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { readTrimmed } from '../src/lib/config/read-trimmed';
import {
  buildStorageObjectPath,
  buildSupabasePublicObjectUrl,
  discoverImageUrlFromHtml,
  entityAssetImportDatasetSchema,
  extractEntityAssetImportRows,
  isSupportedImageContentType,
  resolveImageFileExtension,
  type EntityAssetImportRecord
} from '../src/lib/entity-asset-import';

type CliOptions = {
  filePath: string;
  dryRun: boolean;
  useSourceUrl: boolean;
};

type SupabaseStorageConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  publicBaseUrl: string | null;
};

const DEFAULT_STORAGE_BUCKET = 'entity-images';
const DEFAULT_USER_AGENT = 'TheStackAssetImporter/1.0';

function usage() {
  console.info(
    'Usage: npm run entity-assets:import -- <path-to-json> [--dry-run] [--use-source-url]\n\n' +
      'Accepted JSON formats:\n' +
      '1) Array of asset import records\n' +
      '2) Object with { "assets": [...] }\n\n' +
      'Example:\n' +
      'npm run entity-assets:import -- ./content/entity-assets.json --dry-run --use-source-url'
  );
}

function parseArgs(argv: string[]): CliOptions {
  let filePath = '';
  let dryRun = false;
  let useSourceUrl = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--use-source-url') {
      useSourceUrl = true;
      continue;
    }

    if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
    }
  }

  return { filePath, dryRun, useSourceUrl };
}

function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const supabaseUrl = readTrimmed(process.env.SUPABASE_URL);
  const serviceRoleKey = readTrimmed(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = readTrimmed(process.env.SUPABASE_STORAGE_BUCKET) ?? DEFAULT_STORAGE_BUCKET;
  const publicBaseUrl = readTrimmed(process.env.SUPABASE_STORAGE_PUBLIC_BASE_URL);

  if (!supabaseUrl || !serviceRoleKey) return null;

  return {
    supabaseUrl,
    serviceRoleKey,
    bucket,
    publicBaseUrl
  };
}

function requiresImageWork(record: EntityAssetImportRecord): boolean {
  return Boolean(record.sourcePageUrl || record.sourceImageUrl);
}

function buildRequestHeaders(accept: string) {
  return {
    Accept: accept,
    'User-Agent': DEFAULT_USER_AGENT
  };
}

async function resolveSourceImageUrl(record: EntityAssetImportRecord): Promise<string> {
  if (record.sourceImageUrl) {
    return record.sourceImageUrl;
  }

  if (!record.sourcePageUrl) {
    throw new Error('Image import requires sourceImageUrl or sourcePageUrl');
  }

  const response = await fetch(record.sourcePageUrl, {
    headers: buildRequestHeaders('text/html,application/xhtml+xml')
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source page (${response.status})`);
  }

  const html = await response.text();
  const discovered = discoverImageUrlFromHtml(record.sourcePageUrl, html);
  if (!discovered) {
    throw new Error('Could not discover an image URL from the source page');
  }

  return discovered;
}

async function downloadImage(sourceImageUrl: string): Promise<{
  bytes: ArrayBuffer;
  contentType: string | null;
}> {
  const response = await fetch(sourceImageUrl, {
    headers: buildRequestHeaders('image/avif,image/webp,image/png,image/*,*/*;q=0.8')
  });

  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status})`);
  }

  const contentType = response.headers.get('content-type');
  if (!isSupportedImageContentType(contentType)) {
    throw new Error(`Expected an image response but received "${contentType ?? 'unknown'}"`);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new Error('Downloaded image was empty');
  }

  return { bytes, contentType };
}

async function uploadImageToSupabaseStorage(
  config: SupabaseStorageConfig,
  objectPath: string,
  bytes: ArrayBuffer,
  contentType: string | null
): Promise<string> {
  const uploadUrl = new URL(
    `/storage/v1/object/${config.bucket}/${objectPath}`,
    config.supabaseUrl
  );
  const blob = new Blob([bytes], {
    type: contentType ?? 'application/octet-stream'
  });

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      'x-upsert': 'true',
      'Content-Type': contentType ?? 'application/octet-stream'
    },
    body: blob
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upload failed (${response.status}): ${errorText}`);
  }

  return buildSupabasePublicObjectUrl(
    config.supabaseUrl,
    config.bucket,
    objectPath,
    config.publicBaseUrl
  );
}

async function updateRecord(
  prisma: PrismaClient,
  record: EntityAssetImportRecord,
  imageUrl: string | undefined,
  dryRun: boolean
) {
  if (record.entityType === 'card') {
    const existing = await prisma.card.findUnique({
      where: { slug: record.slug },
      select: { id: true, slug: true }
    });

    if (!existing) {
      throw new Error(`Card not found for slug "${record.slug}"`);
    }

    const data = {
      ...(imageUrl ? { imageUrl } : {}),
      ...(record.applyUrl !== undefined ? { applyUrl: record.applyUrl } : {}),
      ...(record.affiliateUrl !== undefined ? { affiliateUrl: record.affiliateUrl } : {})
    };

    if (!dryRun && Object.keys(data).length > 0) {
      await prisma.card.update({
        where: { slug: record.slug },
        data
      });
    }

    return data;
  }

  const existing = await prisma.bankingBonus.findUnique({
    where: { slug: record.slug },
    select: { id: true, slug: true }
  });

  if (!existing) {
    throw new Error(`Banking offer not found for slug "${record.slug}"`);
  }

  const data = {
    ...(imageUrl ? { imageUrl } : {}),
    ...(record.offerUrl !== undefined ? { offerUrl: record.offerUrl } : {}),
    ...(record.affiliateUrl !== undefined ? { affiliateUrl: record.affiliateUrl } : {})
  };

  if (!dryRun && Object.keys(data).length > 0) {
    await prisma.bankingBonus.update({
      where: { slug: record.slug },
      data
    });
  }

  return data;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.filePath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), options.filePath);
  const rawText = await fs.readFile(resolvedPath, 'utf8');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (error) {
    console.error('[entity-assets:import] Invalid JSON', {
      file: resolvedPath,
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
    return;
  }

  const rowsInput = extractEntityAssetImportRows(parsedJson);
  const parsed = entityAssetImportDatasetSchema.safeParse(rowsInput);
  if (!parsed.success) {
    console.error('[entity-assets:import] Validation failed', {
      file: resolvedPath,
      issues: parsed.error.issues
    });
    process.exitCode = 1;
    return;
  }

  const requiresStorage = parsed.data.some(requiresImageWork) && !options.useSourceUrl;
  const storageConfig = requiresStorage ? getSupabaseStorageConfig() : null;
  if (requiresStorage && !storageConfig) {
    console.error('[entity-assets:import] Missing Supabase Storage configuration', {
      requiredEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      optionalEnv: ['SUPABASE_STORAGE_BUCKET', 'SUPABASE_STORAGE_PUBLIC_BASE_URL']
    });
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const updated: Array<Record<string, unknown>> = [];
    const failures: Array<Record<string, unknown>> = [];

    for (const record of parsed.data) {
      try {
        let sourceImageUrl: string | undefined;
        let publicImageUrl: string | undefined;
        let downloadedImage:
          | {
              bytes: ArrayBuffer;
              contentType: string | null;
            }
          | undefined;

        if (requiresImageWork(record)) {
          sourceImageUrl = await resolveSourceImageUrl(record);

          if (options.useSourceUrl) {
            if (!options.dryRun) {
              await downloadImage(sourceImageUrl);
            }

            publicImageUrl = sourceImageUrl;
          } else if (!storageConfig) {
            throw new Error('Supabase Storage config missing');
          } else {
            if (!options.dryRun) {
              downloadedImage = await downloadImage(sourceImageUrl);
            }

            const storagePath =
              record.storagePath ??
              buildStorageObjectPath(
                record.entityType,
                record.slug,
                options.dryRun
                  ? resolveImageFileExtension(sourceImageUrl, null)
                  : resolveImageFileExtension(sourceImageUrl, downloadedImage?.contentType ?? null)
              );

            if (options.dryRun) {
              publicImageUrl = buildSupabasePublicObjectUrl(
                storageConfig.supabaseUrl,
                storageConfig.bucket,
                storagePath,
                storageConfig.publicBaseUrl
              );
            } else {
              if (!downloadedImage) {
                throw new Error('Image download failed before upload');
              }

              publicImageUrl = await uploadImageToSupabaseStorage(
                storageConfig,
                storagePath,
                downloadedImage.bytes,
                downloadedImage.contentType
              );
            }
          }
        }

        const data = await updateRecord(prisma, record, publicImageUrl, options.dryRun);

        updated.push({
          entityType: record.entityType,
          slug: record.slug,
          dryRun: options.dryRun,
          useSourceUrl: options.useSourceUrl,
          updatedFields: Object.keys(data),
          ...(sourceImageUrl ? { sourceImageUrl } : {}),
          ...(publicImageUrl ? { imageUrl: publicImageUrl } : {})
        });
      } catch (error) {
        failures.push({
          entityType: record.entityType,
          slug: record.slug,
          sourcePageUrl: record.sourcePageUrl,
          sourceImageUrl: record.sourceImageUrl,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.info('[entity-assets:import] Complete', {
      file: resolvedPath,
      dryRun: options.dryRun,
      updated,
      failures
    });

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('[entity-assets:import] unexpected failure', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
