import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PERSONAL_FINANCE_TRACKER_CSV_MIME,
  PERSONAL_FINANCE_TRACKER_FALLBACK_DOWNLOAD_FILENAME,
  PERSONAL_FINANCE_TRACKER_DOWNLOAD_FILENAME,
  PERSONAL_FINANCE_TRACKER_XLSX_MIME
} from '@/lib/personal-finance-tracker';
import {
  getPersonalFinanceTrackerGoogleSheetGid,
  getPersonalFinanceTrackerGoogleSheetSource
} from '@/lib/config/server';
import { recordPersonalFinanceTrackerDownloadFallback } from '@/lib/metrics';

const GOOGLE_SHEETS_HOST = 'docs.google.com';
const GOOGLE_SHEET_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
const GOOGLE_SHEET_GID_PATTERN = /^\d+$/;
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;
const FALLBACK_DOWNLOAD_FILE_PATH = path.join(
  process.cwd(),
  'public',
  'downloads',
  PERSONAL_FINANCE_TRACKER_FALLBACK_DOWNLOAD_FILENAME
);

type GoogleSheetConfig = {
  sheetId: string;
  gid: string | null;
};

type ConfigResolution =
  | { ok: true; config: GoogleSheetConfig }
  | { ok: false; status: number; error: string };

type FallbackReason =
  | 'missing_config'
  | 'invalid_config'
  | 'fetch_error'
  | 'non_ok_response'
  | 'oversized_declared_length'
  | 'invalid_body_size'
  | 'invalid_xlsx';

export type PersonalFinanceTrackerDownloadResult =
  | { ok: true; body: ArrayBuffer; headers: HeadersInit }
  | { ok: false; status: number; error: string };

