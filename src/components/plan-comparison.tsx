'use client';

import { useEffect, useRef, useState } from 'react';

interface GanttRow {
  name: string;
  type: 'card' | 'bank';
  action: string;
  value: string;
  startCol: number;
  endCol: number;
}

const ganttRows: GanttRow[] = [
  { name: 'Chase Sapphire Preferred', type: 'card', action: 'Spend $4k in 3 months', value: '$1,250', startCol: 1, endCol: 4 },
  { name: 'Chase Total Checking', type: 'bank', action: 'Direct deposit × 2 months', value: '$400', startCol: 2, endCol: 4 },
  { name: 'Amex Gold Card', type: 'card', action: 'Spend $6k in 6 months', value: '$1,200', startCol: 4, endCol: 7 },
  { name: 'SoFi Checking & Savings', type: 'bank', action: 'Direct deposit $1k', value: '$650', startCol: 5, endCol: 7 },
];

export function PlanComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* Headline */}
      <div className="mb-10 text-center">
        <p className="text-lg text-text-muted md:text-xl">
          Other sites give you a list.
        </p>
        <p className="mt-1 text-xl font-semibold text-text-primary md:text-2xl">
          The Stack gives you a step-by-step plan.
        </p>
      </div>

      {/* Gantt chart */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_8px_60px_rgba(45,212,191,0.08),0_2px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(212,168,83,0.08),transparent_40%)]" />

        {/* Month headers */}
        <div className="relative grid grid-cols-[180px_repeat(6,1fr)] md:grid-cols-[220px_repeat(6,1fr)]">
          <div className="px-5 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-muted/60">
              Move
            </span>
          </div>
          {[1, 2, 3, 4, 5, 6].map((m) => (
            <div key={m} className="px-2 py-4 text-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted/50">
                M{m}
              </span>
            </div>
          ))}
          {/* Subtle bottom line */}
          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Rows */}
        {ganttRows.map((row, i) => {
          const isCard = row.type === 'card';
          const dotColor = isCard
            ? 'bg-brand-teal shadow-[0_0_6px_rgba(45,212,191,0.3)]'
            : 'bg-brand-gold shadow-[0_0_6px_rgba(212,168,83,0.3)]';

          // Bar styles with gradients
          const barGradient = isCard
            ? 'bg-gradient-to-r from-brand-teal/25 via-brand-teal/15 to-brand-teal/25'
            : 'bg-gradient-to-r from-brand-gold/25 via-brand-gold/15 to-brand-gold/25';
          const barBorder = isCard ? 'border-brand-teal/25' : 'border-brand-gold/25';
          const barGlow = isCard
            ? 'shadow-[inset_0_1px_0_rgba(45,212,191,0.2),0_0_20px_rgba(45,212,191,0.08)]'
            : 'shadow-[inset_0_1px_0_rgba(212,168,83,0.2),0_0_20px_rgba(212,168,83,0.08)]';
          const valueColor = 'text-white';

          return (
            <div
              key={i}
              className="relative grid grid-cols-[180px_repeat(6,1fr)] md:grid-cols-[220px_repeat(6,1fr)]"
            >
              {/* Subtle row divider */}
              {i > 0 && (
                <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              )}

              {/* Label */}
              <div
                className={`flex items-center gap-3 px-5 py-5 transition-all duration-700 ${
                  isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-text-primary">{row.name}</p>
                </div>
              </div>

              {/* Bar cells */}
              <div className="col-span-6 grid grid-cols-6 items-center py-1">
                {/* Faint column guides */}
                <div className="pointer-events-none col-span-6 row-start-1 grid grid-cols-6">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className={`py-5 ${j < 5 ? 'border-r border-white/[0.03]' : ''}`} />
                  ))}
                </div>

                {/* Bar with gradient + glow */}
                <div
                  className={`relative row-start-1 flex items-center justify-center rounded-xl border px-3 py-3 transition-all duration-700 ${barBorder} ${barGlow} ${
                    isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                  style={{
                    gridColumnStart: row.startCol,
                    gridColumnEnd: row.endCol,
                    transformOrigin: 'left',
                    transitionDelay: `${i * 150 + 200}ms`,
                  }}
                >
                  <div className={`absolute inset-0 rounded-xl ${barGradient}`} />
                  {/* Shine effect */}
                  <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className={`relative z-10 text-base font-bold ${valueColor}`}>
                    {row.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="relative grid grid-cols-[180px_repeat(6,1fr)] bg-white/[0.03] md:grid-cols-[220px_repeat(6,1fr)]">
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div
            className={`px-5 py-5 transition-all duration-700 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              6-month total
            </span>
          </div>
          <div className="col-span-6 flex items-center justify-end px-5 py-5">
            <span
              className={`font-heading text-2xl text-brand-teal md:text-3xl transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: '800ms' }}
            >
              $3,500
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-teal shadow-[0_0_6px_rgba(45,212,191,0.5)]" />
          <span className="text-xs text-text-muted/70">Credit card bonus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-gold shadow-[0_0_6px_rgba(212,168,83,0.5)]" />
          <span className="text-xs text-text-muted/70">Bank bonus</span>
        </div>
      </div>
    </div>
  );
}
