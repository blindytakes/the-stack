'use client';

interface TimelineStep {
  month: string;
  name: string;
  type: 'card' | 'bank';
  detail: string;
  value: string;
}

const timelineSteps: TimelineStep[] = [
  { month: 'Month 1', name: 'Chase Sapphire Preferred', type: 'card', detail: 'Spend $4k in 3 months', value: '$1,000' },
  { month: 'Month 2', name: 'Chase Total Checking', type: 'bank', detail: 'Direct deposit × 2 months', value: '$300' },
  { month: 'Month 4', name: 'Amex Gold Card', type: 'card', detail: 'Spend $6k in 6 months', value: '$1,000' },
  { month: 'Month 6', name: 'SoFi Checking & Savings', type: 'bank', detail: 'Direct deposit $1k', value: '$325' },
];

const total = '$2,625';

export function SamplePlanTimeline() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
            Your 6-Month Plan
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-brand-teal" />
              <span className="text-xs text-text-muted">Card</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-brand-gold" />
              <span className="text-xs text-text-muted">Bank</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-5 md:px-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-teal/40 via-brand-teal/20 to-transparent" />

            <div className="space-y-0">
              {timelineSteps.map((step, i) => {
                const showMonth =
                  i === 0 || timelineSteps[i - 1].month !== step.month;
                return (
                  <div key={i}>
                    {showMonth && (
                      <div className="mb-2 ml-10 pt-1">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                          {step.month}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-4 pb-4">
                      {/* Dot */}
                      <div className="relative z-10 mt-1.5 flex h-[31px] w-[31px] shrink-0 items-center justify-center">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            step.type === 'card'
                              ? 'bg-brand-teal shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                              : 'bg-brand-gold shadow-[0_0_8px_rgba(212,168,83,0.5)]'
                          }`}
                        />
                      </div>
                      {/* Content */}
                      <div className="flex flex-1 items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {step.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {step.detail}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-text-primary">
                          {step.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-6 py-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            6-month total
          </p>
          <p className="font-heading text-3xl text-brand-teal">{total}</p>
        </div>
      </div>
    </div>
  );
}
