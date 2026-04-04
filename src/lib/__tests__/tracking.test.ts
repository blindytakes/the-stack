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

  it('rejects unknown source values', () => {
    expect(trackedSourceSchema.safeParse('unknown_source').success).toBe(false);
  });
});
