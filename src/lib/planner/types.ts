export const availableCashValues = [
  'none',
  'up_to_2500',
  'from_2501_to_9999',
  'at_least_10000'
] as const;
export type AvailableCash = (typeof availableCashValues)[number];

export const directDepositCapacityValues = [
  'none',
  'up_to_1000',
  'from_1001_to_2500',
  'at_least_2500'
] as const;
export type DirectDepositCapacity = (typeof directDepositCapacityValues)[number];

export const plannerAudienceValues = ['consumer', 'business'] as const;
export type PlannerAudience = (typeof plannerAudienceValues)[number];

export const recentCardOpenings24MonthsValues = [
  'two_or_less',
  'three_to_four',
  'five_or_more'
] as const;
export type RecentCardOpenings24Months = (typeof recentCardOpenings24MonthsValues)[number];

export const chase524StatusValues = ['under_5_24', 'at_or_over_5_24', 'not_sure'] as const;
export type Chase524Status = (typeof chase524StatusValues)[number];
