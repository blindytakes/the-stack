import { describe, expect, it } from 'vitest';
import { trackedSourceSchema } from '@/lib/tracking';

describe('trackedSourceSchema', () => {
  it('accepts newsletter signup sources used across the site', () => {
    expect(trackedSourceSchema.safeParse('homepage').success).toBe(true);
    expect(trackedSourceSchema.safeParse('footer').success).toBe(true);
    expect(trackedSourceSchema.safeParse('about').success).toBe(true);
    expect(trackedSourceSchema.safeParse('blog').success).toBe(true);
    expect(trackedSourceSchema.safeParse('newsletter_page').success).toBe(true);
  });

  it('accepts affiliate redirect sources used across the site', () => {
    expect(trackedSourceSchema.safeParse('card_detail').success).toBe(true);
    expect(trackedSourceSchema.safeParse('cards_directory').success).toBe(true);
  });

  it('rejects unknown source values', () => {
    expect(trackedSourceSchema.safeParse('unknown_source').success).toBe(false);
  });
});
