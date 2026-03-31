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
      {steps.map((item) => {
        const titleWidthClass =
          item.step === '02' ? 'max-w-[14ch] md:max-w-[14.5ch]' : 'max-w-[11ch]';

        return (
          <div
            key={item.step}
            className="group h-[220px] [perspective:1000px]"
          >
            <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front face */}
              <div className="absolute inset-0 grid grid-rows-[auto_1fr] rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-7 backdrop-blur-sm [backface-visibility:hidden] md:px-6 md:py-8">
                <span className="justify-self-center text-center text-xs font-medium uppercase tracking-[0.2em] text-brand-teal">
                  Step {item.step.replace(/^0/, '')}
                </span>
                <div className="flex items-center justify-center">
                  <h3
                    className={`${titleWidthClass} text-center text-2xl font-semibold leading-[1.15] text-text-primary md:text-3xl`}
                  >
                    {item.title}
                  </h3>
                </div>
              </div>
              {/* Back face */}
              <div className="absolute inset-0 grid grid-rows-[auto_1fr] rounded-[1.75rem] border border-brand-teal/20 bg-white/[0.06] px-5 py-7 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)] md:px-6 md:py-8">
                <span className="justify-self-center text-center text-xs font-medium uppercase tracking-[0.2em] text-brand-teal">
                  Step {item.step.replace(/^0/, '')}
                </span>
                <div className="flex items-center">
                  <p className="text-sm leading-7 text-text-primary">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
