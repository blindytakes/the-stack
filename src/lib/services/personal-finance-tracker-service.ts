import {
  PERSONAL_FINANCE_TRACKER_DOWNLOAD_FILENAME,
  PERSONAL_FINANCE_TRACKER_XLSX_MIME
} from '@/lib/personal-finance-tracker';
import {
  getPersonalFinanceTrackerGoogleSheetGid,
  getPersonalFinanceTrackerGoogleSheetSource
} from '@/lib/config/server';

const GOOGLE_SHEETS_HOST = 'docs.google.com';
const GOOGLE_SHEET_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
const GOOGLE_SHEET_GID_PATTERN = /^\d+$/;
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

type GoogleSheetConfig = {
  sheetId: string;
  gid: string | null;
};

type ConfigResolution =
  | { ok: true; config: GoogleSheetConfig }
  | { ok: false; status: number; error: string };

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

export async function getPersonalFinanceTrackerDownload(
  fetcher: typeof fetch = fetch
): Promise<PersonalFinanceTrackerDownloadResult> {
  const config = resolvePersonalFinanceTrackerGoogleSheetConfig();
  if (!config.ok) return config;

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
    return {
      ok: false,
      status: 502,
      error: 'Personal finance tracker download is temporarily unavailable.'
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      error:
        'Personal finance tracker download is unavailable. Confirm the Google Sheet is shared as view-only.'
    };
  }

  const declaredLength = parseContentLength(response.headers.get('content-length'));
  if (declaredLength !== null && declaredLength > MAX_DOWNLOAD_BYTES) {
    return {
      ok: false,
      status: 502,
      error: 'Personal finance tracker download is larger than expected.'
    };
  }

  const body = await response.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_DOWNLOAD_BYTES) {
    return {
      ok: false,
      status: 502,
      error: 'Personal finance tracker download is larger than expected.'
    };
  }

  if (!hasXlsxMagicBytes(body)) {
    return {
      ok: false,
      status: 502,
      error:
        'Personal finance tracker download is not a valid spreadsheet export. Confirm the Google Sheet is shared as view-only.'
    };
  }

  return {
    ok: true,
    body,
    headers: buildDownloadHeaders(body.byteLength)
  };
}
