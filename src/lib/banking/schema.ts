import { z } from 'zod';
import {
  bankingAccountTypeSchema,
  type BankingBonusSeedRecord
} from '@/lib/banking-bonus-seed-schema';

export type BankingBonusRecord = BankingBonusSeedRecord;

export type BankingBonusListItem = BankingBonusRecord & {
  estimatedNetValue: number;
};

export type BankingBonusesDataSource = 'db' | 'seed';
export type BankingOfferCashRequirementLevel = 'none' | 'light' | 'medium' | 'high';
export type BankingOfferTimelineBucket = 'fast' | 'standard' | 'long' | 'unknown';
export type BankingBonusesSort = 'net' | 'easy' | 'fast' | 'low_cash';
export type BankingApyFilter = '1_plus' | '3_plus' | '4_plus';

const bankingDifficultySchema = z.enum(['low', 'medium', 'high']);
const bankingCashRequirementSchema = z.enum(['none', 'light', 'medium', 'high']);
const bankingTimelineSchema = z.enum(['fast', 'standard', 'long']);
const bankingSortSchema = z.enum(['net', 'easy', 'fast', 'low_cash']);
const bankingApyFilterSchema = z.enum(['1_plus', '3_plus', '4_plus']);

export const bankingBonusesQuerySchema = z.object({
  accountType: bankingAccountTypeSchema.optional(),
  requiresDirectDeposit: z.enum(['yes', 'no']).optional(),
  apy: bankingApyFilterSchema.optional(),
  difficulty: bankingDifficultySchema.optional(),
  cashRequirement: bankingCashRequirementSchema.optional(),
  timeline: bankingTimelineSchema.optional(),
  stateLimited: z.enum(['yes', 'no']).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  sort: bankingSortSchema.default('net'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type BankingBonusesQuery = z.infer<typeof bankingBonusesQuerySchema>;

export type BankingOfferDifficultyLevel = 'low' | 'medium' | 'high';

export type BankingOfferDifficulty = {
  level: BankingOfferDifficultyLevel;
  label: string;
  shortLabel: string;
  detail: string;
};

export type BankingOfferTimeline = {
  label: string;
  shortLabel: string;
  detail: string;
  isKnown: boolean;
};

export type BankingOfferChecklistStep = {
  timing: string;
  title: string;
  detail: string;
};
