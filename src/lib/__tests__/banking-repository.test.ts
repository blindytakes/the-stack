import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBankingListItem } from '@/lib/__tests__/banking-test-helpers';

function clearBankingRepositoryCache() {
  delete (globalThis as typeof globalThis & {
    bankingBonusesDataCache?: unknown;
  }).bankingBonusesDataCache;
}

describe('banking repository', () => {
  beforeEach(() => {
    vi.resetModules();
    clearBankingRepositoryCache();
  });

  it('uses the DB source when the database is configured outside test env', async () => {
    const getActiveDbBankingBonusesMock = vi
      .fn()
      .mockResolvedValue([createBankingListItem({ slug: 'db-offer', estimatedNetValue: 440 })]);
    const getActiveSeedBankingBonusesMock = vi.fn().mockReturnValue([
      createBankingListItem({ slug: 'seed-offer' })
    ]);

    vi.doMock('@/lib/db', () => ({
      isDatabaseConfigured: () => true
    }));
    vi.doMock('@/lib/config/runtime', () => ({
      getNodeEnv: () => 'production'
    }));
    vi.doMock('@/lib/banking/db-source', () => ({
      getActiveDbBankingBonuses: (...args: unknown[]) => getActiveDbBankingBonusesMock(...args),
      getDbBankingBonusBySlug: vi.fn(),
      getActiveDbBankingBonusSlugs: vi.fn()
    }));
    vi.doMock('@/lib/banking/seed-source', () => ({
      getActiveSeedBankingBonuses: (...args: unknown[]) => getActiveSeedBankingBonusesMock(...args),
      getSeedBankingBonusBySlug: vi.fn(),
      getActiveSeedBankingBonusSlugs: vi.fn()
    }));

    const { getBankingBonusesData } = await import('@/lib/banking/repository');

    const result = await getBankingBonusesData();

    expect(result).toEqual({
      source: 'db',
      bonuses: [createBankingListItem({ slug: 'db-offer', estimatedNetValue: 440 })]
    });
    expect(getActiveDbBankingBonusesMock).toHaveBeenCalledTimes(1);
    expect(getActiveSeedBankingBonusesMock).not.toHaveBeenCalled();
  });

  it('falls back to the seed source when the DB source fails', async () => {
    const getActiveDbBankingBonusesMock = vi.fn().mockRejectedValue(new Error('db down'));
    const getActiveSeedBankingBonusesMock = vi.fn().mockReturnValue([
      createBankingListItem({ slug: 'seed-offer' })
    ]);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('@/lib/db', () => ({
      isDatabaseConfigured: () => true
    }));
    vi.doMock('@/lib/config/runtime', () => ({
      getNodeEnv: () => 'production'
    }));
    vi.doMock('@/lib/banking/db-source', () => ({
      getActiveDbBankingBonuses: (...args: unknown[]) => getActiveDbBankingBonusesMock(...args),
      getDbBankingBonusBySlug: vi.fn(),
      getActiveDbBankingBonusSlugs: vi.fn()
    }));
    vi.doMock('@/lib/banking/seed-source', () => ({
      getActiveSeedBankingBonuses: (...args: unknown[]) => getActiveSeedBankingBonusesMock(...args),
      getSeedBankingBonusBySlug: vi.fn(),
      getActiveSeedBankingBonusSlugs: vi.fn()
    }));

    const { getBankingBonusesData } = await import('@/lib/banking/repository');

    const result = await getBankingBonusesData();

    expect(result).toEqual({
      source: 'seed',
      bonuses: [createBankingListItem({ slug: 'seed-offer' })]
    });
    expect(getActiveDbBankingBonusesMock).toHaveBeenCalledTimes(1);
    expect(getActiveSeedBankingBonusesMock).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it('uses the seed source in test env even when the database is configured', async () => {
    const getActiveDbBankingBonusesMock = vi.fn();
    const getActiveSeedBankingBonusesMock = vi.fn().mockReturnValue([
      createBankingListItem({ slug: 'seed-offer' })
    ]);

    vi.doMock('@/lib/db', () => ({
      isDatabaseConfigured: () => true
    }));
    vi.doMock('@/lib/config/runtime', () => ({
      getNodeEnv: () => 'test'
    }));
    vi.doMock('@/lib/banking/db-source', () => ({
      getActiveDbBankingBonuses: (...args: unknown[]) => getActiveDbBankingBonusesMock(...args),
      getDbBankingBonusBySlug: vi.fn(),
      getActiveDbBankingBonusSlugs: vi.fn()
    }));
    vi.doMock('@/lib/banking/seed-source', () => ({
      getActiveSeedBankingBonuses: (...args: unknown[]) => getActiveSeedBankingBonusesMock(...args),
      getSeedBankingBonusBySlug: vi.fn(),
      getActiveSeedBankingBonusSlugs: vi.fn()
    }));

    const { getBankingBonusesData } = await import('@/lib/banking/repository');

    const result = await getBankingBonusesData();

    expect(result.source).toBe('seed');
    expect(getActiveDbBankingBonusesMock).not.toHaveBeenCalled();
    expect(getActiveSeedBankingBonusesMock).toHaveBeenCalledTimes(1);
  });
});
