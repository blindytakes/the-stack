import { z } from 'zod';
import {
  cardsOnlyPlannerAnswersSchema,
  fullPlannerAnswersSchema,
  plannerEligibilityOverridesSchema
} from '@/lib/planner/schemas';

const plannerRecommendationLaneSchema = z.enum(['cards', 'banking']);
const plannerRecommendationKindSchema = z.enum(['card_bonus', 'bank_bonus']);
const plannerRecommendationEffortSchema = z.enum(['low', 'medium', 'high']);
const cardImageAssetTypeSchema = z.enum(['card_art', 'brand_logo', 'text_fallback']);
const recommendationImageUrlSchema = z.string().trim().min(1).refine((value) => {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Image URL must be an absolute http(s) URL or a root-relative asset path');
export const selectedOfferIntentSchema = z.object({
  lane: plannerRecommendationLaneSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  detailPath: z.string().min(1),
  sourcePath: z.string().min(1).optional()
});

export const plannerRecommendationSchema = z.object({
  id: z.string().min(1),
  lane: plannerRecommendationLaneSchema,
  kind: plannerRecommendationKindSchema,
  title: z.string().min(1),
  provider: z.string().min(1),
  imageUrl: recommendationImageUrlSchema.optional(),
  imageAssetType: cardImageAssetTypeSchema.optional(),
  estimatedNetValue: z.number().finite(),
  valueBreakdown: z
    .object({
      headlineValue: z.number().finite(),
      headlineLabel: z.string().min(1),
      benefitAdjustment: z.number().nonnegative().optional(),
      annualFee: z.number().nonnegative().optional(),
      estimatedFees: z.number().nonnegative().optional()
    })
    .optional(),
  priorityScore: z.number().finite().default(0),
  effort: plannerRecommendationEffortSchema,
  detailPath: z.string().min(1),
  timelineDays: z.number().int().positive().optional(),
  keyRequirements: z.array(z.string()).min(1),
  scheduleConstraints: z.object({
    activeDays: z.number().int().positive(),
    payoutLagDays: z.number().int().min(0),
    requiredSpend: z.number().positive().optional(),
    requiredDeposit: z.number().nonnegative().optional(),
    requiresDirectDeposit: z.boolean().optional()
  })
});

export const plannerExclusionReasonSchema = z.enum([
  'no_signup_bonus',
  'credit_tier',
  'amex_lifetime_rule',
  'chase_5_24',
  'direct_deposit_required',
  'state_restricted',
  'existing_bank',
  'insufficient_cash'
]);

export const plannerExcludedOfferSchema = z.object({
  id: z.string().min(1),
  lane: plannerRecommendationLaneSchema,
  title: z.string().min(1),
  provider: z.string().min(1),
  reasons: z.array(plannerExclusionReasonSchema).min(1)
});

export const planScheduleItemSchema = z.object({
  recommendationId: z.string().min(1),
  lane: plannerRecommendationLaneSchema,
  startAt: z.number().int().positive(),
  completeAt: z.number().int().positive(),
  payoutAt: z.number().int().positive()
});

export const planScheduleIssueReasonSchema = z.enum([
  'lane_limit',
  'spend_capacity',
  'direct_deposit_slot',
  'pace_limit',
  'timeline_overflow',
  'candidate_pool_limit',
  'dominated_offer'
]);

export const planScheduleIssueSchema = z.object({
  recommendationId: z.string().min(1),
  lane: plannerRecommendationLaneSchema,
  reason: planScheduleIssueReasonSchema
});

export const planRequestOptionsSchema = z.object({
  maxCards: z.number().int().min(0).max(6).optional(),
  maxBanking: z.number().int().min(0).max(6).optional()
});

const planRequestBaseSchema = z.object({
  options: planRequestOptionsSchema.optional(),
  overrides: plannerEligibilityOverridesSchema.optional(),
  selectedOfferIntent: selectedOfferIntentSchema.optional()
});

export const modePlanRequestSchema = z.discriminatedUnion('mode', [
  planRequestBaseSchema.extend({
    mode: z.literal('full'),
    answers: fullPlannerAnswersSchema
  }),
  planRequestBaseSchema.extend({
    mode: z.literal('cards_only'),
    answers: cardsOnlyPlannerAnswersSchema
  })
]);

export const planRequestSchema = modePlanRequestSchema;

export const planResponseSchema = z.object({
  generatedAt: z.number().int().positive(),
  recommendations: z.array(plannerRecommendationSchema),
  consideredRecommendations: z.array(plannerRecommendationSchema).default([]),
  exclusions: z.array(plannerExcludedOfferSchema).default([]),
  schedule: z.array(planScheduleItemSchema).default([]),
  scheduleIssues: z.array(planScheduleIssueSchema).default([])
});

export type PlanRequestOptions = z.infer<typeof planRequestOptionsSchema>;
export type SelectedOfferIntent = z.infer<typeof selectedOfferIntentSchema>;
export type ModePlanBuildRequest = z.infer<typeof modePlanRequestSchema>;
export type PlanBuildRequest = ModePlanBuildRequest;
export type PlanApiResponse = z.infer<typeof planResponseSchema>;
