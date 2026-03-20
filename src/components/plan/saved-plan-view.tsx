import Link from 'next/link';
import type { PlanSnapshotData } from '@/lib/plan-email';

type SavedPlanViewProps = {
  planId: string;
  createdAt: Date;
  snapshot: PlanSnapshotData;
};

function formatValue(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatSavedAt(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getUpcomingMilestones(snapshot: PlanSnapshotData, referenceDate: Date) {
  const windowStart = startOfDay(referenceDate);
  const windowEnd = addDays(windowStart, 45);
  const futureMilestones = [...snapshot.milestones]
    .filter((milestone) => milestone.date.getTime() >= windowStart.getTime())
    .sort((left, right) => left.date.getTime() - right.date.getTime());
  const inWindow = futureMilestones.filter(
    (milestone) => milestone.date.getTime() <= windowEnd.getTime()
  );

  return (inWindow.length > 0 ? inWindow : futureMilestones).slice(0, 6);
}

function resolveLane(
  recommendation: PlanSnapshotData['recommendations'][number]
): 'cards' | 'banking' {
  if (recommendation.lane) return recommendation.lane;
  return recommendation.detailPath?.startsWith('/banking') ? 'banking' : 'cards';
}

function withSavedPlanSource(path: string | undefined) {
  if (!path) return null;
  return `${path}${path.includes('?') ? '&' : '?'}src=saved_plan`;
}

function laneBadgeClass(lane: 'cards' | 'banking') {
  return lane === 'banking'
    ? 'border-brand-teal/20 bg-brand-teal/10 text-brand-teal'
    : 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold';
}

export function SavedPlanView({ planId, createdAt, snapshot }: SavedPlanViewProps) {
  const referenceDate = new Date();
  const upcomingMilestones = getUpcomingMilestones(snapshot, referenceDate);
  const cardCount = snapshot.recommendations.filter((item) => resolveLane(item) === 'cards').length;
  const bankCount = snapshot.recommendations.filter((item) => resolveLane(item) === 'banking').length;
  const primaryCtaHref = snapshot.cardsOnlyMode ? '/cards/plan' : '/tools/card-finder';

  return (
    <div className="mx-auto w-full max-w-[80rem] px-5 pt-12 pb-16">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-elevated p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Saved plan</p>
            <h1 className="mt-3 font-heading text-4xl text-text-primary">
              {snapshot.cardsOnlyMode ? 'Your saved card plan' : 'Your saved bonus plan'}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
              This is the web version linked from your email. It preserves the saved estimate,
              next actions, and recommended moves from the moment the plan was shared.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-bg/40 px-3 py-1 text-xs text-text-secondary">
                Saved {formatSavedAt(createdAt)}
              </span>
              <span className="rounded-full border border-white/10 bg-bg/40 px-3 py-1 text-xs text-text-secondary">
                {snapshot.recommendations.length} move{snapshot.recommendations.length === 1 ? '' : 's'}
              </span>
              {cardCount > 0 ? (
                <span className="rounded-full border border-white/10 bg-bg/40 px-3 py-1 text-xs text-text-secondary">
                  {cardCount} card bonus{cardCount === 1 ? '' : 'es'}
                </span>
              ) : null}
              {bankCount > 0 ? (
                <span className="rounded-full border border-white/10 bg-bg/40 px-3 py-1 text-xs text-text-secondary">
                  {bankCount} bank bonus{bankCount === 1 ? '' : 'es'}
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
              >
                Build a new plan
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-white/30 hover:text-text-primary"
              >
                Back to home
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),rgba(255,255,255,0.03))] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">6-month estimate</p>
            <div className="mt-3 text-5xl font-semibold text-text-primary">
              {formatValue(snapshot.totalValue)}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Snapshot ID: <span className="font-mono text-text-primary">{planId}</span>
            </p>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Offer terms and availability may have changed since this snapshot was saved. Check
              the linked offer pages before applying.
            </p>
          </aside>
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-bg-surface p-6 xl:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Next actions</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">What to do first</h2>
            <p className="mt-2 text-base leading-7 text-text-secondary">
              These are the closest saved milestones from the plan snapshot.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcomingMilestones.length > 0 ? (
            upcomingMilestones.map((milestone) => (
              <div
                key={`${milestone.label}-${milestone.title}-${milestone.date.toISOString()}`}
                className="rounded-2xl border border-white/10 bg-bg/40 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-teal">
                  {formatShortDate(milestone.date)}
                </p>
                <h3 className="mt-2 text-base font-semibold text-text-primary">{milestone.label}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{milestone.title}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-bg/40 p-4 text-sm leading-6 text-text-secondary">
              No future milestones were stored with this snapshot.
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Top moves</p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Saved recommendations</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            This list preserves the recommendation order captured in the saved plan.
          </p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {snapshot.recommendations.map((recommendation, index) => {
            const lane = resolveLane(recommendation);
            const detailHref = withSavedPlanSource(recommendation.detailPath);
            const primaryRequirement = recommendation.keyRequirements?.[0];
            const requiresDirectDeposit = recommendation.scheduleConstraints.requiresDirectDeposit;
            const requiredDeposit = recommendation.scheduleConstraints.requiredDeposit;

            return (
              <article
                key={`${recommendation.provider}-${recommendation.title}-${index}`}
                className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${laneBadgeClass(
                      lane
                    )}`}
                  >
                    {lane === 'banking' ? 'Bank bonus' : 'Card bonus'}
                  </span>
                  <span className="text-sm font-semibold text-text-secondary">Move {index + 1}</span>
                </div>

                <p className="mt-4 text-sm text-text-muted">{recommendation.provider}</p>
                <h3 className="mt-1 text-2xl font-semibold text-text-primary">
                  {recommendation.title}
                </h3>
                <p className="mt-3 text-3xl font-semibold text-brand-teal">
                  {formatValue(recommendation.estimatedNetValue)} est.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-bg/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Effort</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-text-primary">
                      {recommendation.effort}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-bg/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Watch for</p>
                    <p className="mt-2 text-sm font-semibold text-text-primary">
                      {requiresDirectDeposit
                        ? 'Direct deposit required'
                        : requiredDeposit
                          ? `Deposit ${formatValue(requiredDeposit)}`
                          : (recommendation.valueBreakdown?.annualFee ?? 0) > 0
                            ? `Annual fee ${formatValue(recommendation.valueBreakdown?.annualFee ?? 0)}`
                            : 'Standard execution'}
                    </p>
                  </div>
                </div>

                {primaryRequirement ? (
                  <p className="mt-4 text-sm leading-6 text-text-secondary">{primaryRequirement}</p>
                ) : null}

                {detailHref ? (
                  <div className="mt-5">
                    <Link
                      href={detailHref}
                      className="inline-flex items-center text-sm font-semibold text-brand-teal transition hover:underline"
                    >
                      View offer details →
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