function extractGid(url: URL): string | null {
  const searchGid = url.searchParams.get('gid');
  if (searchGid) return searchGid;

  const hashGid = url.hash.match(/(?:^|[#&])gid=(\d+)/)?.[1];
  return hashGid ?? null;
}

export function parseGoogleSheetSource(source: string): GoogleSheetConfig | null {
  const trimmed = source.trim();
  if (GOOGLE_SHEET_ID_PATTERN.test(trimmed)) {
    return { sheetId: trimmed, gid: null };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname !== GOOGLE_SHEETS_HOST) {
    return null;
  }

  const match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
  const sheetId = match?.[1] ?? null;
  if (!sheetId || !GOOGLE_SHEET_ID_PATTERN.test(sheetId)) {
    return null;
  }

  const gid = extractGid(url);
  if (gid && !GOOGLE_SHEET_GID_PATTERN.test(gid)) {
    return null;
  }

  return { sheetId, gid };
}

export function buildGoogleSheetsXlsxExportUrl(config: GoogleSheetConfig): string {
  const url = new URL(
    `https://${GOOGLE_SHEETS_HOST}/spreadsheets/d/${config.sheetId}/export`
  );
  url.searchParams.set('format', 'xlsx');
  if (config.gid) {
    url.searchParams.set('gid', config.gid);
  }
  return url.toString();
}

export function resolvePersonalFinanceTrackerGoogleSheetConfig(): ConfigResolution {
  const source = getPersonalFinanceTrackerGoogleSheetSource();
  if (!source) {
    return {
      ok: false,
      status: 503,
      error: 'Personal finance tracker download is not configured.'
    };
  }

  const parsedSource = parseGoogleSheetSource(source);
  if (!parsedSource) {
    return {
      ok: false,
      status: 503,
      error:
        'Personal finance tracker download is misconfigured. Use a Google Sheets URL or sheet ID.'
    };
  }

  const configuredGid = getPersonalFinanceTrackerGoogleSheetGid();
  if (configuredGid && !GOOGLE_SHEET_GID_PATTERN.test(configuredGid)) {
    return {
      ok: false,
      status: 503,
      error:
        'Personal finance tracker download is misconfigured. The sheet gid must be numeric.'
    };
  }

  return {
    ok: true,
    config: {
      sheetId: parsedSource.sheetId,
      gid: configuredGid ?? parsedSource.gid
    }
  };
}

function hasXlsxMagicBytes(body: ArrayBuffer): boolean {
  const bytes = new Uint8Array(body);
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDownloadHeaders(byteLength: number): HeadersInit {
  return {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${PERSONAL_FINANCE_TRACKER_DOWNLOAD_FILENAME}"`,
    'Content-Length': String(byteLength),
    'Content-Type': PERSONAL_FINANCE_TRACKER_XLSX_MIME,
    'X-Content-Type-Options': 'nosniff'
  };
}

function buildFallbackDownloadHeaders(byteLength: number): HeadersInit {
  return {
    'Cache-Control': 'public, max-age=3600',
    'Content-Disposition': `attachment; filename="${PERSONAL_FINANCE_TRACKER_FALLBACK_DOWNLOAD_FILENAME}"`,
    'Content-Length': String(byteLength),
    'Content-Type': PERSONAL_FINANCE_TRACKER_CSV_MIME,
    'X-Content-Type-Options': 'nosniff'
  };
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

async function getFallbackTrackerDownload(): Promise<PersonalFinanceTrackerDownloadResult> {
  try {
    const body = await readFile(FALLBACK_DOWNLOAD_FILE_PATH);
    return {
      ok: true,
      body: bufferToArrayBuffer(body),
      headers: buildFallbackDownloadHeaders(body.byteLength)
    };
  } catch (error) {
    console.error('[personal-finance-tracker] fallback download failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      ok: false,
      status: 503,
      error: 'Personal finance tracker download is temporarily unavailable.'
    };
  }
}

function getFallbackReasonFromConfigError(error: string): FallbackReason {
  return error.includes('not configured') ? 'missing_config' : 'invalid_config';
}

function fallbackTrackerDownload(
  reason: FallbackReason
): Promise<PersonalFinanceTrackerDownloadResult> {
  recordPersonalFinanceTrackerDownloadFallback(reason);
  return getFallbackTrackerDownload();
}

export async function getPersonalFinanceTrackerDownload(
  fetcher: typeof fetch = fetch
): Promise<PersonalFinanceTrackerDownloadResult> {
  const config = resolvePersonalFinanceTrackerGoogleSheetConfig();
  if (!config.ok) {
    console.warn('[personal-finance-tracker] Google Sheets source unavailable; using fallback CSV', {
      error: config.error
    });
    return fallbackTrackerDownload(getFallbackReasonFromConfigError(config.error));
  }

  const exportUrl = buildGoogleSheetsXlsxExportUrl(config.config);

  let response: Response;
  try {
    response = await fetcher(exportUrl, {
      cache: 'no-store',
      redirect: 'follow'
    });
  } catch (error) {
    console.error('[personal-finance-tracker] Google Sheets export failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return fallbackTrackerDownload('fetch_error');
  }

  if (!response.ok) {
    console.warn('[personal-finance-tracker] Google Sheets export returned a non-OK response; using fallback CSV', {
      status: response.status
    });
    return fallbackTrackerDownload('non_ok_response');
  }

  const declaredLength = parseContentLength(response.headers.get('content-length'));
  if (declaredLength !== null && declaredLength > MAX_DOWNLOAD_BYTES) {
    console.warn('[personal-finance-tracker] Google Sheets export is larger than expected; using fallback CSV', {
      declaredLength
    });
    return fallbackTrackerDownload('oversized_declared_length');
  }

  const body = await response.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_DOWNLOAD_BYTES) {
    console.warn('[personal-finance-tracker] Google Sheets export body is invalid size; using fallback CSV', {
      byteLength: body.byteLength
    });
    return fallbackTrackerDownload('invalid_body_size');
  }

  if (!hasXlsxMagicBytes(body)) {
    console.warn('[personal-finance-tracker] Google Sheets export is not a valid xlsx; using fallback CSV');
    return fallbackTrackerDownload('invalid_xlsx');
  }

  return {
    ok: true,
    body,
    headers: buildDownloadHeaders(body.byteLength)
  };
}
