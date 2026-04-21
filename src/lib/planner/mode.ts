import { z } from 'zod';

export const plannerModeSchema = z.enum(['full', 'cards_only']);

export type PlannerMode = z.infer<typeof plannerModeSchema>;
