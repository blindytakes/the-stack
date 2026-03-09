import { exclusionActions } from '@/components/plan/plan-results-config';
import type { PlannerExcludedOffer } from '@/lib/planner-recommendations';

type EmptyLaneCardProps = {
  lane: 'cards' | 'banking';
  exclusions: PlannerExcludedOffer[];
  ownedCardsCount?: number;
  amexLifetimeBlockedCount?: number;
  chase524Blocked?: boolean;
};

export function EmptyLaneCard({
  lane,
  exclusions,
  ownedCardsCount = 0,
  amexLifetimeBlockedCount = 0,
  chase524Blocked = false
}: EmptyLaneCardProps) {
  const label = lane === 'cards' ? 'Card Bonuses' : 'Banking Bonuses';
  const fallback =
    lane === 'cards'
      ? chase524Blocked
        ? 'Drop below Chase 5/24 if you want Chase cards back in the recommendation pool.'
        : amexLifetimeBlockedCount > 0
          ? 'Remove prior Amex cards only if you are confident the lifetime rule does not apply.'
          : ownedCardsCount > 0
            ? 'Remove cards you already have if you want to explore more open-card options.'
            : 'Adjust fee and credit filters to unlock more card bonus paths.'
      : 'Adjust direct deposit and state filters to unlock more bank bonus paths.';
  const emptyMessage =
    lane === 'cards' && chase524Blocked
      ? 'Chase cards were removed because you marked yourself at or over 5/24.'
      : lane === 'cards' && amexLifetimeBlockedCount > 0
        ? `We removed ${amexLifetimeBlockedCount} Amex card${amexLifetimeBlockedCount === 1 ? '' : 's'} you marked as previously held.`
        : lane === 'cards' && ownedCardsCount > 0
          ? `We excluded ${ownedCardsCount} card${ownedCardsCount === 1 ? '' : 's'} you already have from new-card recommendations.`
          : 'No matching offers were found for this lane yet.';
  const reasonActions = Array.from(
    new Set(exclusions.flatMap((offer) => offer.reasons.map((reason) => exclusionActions[reason])))
  ).slice(0, 3);
  const unlockActions = reasonActions.length > 0 ? reasonActions : [fallback];

  return (
    <article className="rounded-2xl border border-dashed border-white/20 bg-bg-surface p-5">
      <h3 className="text-xl font-semibold text-text-primary">{label}: Not a fit right now</h3>
      <p className="mt-2 text-base leading-7 text-text-secondary">
        {exclusions.length > 0
          ? `${exclusions.length} offers were filtered out by your current inputs.`
          : emptyMessage}
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-text-secondary">
        {unlockActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </article>
  );
}
