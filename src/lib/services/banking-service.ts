import {
  bankingBonusesQuerySchema,
  filterBankingBonuses,
  getBankingBonusesData,
  paginateBankingBonuses,
  type BankingBonusListItem,
  type BankingBonusesDataSource
} from '@/lib/banking-bonuses';

export type BankingBonusesListResult =
  | {
      ok: true;
      data: {
        results: BankingBonusListItem[];
        source: BankingBonusesDataSource;
        pagination: {
          total: number;
          limit: number;
          offset: number;
        };
      };
    }
  | { ok: false; status: 400 | 500; error: string };

export type BankingBonusesListQueryInput = {
  accountType?: string;
  requiresDirectDeposit?: string;
  state?: string;
  limit?: string;
  offset?: string;
};

export async function getBankingBonusesList(
  query: BankingBonusesListQueryInput
): Promise<BankingBonusesListResult> {
  const parsed = bankingBonusesQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid query params' };
  }

  try {
    const { bonuses, source } = await getBankingBonusesData();
    const filtered = filterBankingBonuses(bonuses, parsed.data);
    const results = paginateBankingBonuses(filtered, parsed.data);

    return {
      ok: true,
      data: {
        results,
        source,
        pagination: {
          total: filtered.length,
          limit: parsed.data.limit,
          offset: parsed.data.offset
        }
      }
    };
  } catch (error) {
    console.error('[banking-service] failed to load banking offers', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      ok: false,
      status: 500,
      error: 'Banking offer data is temporarily unavailable'
    };
  }
}
