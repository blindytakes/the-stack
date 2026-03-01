import { z } from 'zod';

export const trackedSourceValues = [
  'homepage',
  'footer',
  'card_detail',
  'card_finder',
  'cards_directory',
  'hidden_benefits',
  'card_vs_card'
] as const;

export const trackedSourceSchema = z.enum(trackedSourceValues);

export type TrackedSource = z.infer<typeof trackedSourceSchema>;
