import { CountUp } from '@/components/ui/count-up';

const proofPoints = [
  { end: 3500, prefix: '$', suffix: '', label: 'Avg plan value', animate: true },
  { end: 2, prefix: '', suffix: ' min', label: 'Quiz', animate: false },
  { end: 6, prefix: '', suffix: ' months', label: 'Planned for you', animate: false }
];

type ProofPointsProps = {
  className?: string;
  variant?: 'default' | 'trust-bar';
};

function StatValue({ stat, className }: { stat: typeof proofPoints[number]; className: string }) {
  if (stat.animate) {
    return (
      <CountUp end={stat.end} prefix={stat.prefix} suffix={stat.suffix} className={className} />
    );
  }
  return (
    <span className={className}>
      {stat.prefix}{stat.end}{stat.suffix}
    </span>
  );
}

export function ProofPoints({ className = '', variant = 'default' }: ProofPointsProps) {
  if (variant === 'trust-bar') {
    return (
      <section className={className}>
        <div className="grid gap-4 py-4 sm:grid-cols-3 sm:gap-6" style={{ borderTop: '1px solid transparent', borderBottom: '1px solid transparent', borderImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent) 1' }}>
          {proofPoints.map((stat) => (
            <div key={stat.label} className="text-center">
              <StatValue stat={stat} className="font-heading text-5xl text-text-primary md:text-7xl" />
              <p className="mt-1 text-lg uppercase tracking-[0.22em] text-text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="grid gap-6 sm:grid-cols-3">
        {proofPoints.map((stat) => (
          <div key={stat.label} className="text-center">
            <StatValue stat={stat} className="font-heading text-6xl text-text-primary md:text-7xl" />
            <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
