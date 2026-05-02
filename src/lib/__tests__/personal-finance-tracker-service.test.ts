import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildGoogleSheetsXlsxExportUrl,
  getPersonalFinanceTrackerDownload,
  parseGoogleSheetSource,
  resolvePersonalFinanceTrackerGoogleSheetConfig
} from '@/lib/services/personal-finance-tracker-service';

const sheetId = '1AbcdefghijklmnopqrstuvwxyzABCDE';

function clearTrackerEnv() {
  vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET', '');
  vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_URL', '');
  vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_ID', '');
  vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_GID', '');
}

function xlsxBody() {
  return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
}

describe('personal finance tracker download service', () => {
  beforeEach(() => {
    clearTrackerEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('parses a Google Sheets share URL and tab gid', () => {
    expect(
      parseGoogleSheetSource(
        `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=12345`
      )
    ).toEqual({
      sheetId,
      gid: '12345'
    });
  });

  it('rejects non-Google sources', () => {
    expect(parseGoogleSheetSource('https://example.com/tracker.xlsx')).toBeNull();
  });

  it('builds a forced xlsx export URL', () => {
    expect(
      buildGoogleSheetsXlsxExportUrl({
        sheetId,
        gid: '0'
      })
    ).toBe(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=0`
    );
  });

  it('returns an explicit config error when no sheet source is configured', () => {
    expect(resolvePersonalFinanceTrackerGoogleSheetConfig()).toEqual({
      ok: false,
      status: 503,
      error: 'Personal finance tracker download is not configured.'
    });
  });

  it('uses the env gid when it is configured separately', () => {
    vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET', sheetId);
    vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET_GID', '987');

    expect(resolvePersonalFinanceTrackerGoogleSheetConfig()).toEqual({
      ok: true,
      config: {
        sheetId,
        gid: '987'
      }
    });
  });

  it('downloads a valid spreadsheet export with attachment headers', async () => {
    vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET', sheetId);
    const fetcher = vi.fn().mockResolvedValue(
      new Response(xlsxBody(), {
        headers: {
          'content-length': '4',
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })
    ) as unknown as typeof fetch;

    const result = await getPersonalFinanceTrackerDownload(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`,
      {
        cache: 'no-store',
        redirect: 'follow'
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.headers).toMatchObject({
        'Content-Disposition':
          'attachment; filename="the-stack-personal-finance-tracker.xlsx"',
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'X-Content-Type-Options': 'nosniff'
      });
      expect(result.body.byteLength).toBe(4);
    }
  });

  it('rejects a Google response that is not an xlsx export', async () => {
    vi.stubEnv('PERSONAL_FINANCE_TRACKER_GOOGLE_SHEET', sheetId);
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<html>sign in</html>', {
        headers: { 'content-type': 'text/html' }
      })
    ) as unknown as typeof fetch;

    await expect(getPersonalFinanceTrackerDownload(fetcher)).resolves.toEqual({
      ok: false,
      status: 502,
      error:
        'Personal finance tracker download is not a valid spreadsheet export. Confirm the Google Sheet is shared as view-only.'
    });
  });
});
