'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
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

function OfferCard({ offer }: { offer: HeroOffer }) {
  const isCard = offer.type === 'card';
  const accentText = isCard ? 'text-brand-teal' : 'text-brand-gold';
  const glowColor = isCard
    ? 'rgba(45, 212, 191, 0.15)'
    : 'rgba(234, 179, 8, 0.15)';
  const hrefBase = isCard ? '/cards' : '/banking';
  const pres = offer.imagePresentation;

  return (
    <div className="relative w-[280px] shrink-0">
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl blur-2xl"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
        }}
      />
      <a
        href={`${hrefBase}/${offer.slug}`}
        className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand-teal/25 hover:bg-white/[0.06]"
      >
        <EntityImage
          src={offer.imageUrl}
          alt={`${offer.name} ${isCard ? 'card art' : 'logo'}`}
          label={isCard ? offer.name : offer.issuer}
          className="aspect-[1.586/1] w-full"
          imgClassName={
            pres?.imgClassName ??
            (isCard ? 'bg-black/10 p-1.5' : 'bg-black/10 px-5 py-3')
          }
          fallbackClassName="bg-black/10"
          fallbackVariant={isCard ? 'initials' : 'wordmark'}
          fallbackTextClassName="text-sm"
          fit={pres?.fit}
          position={pres?.position}
          scale={pres?.scale}
        />
        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
          {offer.name}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{offer.issuer}</p>
        <div className="mt-auto pt-3">
          <p className={`text-2xl font-bold ${accentText}`}>
            +{formatCurrency(offer.bonusValue)}
          </p>
        </div>
      </a>
    </div>
  );
}

function EdgeArrow({
  direction,
  onClick,
  visible,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  visible: boolean;
}) {
  const isLeft = direction === 'left';
  return (
    <button
      onClick={onClick}
      aria-label={`Scroll ${direction}`}
      className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} z-10 flex h-full w-12 items-center justify-center transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        background: isLeft
          ? 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)'
          : 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 16 16"
        fill="none"
        className={isLeft ? 'rotate-180' : ''}
      >
        <path
          d="M6 3L11 8L6 13"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function HeroOffersCarousel({ offers }: HeroOffersCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hasCenteredInitialCardRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(
      track.querySelectorAll<HTMLElement>('[data-offer-index]')
    );
    if (cards.length === 0) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
      const index = Number(card.dataset.offerIndex);
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
    setCanScrollLeft(nearestIndex > 0);
    setCanScrollRight(nearestIndex < cards.length - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || hasCenteredInitialCardRef.current || offers.length === 0) return;

    const shouldCenterMiddleCard =
      window.matchMedia('(min-width: 1024px)').matches && offers.length > 2;
    const initialIndex = shouldCenterMiddleCard ? 1 : 0;
    const target = track.querySelector<HTMLElement>(
      `[data-offer-index="${initialIndex}"]`
    );

    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      hasCenteredInitialCardRef.current = true;
      updateScrollState();
    });
  }, [offers.length, updateScrollState]);

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const track = trackRef.current;
      if (!track) return;
      const nextIndex =
        direction === 'left'
          ? Math.max(activeIndex - 1, 0)
          : Math.min(activeIndex + 1, offers.length - 1);
      const target = track.querySelector<HTMLElement>(
        `[data-offer-index="${nextIndex}"]`
      );
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    },
    [activeIndex, offers.length]
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl lg:ml-auto lg:max-w-[432px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 text-center md:px-8">
          <p className="text-lg font-semibold leading-relaxed text-text-primary md:text-[1.45rem] md:whitespace-nowrap">
            Which of these is best for you?
          </p>
          <p className="mt-1 text-lg text-brand-teal md:text-[1.45rem]">
            The Stack tells you.
          </p>
        </div>

        {/* Scrollable track with edge arrows */}
        <div className="relative">
          <EdgeArrow
            direction="left"
            onClick={() => scroll('left')}
            visible={canScrollLeft}
          />
          <EdgeArrow
            direction="right"
            onClick={() => scroll('right')}
            visible={canScrollRight}
          />
          <div
            ref={trackRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto scroll-smooth py-5"
            style={{
              paddingLeft: 'calc(50% - 140px)',
              paddingRight: 'calc(50% - 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {offers.map((offer, index) => (
              <div
                key={offer.slug}
                data-offer-index={index}
                className={`snap-center transition-all duration-300 ${
                  index === activeIndex
                    ? 'scale-100 opacity-100'
                    : 'scale-[0.93] opacity-55'
                }`}
              >
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
