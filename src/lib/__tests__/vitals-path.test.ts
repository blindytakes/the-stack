import { describe, expect, it } from 'vitest';
import { normalizeVitalPathToRoute } from '../vitals-path';

describe('normalizeVitalPathToRoute', () => {
  it('normalizes known static routes', () => {
    expect(normalizeVitalPathToRoute('/tools/card-finder')).toBe('/tools/card-finder');
    expect(normalizeVitalPathToRoute('/tools/premium-card-calculator')).toBe(
      '/tools/premium-card-calculator'
    );
    expect(normalizeVitalPathToRoute('/plan/results')).toBe('/plan/results');
    expect(normalizeVitalPathToRoute('/blog/')).toBe('/blog');
    expect(normalizeVitalPathToRoute('/cards/')).toBe('/cards');
  });

  it('normalizes dynamic card, blog, and learn slugs', () => {
    expect(normalizeVitalPathToRoute('/cards/apex-cash-plus')).toBe('/cards/[slug]');
    expect(normalizeVitalPathToRoute('/banking/summit-national-checking-300')).toBe('/banking/[slug]');
    expect(normalizeVitalPathToRoute('/blog/why-amex-platinum-is-overrated')).toBe('/blog/[slug]');
    expect(normalizeVitalPathToRoute('/learn/annual-fee-math')).toBe('/learn/[slug]');
  });

  it('drops query strings, hashes, and full URL inputs', () => {
    expect(normalizeVitalPathToRoute('/cards/apex-cash-plus?src=card_finder')).toBe('/cards/[slug]');
    expect(normalizeVitalPathToRoute('https://example.com/blog/why-sign-up-bonuses-matter')).toBe(
      '/blog/[slug]'
    );
    expect(normalizeVitalPathToRoute('https://example.com/learn/first-card-playbook#top')).toBe(
      '/learn/[slug]'
    );
  });

  it('maps unknown or invalid paths to /other', () => {
    expect(normalizeVitalPathToRoute('/tools/not-a-real-tool')).toBe('/other');
    expect(normalizeVitalPathToRoute('/totally-random-path')).toBe('/other');
    expect(normalizeVitalPathToRoute('not a url')).toBe('/other');
    expect(normalizeVitalPathToRoute('')).toBe('/other');
  });
});
