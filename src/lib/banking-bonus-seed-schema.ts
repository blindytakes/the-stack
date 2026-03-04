import { z } from 'zod';

const httpUrlSchema = z.string().url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}, 'URL must use http or https');

const usStateCodeSchema = z.string().trim().length(2).transform((value) => value.toUpperCase());

export const bankingAccountTypeValues = ['checking', 'savings', 'bundle'] as const;
export const bankingAccountTypeSchema = z.enum(bankingAccountTypeValues);

const directDepositSchema = z
  .object({
    required: z.boolean().default(false),
    minimumAmount: z.number().nonnegative().optional()
  })
  .superRefine((data, ctx) => {
    if (!data.required && data.minimumAmount != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minimumAmount'],
        message: 'minimumAmount requires directDeposit.required=true'
      });
    }
  });

export const bankingBonusSeedRecordSchema = z.object({
  slug: z.string().trim().min(1),
  bankName: z.string().trim().min(1),
  offerName: z.string().trim().min(1),
  accountType: bankingAccountTypeSchema,
  headline: z.string().trim().min(1),
  bonusAmount: z.number().nonnegative(),
  estimatedFees: z.number().nonnegative().default(0),
  directDeposit: directDepositSchema.default({ required: false }),
  minimumOpeningDeposit: z.number().nonnegative().optional(),
  holdingPeriodDays: z.number().int().positive().optional(),
  requiredActions: z.array(z.string().trim().min(1)).min(1),
  stateRestrictions: z.array(usStateCodeSchema).optional(),
  notes: z.string().trim().min(1).optional(),
  offerUrl: httpUrlSchema.optional(),
  affiliateUrl: httpUrlSchema.optional(),
  isActive: z.boolean().default(true),
  lastVerified: z.string().datetime().optional()
});

export const bankingBonusesSeedDatasetSchema = z.array(bankingBonusSeedRecordSchema);

export type BankingBonusSeedRecord = z.infer<typeof bankingBonusSeedRecordSchema>;
