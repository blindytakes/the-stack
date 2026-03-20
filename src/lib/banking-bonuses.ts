/**
 * Stable banking domain facade for pages, routes, and planner flows.
 *
 * Internals are split by responsibility under src/lib/banking, but the public
 * import path stays the same to avoid repo-wide churn.
 */
export {
  bankingBonusesQuerySchema,
  type BankingBonusListItem,
  type BankingBonusRecord,
  type BankingApyFilter,
  type BankingBonusesDataSource,
  type BankingBonusesQuery,
  type BankingBonusesSort,
  type BankingOfferCashRequirementLevel,
  type BankingOfferChecklistStep,
  type BankingOfferDifficulty,
  type BankingOfferDifficultyLevel,
  type BankingOfferTimeline,
  type BankingOfferTimelineBucket
} from '@/lib/banking/schema';
export {
  getAllBankingBonusSlugs,
  getBankingBonusBySlug,
  getBankingBonusesData
} from '@/lib/banking/repository';
export {
  formatBankingAccountType,
  formatBankingCurrency,
  getBankingOfferAvailabilityLabel,
  getBankingOfferBestFit,
  getBankingOfferChecklist,
  getBankingOfferExecutionSummary,
  getBankingOfferGotchas,
  getBankingOfferPrimaryConstraint,
  getBankingOfferPrimaryRequirement,
  getBankingOfferRequirements,
  getBankingOfferThinkTwiceIf,
  getBankingOfferWhyInteresting
} from '@/lib/banking/copy';
export {
  getBankingOfferCashRequirementLevel,
  getBankingOfferDifficulty,
  getBankingOfferTimeline,
  getBankingOfferTimelineBucket
} from '@/lib/banking/scoring';
export {
  filterBankingBonuses,
  paginateBankingBonuses,
  sortBankingBonuses
} from '@/lib/banking/list';
