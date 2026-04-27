import { getNodeEnv } from '@/lib/config/runtime';
import { isDatabaseConfigured } from '@/lib/db';
import {
  getActiveDbBankingBonuses,
  getActiveDbBankingBonusSlugs,
  getActiveDbBusinessBankingBonuses,
  getDbBankingBonusBySlug
} from '@/lib/banking/db-source';
import { getActiveSeedBankingBonuses, getActiveSeedBankingBonusSlugs, getSeedBankingBonusBySlug } from '@/lib/banking/seed-source';
import { resolveBankingOfferUrl } from '@/lib/banking/source-shared';
import type { BankingBonusListItem, BankingBonusesDataSource } from '@/lib/banking/schema';

export type BankingBonusesDataResponse = {
  bonuses: BankingBonusListItem[];
  source: BankingBonusesDataSource;
};

type BankingBonusesCacheEntry = {
  value: BankingBonusesDataResponse;
  expiresAt: number;
};

declare global {
  var bankingBonusesDataCache: BankingBonusesCacheEntry | undefined;
  var businessBankingBonusesDataCache: BankingBonusesCacheEntry | undefined;
}

const BANKING_BONUSES_CACHE_TTL_MS = 5 * 60 * 1000;
let bankingBonusesInFlight: Promise<BankingBonusesDataResponse> | null = null;
let businessBankingBonusesInFlight: Promise<BankingBonusesDataResponse> | null = null;

function shouldUseDbSource(): boolean {
  if (!isDatabaseConfigured()) return false;
  if (getNodeEnv() === 'test') return false;
  return true;
}

function readBankingBonusesCache(now = Date.now()): BankingBonusesDataResponse | null {
  const cached = globalThis.bankingBonusesDataCache;
  if (!cached) return null;

  if (cached.expiresAt <= now) {
    globalThis.bankingBonusesDataCache = undefined;
    return null;
  }

  return cached.value;
}

function writeBankingBonusesCache(
  value: BankingBonusesDataResponse
): BankingBonusesDataResponse {
  globalThis.bankingBonusesDataCache = {
    value,
    expiresAt: Date.now() + BANKING_BONUSES_CACHE_TTL_MS
  };

  return value;
}

function readBusinessBankingBonusesCache(now = Date.now()): BankingBonusesDataResponse | null {
  const cached = globalThis.businessBankingBonusesDataCache;
  if (!cached) return null;

  if (cached.expiresAt <= now) {
    globalThis.businessBankingBonusesDataCache = undefined;
    return null;
  }

  return cached.value;
}

function writeBusinessBankingBonusesCache(
  value: BankingBonusesDataResponse
): BankingBonusesDataResponse {
  globalThis.businessBankingBonusesDataCache = {
    value,
    expiresAt: Date.now() + BANKING_BONUSES_CACHE_TTL_MS
  };

  return value;
}

function getSeedBankingBonusesData(): BankingBonusesDataResponse {
  return {
    bonuses: getActiveSeedBankingBonuses(),
    source: 'seed'
  };
}

function getSeedBusinessBankingBonusesData(): BankingBonusesDataResponse {
  return {
    bonuses: getActiveSeedBankingBonuses().filter((bonus) => bonus.customerType === 'business'),
    source: 'seed'
  };
}

async function loadBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  if (!shouldUseDbSource()) {
    return getSeedBankingBonusesData();
  }

  try {
    const dbBonuses = await getActiveDbBankingBonuses();
    if (dbBonuses.length > 0) {
      return {
        bonuses: dbBonuses,
        source: 'db'
      };
    }
  } catch (error) {
    console.error('[banking-bonuses] failed to load DB offers; falling back to seed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return getSeedBankingBonusesData();
}

async function loadBusinessBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  if (!shouldUseDbSource()) {
    return getSeedBusinessBankingBonusesData();
  }

  try {
    const dbBonuses = await getActiveDbBusinessBankingBonuses();
    if (dbBonuses.length > 0) {
      return {
        bonuses: dbBonuses,
        source: 'db'
      };
    }
  } catch (error) {
    console.error('[banking-bonuses] failed to load DB business offers; falling back to seed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return getSeedBusinessBankingBonusesData();
}

export async function getBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  const cached = readBankingBonusesCache();
  if (cached) return cached;

  if (bankingBonusesInFlight) {
    return bankingBonusesInFlight;
  }

  bankingBonusesInFlight = loadBankingBonusesData()
    .then((value) => writeBankingBonusesCache(value))
    .finally(() => {
      bankingBonusesInFlight = null;
    });

  return bankingBonusesInFlight;
}

export async function getBusinessBankingBonusesData(): Promise<BankingBonusesDataResponse> {
  const cached = readBusinessBankingBonusesCache();
  if (cached) return cached;

  if (businessBankingBonusesInFlight) {
    return businessBankingBonusesInFlight;
  }

  businessBankingBonusesInFlight = loadBusinessBankingBonusesData()
    .then((value) => writeBusinessBankingBonusesCache(value))
    .finally(() => {
      businessBankingBonusesInFlight = null;
    });

  return businessBankingBonusesInFlight;
}

export async function getBankingBonusBySlug(slug: string): Promise<BankingBonusListItem | null> {
  if (shouldUseDbSource()) {
    try {
      const dbOffer = await getDbBankingBonusBySlug(slug);
      if (dbOffer) {
        return dbOffer;
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB offer by slug; falling back to seed', {
        slug,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getSeedBankingBonusBySlug(slug);
}

export async function getAllBankingBonusSlugs(): Promise<string[]> {
  if (shouldUseDbSource()) {
    try {
      const slugs = await getActiveDbBankingBonusSlugs();
      if (slugs.length > 0) {
        return slugs;
      }
    } catch (error) {
      console.error('[banking-bonuses] failed to load DB slugs; falling back to seed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return getActiveSeedBankingBonusSlugs();
}

export { resolveBankingOfferUrl };
