'use client';

import { useEffect, useRef, useState } from 'react';
import { EntityImage } from '@/components/ui/entity-image';

export type HeroOffer = {
  name: string;
  issuer: string;
  type: 'card' | 'bank';
  bonusValue: number;
  requirement: string;
  slug: string;
  imageUrl?: string;
  imagePresentation?: {
    fit?: 'contain' | 'cover';
    position?: string;
    scale?: number;
    imgClassName?: string;
  };
};

type HeroOffersCarouselProps = {
  offers: HeroOffer[];
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export function HeroOffersCarousel({ offers }: HeroOffersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, []);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 220;
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 md:px-8">
          <p className="text-lg font-semibold leading-relaxed text-text-primary md:text-xl">
            Hard to know which bonus is right for you?
          </p>
          <p className="mt-1 text-sm text-brand-teal md:text-base">
            The Stack tells you.
          </p>
        </div>

        {/* Carousel with Netflix-style arrows */}
        <div className="group/carousel relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-center bg-gradient-to-r from-black/60 to-transparent opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100 disabled:pointer-events-none disabled:opacity-0"
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="absolute right-0 top-0 z-10 flex h-full w-10 items-center justify-center bg-gradient-to-l from-black/60 to-transparent opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100 disabled:pointer-events-none disabled:opacity-0"
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 py-5 scrollbar-none md:px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offers.map((offer) => {
              const isCard = offer.type === 'card';
              const accentText = isCard ? 'text-brand-teal' : 'text-brand-gold';
              const hrefBase = isCard ? '/cards' : '/banking';
              const pres = offer.imagePresentation;

              return (
                <a
                  key={offer.slug}
                  href={`${hrefBase}/${offer.slug}`}
                  className="group flex w-[200px] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-brand-teal/25 hover:bg-white/[0.06]"
                >
                  <EntityImage
                    src={offer.imageUrl}
                    alt={`${offer.name} ${isCard ? 'card art' : 'logo'}`}
                    label={isCard ? offer.name : offer.issuer}
                    className={isCard ? 'aspect-[1.586/1] w-full' : 'h-[72px] w-full'}
                    imgClassName={pres?.imgClassName ?? (isCard ? 'bg-black/10 p-1.5' : 'bg-black/10 px-5 py-3')}
                    fallbackClassName="bg-black/10"
                    fallbackVariant={isCard ? 'initials' : 'wordmark'}
                    fallbackTextClassName="text-sm"
                    fit={pres?.fit}
                    position={pres?.position}
                    scale={pres?.scale}
                  />
                  <p className="mt-2.5 line-clamp-2 text-xs font-semibold leading-snug text-text-primary">
                    {offer.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-text-muted">{offer.issuer}</p>
                  <div className="mt-auto pt-2">
                    <p className={`text-xl font-bold ${accentText}`}>
                      +{formatCurrency(offer.bonusValue)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-text-muted">
                      {offer.requirement}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
