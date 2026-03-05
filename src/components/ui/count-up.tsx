'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  /** The final value to count to (e.g. 200) */
  end: number;
  /** Starting value for countdown mode (e.g. 500 counting down to end) */
  from?: number;
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
  from,
  prefix = '',
  suffix = '',
  duration = 1500,
  className = ''
}: CountUpProps) {
  const start = from ?? 0;
  const [count, setCount] = useState(start);
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
          const delta = end - start;

          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for a satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + eased * delta));

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
  }, [end, start, duration, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
