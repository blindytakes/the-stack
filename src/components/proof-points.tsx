import { CountUp } from '@/components/ui/count-up';

const proofPoints = [
  { end: 100, prefix: '$', suffix: 'k+', label: 'In bonuses earned' },
  { end: 200, prefix: '', suffix: '+', label: 'Offers tracked' },
  { end: 100, prefix: '', suffix: '%', label: 'Free to use' },
  { end: 1, prefix: '', suffix: '', label: 'Plan for you' }
];

type ProofPointsProps = {
  className?: string;
  variant?: 'default' | 'trust-bar';
};

export function ProofPoints({ className = '', variant = 'default' }: ProofPointsProps) {
  if (variant === 'trust-bar') {
    return (
      <section className={className}>
        <div className="grid grid-cols-2 gap-4 border-y border-[#ffffff10] py-4 lg:flex lg:items-center lg:justify-between lg:gap-6">
          {proofPoints.map((stat) => (
            <div
              key={stat.label}
              className="text-center lg:flex-1"
            >
              <CountUp
                end={stat.end}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="font-heading text-5xl text-text-primary md:text-7xl"
              />
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
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {proofPoints.map((stat) => (
          <div key={stat.label} className="text-center">
            <CountUp
              end={stat.end}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="font-heading text-6xl text-text-primary md:text-7xl"
            />
            <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
