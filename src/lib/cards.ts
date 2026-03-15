/**
 * Stable cards domain facade for services, pages, and tools.
 *
 * Internals are split by responsibility under src/lib/cards, but the public
 * import path stays the same to avoid repo-wide churn.
 */
export {
  cardsQuerySchema,
  spendingCategoryValues,
  type BenefitDetail,
  type CardDetail,
  type CardRecord,
  type CardsQuery,
  type CardTypeValue,
  type CreditTierValue,
  type RewardDetail,
  type RewardTypeValue,
  type SignUpBonusDetail,
  type SpendingCategoryValue,
  type TransferPartnerDetail
} from '@/lib/cards/schema';
export { filterCards, paginateCards } from '@/lib/cards/list';
export {
  type DbCardDetailRow,
  type DbCardRow,
  toCardDetailFromDb,
  toCardRecordFromDb
} from '@/lib/cards/mappers';
export {
  type CardsDataResponse,
  getAllCardSlugs,
  getCardBySlug,
  getCardsData
} from '@/lib/cards/repository';
