'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const REVEAL_DELAY_MS = 80;
const EARLY_REVEAL_OFFSET_PX = 240;

function buildAllIndexes(count: number) {
  return new Set(Array.from({ length: count }, (_, index) => index));
}

export function useFirstGridRowReveal(itemCount: number) {
  const gridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(Boolean(prefersReducedMotion));
  const [isMeasured, setIsMeasured] = useState(Boolean(prefersReducedMotion));
  const [canAnimateEntrance, setCanAnimateEntrance] = useState(false);
  const [firstRowIndexes, setFirstRowIndexes] = useState<Set<number>>(() =>
    prefersReducedMotion ? buildAllIndexes(itemCount) : new Set()
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      setIsMeasured(true);
      setCanAnimateEntrance(false);
      setFirstRowIndexes(buildAllIndexes(itemCount));
      return;
    }
    if (!isMeasured) return;
    if (!canAnimateEntrance || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const grid = gridRef.current;
    if (!grid) return;
    let timeoutId: number | null = null;

    const reveal = () => {
      timeoutId = window.setTimeout(() => {
        setIsVisible(true);
      }, REVEAL_DELAY_MS);
    };

    const bounds = grid.getBoundingClientRect();
    if (bounds.top <= window.innerHeight + EARLY_REVEAL_OFFSET_PX) {
      reveal();
      return () => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      {
        // Use a pixel margin instead of a percentage threshold so tall grids
        // reveal predictably before the user scrolls deep into the results.
        threshold: 0,
        rootMargin: `0px 0px ${EARLY_REVEAL_OFFSET_PX}px 0px`
      }
    );

    observer.observe(grid);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [canAnimateEntrance, itemCount, prefersReducedMotion, isMeasured]);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;

    const grid = gridRef.current;
    if (!grid) return;
    if (typeof ResizeObserver === 'undefined') {
      setFirstRowIndexes(new Set());
      setCanAnimateEntrance(false);
      setIsMeasured(true);
      setIsVisible(true);
      return;
    }

    let frameId = 0;

    const updateFirstRow = () => {
      const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-reveal-index]'));
      if (items.length === 0) {
        setFirstRowIndexes(new Set());
        setCanAnimateEntrance(false);
        setIsVisible(true);
        setIsMeasured(true);
        return;
      }

      const firstTop = items[0].offsetTop;
      const nextIndexes = new Set<number>();

      items.forEach((item) => {
        const index = Number(item.dataset.revealIndex);
        if (!Number.isNaN(index) && Math.abs(item.offsetTop - firstTop) < 2) {
          nextIndexes.add(index);
        }
      });

      setFirstRowIndexes(nextIndexes);
      setCanAnimateEntrance(nextIndexes.size > 1);
      setIsMeasured(true);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateFirstRow);
    };

    scheduleUpdate();

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(grid);

    const items = grid.querySelectorAll<HTMLElement>('[data-reveal-index]');
    items.forEach((item) => resizeObserver.observe(item));

    window.addEventListener('resize', scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [itemCount, prefersReducedMotion]);

  return {
    gridRef,
    isVisible,
    isMeasured,
    canAnimateEntrance,
    firstRowIndexes,
    prefersReducedMotion
  };
}
