'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type CustomerReview = {
  name: string;
  quote: string;
  result: string;
  detail: string;
};

type CustomerReviewsRailProps = {
  reviews: readonly CustomerReview[];
};

export function CustomerReviewsRail({ reviews }: CustomerReviewsRailProps) {
  const scrollId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const syncControls = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      const firstCard = element.querySelector<HTMLElement>('[data-review-card]');
      const cardWidth = firstCard?.offsetWidth ?? Math.floor(element.clientWidth * 0.84);
      const scrollAmount = cardWidth + 16;

      setCanScrollPrev(element.scrollLeft > 4);
      setCanScrollNext(element.scrollLeft < maxScrollLeft - 4);
      setActiveIndex(Math.min(reviews.length - 1, Math.max(0, Math.round(element.scrollLeft / scrollAmount))));
    };

    syncControls();

    const resizeObserver = new ResizeObserver(syncControls);
    resizeObserver.observe(element);

    element.addEventListener('scroll', syncControls, { passive: true });

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener('scroll', syncControls);
    };
  }, [reviews.length]);

  const scrollToCard = (nextIndex: number) => {
    const card = cardRefs.current[nextIndex];

    if (!card) {
      return;
    }

    card.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
  };

  return (
    <div className="relative mt-8">
      <button
        type="button"
        onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
        disabled={!canScrollPrev}
        aria-controls={scrollId}
        aria-label="Scroll reviews backward"
        className="absolute left-0 top-[11.5rem] z-20 hidden h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-text-primary shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-brand-teal/30 hover:text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
          <path
            d="M10.5 3.5 6 8l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scrollToCard(Math.min(reviews.length - 1, activeIndex + 1))}
        disabled={!canScrollNext}
        aria-controls={scrollId}
        aria-label="Scroll reviews forward"
        className="absolute right-0 top-[11.5rem] z-20 hidden h-12 w-12 translate-x-1/2 items-center justify-center rounded-full border border-brand-teal/20 bg-black/60 text-brand-teal shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
          <path
            d="M5.5 3.5 10 8l-4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="relative">
        {canScrollPrev ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-6 bg-gradient-to-r from-[rgba(7,9,16,0.96)] via-[rgba(7,9,16,0.72)] to-transparent lg:block" />
        ) : null}
        {canScrollNext ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-[rgba(7,9,16,0.96)] via-[rgba(7,9,16,0.78)] to-transparent lg:block" />
        ) : null}
        <div
          id={scrollId}
          ref={scrollRef}
          className="overflow-x-auto pb-4 [scroll-padding-inline:1.5rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max min-w-full snap-x snap-mandatory gap-4 pl-6 pr-10">
          {reviews.map((review, index) => (
            <article
              key={review.name}
              data-review-card
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="flex h-[470px] w-[320px] min-w-[320px] shrink-0 snap-start flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:w-[380px] md:min-w-[380px]"
            >
              <div className="min-h-0 flex-1 overflow-hidden">
                <p className="text-[1.55rem] leading-[1.4] text-text-primary md:text-[1.65rem] md:leading-[1.45]">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 min-h-[6.5rem] border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-teal">{review.result}</p>
                <p className="mt-2 text-base font-semibold text-text-primary">{review.name}</p>
                <p className="mt-1 min-h-[3rem] text-sm text-text-secondary">{review.detail}</p>
              </div>
            </article>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
