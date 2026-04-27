import { describe, expect, it } from 'vitest';
import {
  buildPointsAdvisorHref,
  buildPointsAdvisorResult,
  getPointsAdvisorProgramFromCardSlug
} from '@/lib/points-advisor';

describe('points advisor', () => {
  it('prefers Points Boost for Sapphire Reserve users who want simple travel with low effort', () => {
    const result = buildPointsAdvisorResult({
      programId: 'chase-sapphire-reserve',
      pointsBalance: 100000,
      goal: 'simple_travel',
      timeHorizon: 'soon',
      effortTolerance: 'low'
    });

    expect(result.topRecommendations[0]?.shortLabel).toBe('Points Boost');
    expect(result.topRecommendations[0]?.minimumValue).toBe(1750);
    expect(result.topRecommendations[0]?.maximumValue).toBe(2000);
    expect(result.easiestGoodOption.shortLabel).toBe('Points Boost');
    expect(result.highestUpsideOption.shortLabel).toBe('Airline transfer');
  });

  it('puts statement credit first for Amex users who explicitly want cash now', () => {
    const result = buildPointsAdvisorResult({
      programId: 'amex-membership-rewards',
      pointsBalance: 100000,
      goal: 'cash_now',
      timeHorizon: 'now',
      effortTolerance: 'low'
    });

    expect(result.topRecommendations[0]?.shortLabel).toBe('Statement credit');
    expect(result.topRecommendations[0]?.estimatedValue).toBe(600);
    expect(result.topRecommendations[0]?.watchOut).toContain('value leak');
  });

  it('pushes Venture X users toward airline transfers when they want premium-flight upside', () => {
    const result = buildPointsAdvisorResult({
      programId: 'capital-one-venture-x',
      pointsBalance: 100000,
      goal: 'premium_flight',
      timeHorizon: 'later',
      effortTolerance: 'high'
    });

    expect(result.topRecommendations[0]?.shortLabel).toBe('Airline transfer');
    expect(result.topRecommendations[0]?.minimumValue).toBe(1600);
    expect(result.topRecommendations[0]?.maximumValue).toBe(2200);
    expect(result.easiestGoodOption.shortLabel).toBe('Travel erase');
  });

  it('recommends holding MR points when the user is unsure and willing to wait', () => {
    const result = buildPointsAdvisorResult({
      programId: 'amex-membership-rewards',
      pointsBalance: 85000,
      goal: 'not_sure',
      timeHorizon: 'later',
      effortTolerance: 'low'
    });

    expect(result.topRecommendations[0]?.shortLabel).toBe('Hold for later');
    expect(result.topRecommendations[0]?.recommendationLabel).toBe('Best overall fit');
  });

  it('maps supported card slugs back to the correct advisor program', () => {
    expect(getPointsAdvisorProgramFromCardSlug('amex-platinum-card')).toBe(
      'amex-membership-rewards'
    );
    expect(getPointsAdvisorProgramFromCardSlug('chase-sapphire-reserve')).toBe(
      'chase-sapphire-reserve'
    );
    expect(getPointsAdvisorProgramFromCardSlug('capital-one-venture-x')).toBe(
      'capital-one-venture-x'
    );
    expect(getPointsAdvisorProgramFromCardSlug('chase-sapphire-preferred')).toBeNull();
  });

  it('builds advisor links with program and optional points prefill', () => {
    expect(
      buildPointsAdvisorHref({
        cardSlug: 'capital-one-venture-x',
        pointsBalance: 128400
      })
    ).toBe('/tools/points-advisor?program=capital-one-venture-x&points=128400');

    expect(
      buildPointsAdvisorHref({
        programId: 'amex-membership-rewards'
      })
    ).toBe('/tools/points-advisor?program=amex-membership-rewards');
  });
});
