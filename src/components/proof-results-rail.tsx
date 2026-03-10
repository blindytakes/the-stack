'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type ProofResultStory = {
  metric: string;
  headline: string;
  name: string;
  summary: string;
  tags: readonly string[];
  setup: string;
};

type ProofResultsRailProps = {
  stories: readonly ProofResultStory[];
};

export function ProofResultsRail({ stories }: ProofResultsRailProps) {
  const scrollId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
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
      const firstCard = element.querySelector<HTMLElement>('[data-proof-card]');
      const cardWidth = firstCard?.offsetWidth ?? Math.floor(element.clientWidth * 0.84);
      const scrollAmount = cardWidth + 16;

      setCanScrollPrev(element.scrollLeft > 4);
      setCanScrollNext(element.scrollLeft < maxScrollLeft - 4);
      setActiveIndex(Math.min(stories.length - 1, Math.max(0, Math.round(element.scrollLeft / scrollAmount))));
    };

    syncControls();

    const resizeObserver = new ResizeObserver(syncControls);
    resizeObserver.observe(element);

    element.addEventListener('scroll', syncControls, { passive: true });

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener('scroll', syncControls);
    };
  }, [stories.length]);

  const scrollByCard = (direction: -1 | 1) => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const firstCard = element.querySelector<HTMLElement>('[data-proof-card]');
    const cardWidth = firstCard?.offsetWidth ?? Math.floor(element.clientWidth * 0.82);
    const scrollAmount = cardWidth + 16;

    element.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-end">
        <p className="text-[11px] uppercase tracking-[0.26em] text-text-muted">
          {activeIndex + 1} / {stories.length}
        </p>
      </div>

      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={!canScrollPrev}
          aria-controls={scrollId}
          aria-label="Scroll real results backward"
          className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-text-primary shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-brand-teal/30 hover:text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
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
          onClick={() => scrollByCard(1)}
          disabled={!canScrollNext}
          aria-controls={scrollId}
          aria-label="Scroll real results forward"
          className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand-teal/20 bg-black/60 text-brand-teal shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-brand-teal/35 hover:bg-brand-teal/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
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
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-6 bg-gradient-to-r from-bg via-bg/65 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-18 bg-gradient-to-l from-bg via-bg/75 to-transparent lg:block" />
          <div
            id={scrollId}
            ref={scrollRef}
            className="overflow-x-auto pb-3 [scroll-padding-inline:1.5rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max min-w-full snap-x snap-mandatory gap-4 pl-6 pr-10">
              {stories.map((result) => (
                <article
                  key={result.name}
                  data-proof-card
                  className="flex min-h-[17rem] w-[19rem] min-w-[19rem] snap-start flex-col rounded-[1.65rem] border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand-teal/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Real result</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                      {result.tags[0]}
                    </span>
                  </div>
                  <p className="mt-5 font-heading text-4xl leading-none text-text-primary">
                    {result.metric}
                  </p>
                  <p className="mt-3 text-2xl font-semibold leading-tight text-text-primary">
                    {result.headline}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-text-secondary">{result.summary}</p>
                  <div className="mt-auto border-t border-white/10 pt-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-brand-teal">
                      {result.setup}
                    </p>
                    <p className="mt-2 font-semibold text-text-primary">{result.name}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
