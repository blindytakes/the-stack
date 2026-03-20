export type BankingApySnapshot = {
  apyPercent: number;
  apyDisplay: string;
  apySourceUrl: string;
  apyAsOf?: string;
};

// APY data is intentionally maintained as a sourced overlay because rates move
// faster than bonus copy and we do not yet persist APY values in Prisma.
export const bankingApyBySlug: Record<string, BankingApySnapshot> = {
  'alliant-ultimate-opportunity-savings-100': {
    apyPercent: 3.01,
    apyDisplay: '3.01% APY',
    apySourceUrl: 'https://www.alliantcreditunion.org/u/deposit-rates',
    apyAsOf: '2026-02-01'
  },
  'chase-private-client-checking-3000': {
    apyPercent: 0.01,
    apyDisplay: '0.01% APY',
    apySourceUrl:
      'https://account.chase.com/consumer/banking/chase-private-client-checking-account',
    apyAsOf: '2025-12-26'
  },
  'etrade-premium-savings-2000': {
    apyPercent: 3.75,
    apyDisplay: '3.75% promo APY for 6 months (3.35% base)',
    apySourceUrl: 'https://us.etrade.com/bank/premium-savings-account'
  },
  'key-select-checking-500': {
    apyPercent: 0.05,
    apyDisplay: '0.05% APY',
    apySourceUrl: 'https://www.key.com/personal/checking/key-select-checking-account.html'
  },
  'marcus-online-savings-1500': {
    apyPercent: 3.65,
    apyDisplay: '3.65% APY',
    apySourceUrl: 'https://www.marcus.com/us/en/savings/osa-savingsbonus',
    apyAsOf: '2026-03-11'
  },
  'sofi-checking-savings-300': {
    apyPercent: 3.3,
    apyDisplay: '3.30% savings APY + 0.50% checking APY',
    apySourceUrl:
      'https://support.sofi.com/hc/en-us/articles/4421758127245-What-s-the-interest-rate-for-SoFi-Checking-and-Savings',
    apyAsOf: '2025-12-23'
  },
  'td-beyond-checking-300': {
    apyPercent: 0.01,
    apyDisplay: '0.01% APY',
    apySourceUrl: 'https://www.td.com/us/en/personal-banking/checking-accounts/beyond'
  },
  'us-bank-smartly-checking-450': {
    apyPercent: 0.005,
    apyDisplay: '0.005% APY',
    apySourceUrl:
      'https://www.usbank.com/bank-accounts/checking-accounts/bank-smartly-checking/checking-account-interest-rates.html',
    apyAsOf: '2025-12-31'
  }
};
