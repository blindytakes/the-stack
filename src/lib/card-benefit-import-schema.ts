import { z } from 'zod';

export const benefitCategoryValues = [
  'PURCHASE_PROTECTION',
  'EXTENDED_WARRANTY',
  'CELL_PHONE',
  'RENTAL_CAR',
  'TRAVEL_INSURANCE',
  'LOUNGE_ACCESS',
  'PRICE_PROTECTION',
  'RETURN_PROTECTION',
  'CONCIERGE',
  'TSA_GLOBAL_ENTRY',
  'STREAMING_CREDITS',
  'DINING_CREDITS',
  'TRAVEL_CREDITS',
  'OTHER'
] as const;

export const benefitCategorySchema = z.enum(benefitCategoryValues);

export const cardBenefitImportRecordSchema = z.object({
  slug: z.string().trim().min(1),
  benefits: z.array(
    z.object({
      category: benefitCategorySchema,
      name: z.string().trim().min(1),
      description: z.string().trim().min(1),
      estimatedValue: z.number().finite().nonnegative().optional(),
      activationMethod: z.string().trim().min(1).optional(),
      finePrint: z.string().trim().min(1).optional()
    })
  )
});

export const cardBenefitsImportDatasetSchema = z.array(cardBenefitImportRecordSchema);

export type CardBenefitImportRecord = z.infer<typeof cardBenefitImportRecordSchema>;
