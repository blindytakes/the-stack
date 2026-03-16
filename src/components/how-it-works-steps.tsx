'use client';

interface Step {
  step: string;
  title: string;
  summary: string;
  description: string;
  icon: React.ReactNode;
}

type HowItWorksStepsProps = {
  steps: readonly Step[];
};

export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  return (
    <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
      {steps.map((item) => (
        <div
          key={item.step}
          className="group h-[220px] [perspective:1000px]"
        >
          <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            {/* Front face */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm [backface-visibility:hidden] md:p-6">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-teal">
                Step {item.step.replace(/^0/, '')}
              </span>
              <h3 className="mt-3 text-center text-2xl font-semibold text-text-primary md:text-3xl">
                {item.title}
              </h3>
            </div>
            {/* Back face */}
            <div className="absolute inset-0 flex flex-col justify-center rounded-[1.75rem] border border-brand-teal/20 bg-white/[0.06] p-5 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-6">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-teal">
                Step {item.step.replace(/^0/, '')}
              </span>
              <p className="mt-3 text-sm leading-7 text-text-primary">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
