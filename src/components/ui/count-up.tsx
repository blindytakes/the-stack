'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  /** The final value to count up to (e.g. 200) */
  end: number;
  /** Optional prefix like "$" */
  prefix?: string;
  /** Optional suffix like "+" */
  suffix?: string;
  /** Duration in ms (default 1500) */
  duration?: number;
  /** Additional className for the number */
  className?: string;
};

export function CountUp({
  end,
  prefix = '',
  suffix = '',
  duration = 1500,
  className = ''
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = performance.now();

          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for a satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
