'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import { getCardFallbackLabel } from '@/lib/card-image-fallback';
import { isLowValueCardImageUrl } from '@/lib/entity-image-source';

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
  preferredOpeningSlug?: string;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function centerCardInTrack(
  track: HTMLDivElement,
  target: HTMLElement,
  behavior: ScrollBehavior
) {
  const centeredLeft = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2;
  const maxLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
  const left = Math.min(Math.max(centeredLeft, 0), maxLeft);

  track.scrollTo({ left, behavior });
}

function getRenderedOfferIndex(realIndex: number, offerCount: number) {
  if (offerCount <= 1) {
    return realIndex;
  }

  return realIndex + 1;
}

function getSettledRenderedIndex(renderedIndex: number, offerCount: number) {
  if (offerCount <= 1) {
    return renderedIndex;
  }

  if (renderedIndex === 0) {
    return offerCount;
  }

  if (renderedIndex === offerCount + 1) {
    return 1;
  }

  return renderedIndex;
}

function getOpeningOfferIndex(
  offers: HeroOffer[],
  preferredOpeningSlug?: string
) {
  if (offers.length === 0) {
    return 0;
  }

  const preferredIndex = preferredOpeningSlug
    ? offers.findIndex((offer) => offer.slug === preferredOpeningSlug)
    : -1;
  if (preferredIndex >= 0) {
    return preferredIndex;
  }

  const imageBackedCardIndex = offers.findIndex((offer) => {
    if (offer.type !== 'card' || !offer.imageUrl) {
      return false;
    }

    return !isLowValueCardImageUrl(offer.imageUrl);
  });
  if (imageBackedCardIndex >= 0) {
    return imageBackedCardIndex;
  }

  const firstCardIndex = offers.findIndex((offer) => offer.type === 'card');
  return firstCardIndex >= 0 ? firstCardIndex : 0;
}

function OfferCard({
  offer,
  interactive = true,
}: {
  offer: HeroOffer;
  interactive?: boolean;
}) {
  const isCard = offer.type === 'card';
  const accentText = isCard ? 'text-brand-teal' : 'text-brand-gold';
  const glowColor = isCard
    ? 'rgba(45, 212, 191, 0.15)'
    : 'rgba(234, 179, 8, 0.15)';
  const hrefBase = isCard ? '/cards' : '/banking';
  const pres = offer.imagePresentation;
  const hasRenderableCardImage =
    !isCard || (Boolean(offer.imageUrl) && !isLowValueCardImageUrl(offer.imageUrl));
  const displayImageUrl = hasRenderableCardImage ? offer.imageUrl : undefined;
  const displayLabel = isCard
    ? hasRenderableCardImage
      ? offer.name
      : getCardFallbackLabel(offer.name, offer.issuer)
    : offer.issuer;
  const fallbackVariant = isCard ? (hasRenderableCardImage ? 'initials' : 'wordmark') : 'wordmark';
  const content = (
    <>
      <EntityImage
        src={displayImageUrl}
        alt={`${offer.name} ${isCard ? 'card art' : 'logo'}`}
        label={displayLabel}
        className="aspect-[1.586/1] w-full"
        imgClassName={
          pres?.imgClassName ??
          (isCard ? 'bg-black/10 p-1.5' : 'bg-black/10 px-5 py-3')
        }
        fallbackClassName="bg-black/10"
        fallbackVariant={fallbackVariant}
        fallbackTextClassName={isCard ? 'px-4 text-sm sm:text-base' : 'px-4 text-lg sm:text-xl'}
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
    </>
  );

  return (
    <div className="relative w-[280px] shrink-0">
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl blur-2xl"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
        }}
      />
      {interactive ? (
        <a
          href={`${hrefBase}/${offer.slug}`}
          className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand-teal/25 hover:bg-white/[0.06]"
        >
          {content}
        </a>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          {content}
        </div>
      )}
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

export function HeroOffersCarousel({
  offers,
  preferredOpeningSlug,
}: HeroOffersCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingOfferIndex = getOpeningOfferIndex(offers, preferredOpeningSlug);
  const [activeRenderedIndex, setActiveRenderedIndex] = useState(
    getRenderedOfferIndex(openingOfferIndex, offers.length)
  );
  const activeRenderedIndexRef = useRef(activeRenderedIndex);
  const [hasInitialized, setHasInitialized] = useState(false);
  const renderedOffers =
    offers.length > 1
      ? [
          {
            key: `clone-start-${offers[offers.length - 1].slug}`,
            offer: offers[offers.length - 1],
            renderedIndex: 0,
            isClone: true,
          },
          ...offers.map((offer, index) => ({
            key: offer.slug,
            offer,
            renderedIndex: index + 1,
            isClone: false,
          })),
          {
            key: `clone-end-${offers[0].slug}`,
            offer: offers[0],
            renderedIndex: offers.length + 1,
            isClone: true,
          },
        ]
      : offers.map((offer, index) => ({
          key: offer.slug,
          offer,
          renderedIndex: index,
          isClone: false,
        }));

  const syncActiveRenderedIndex = useCallback((index: number) => {
    activeRenderedIndexRef.current = index;
    setActiveRenderedIndex(index);
  }, []);

  const snapToRenderedIndex = useCallback(
    (renderedIndex: number) => {
      const track = trackRef.current;
      if (!track) return;

      const target = track.querySelector<HTMLElement>(
        `[data-offer-index="${renderedIndex}"]`
      );
      if (!target) return;

      syncActiveRenderedIndex(renderedIndex);
      centerCardInTrack(track, target, 'auto');
    },
    [syncActiveRenderedIndex]
  );

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

    syncActiveRenderedIndex(nearestIndex);

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = setTimeout(() => {
      const settledIndex = getSettledRenderedIndex(
        activeRenderedIndexRef.current,
        offers.length
      );

      if (settledIndex !== activeRenderedIndexRef.current) {
        snapToRenderedIndex(settledIndex);
      }
    }, 120);
  }, [offers.length, snapToRenderedIndex, syncActiveRenderedIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => {
      observer.disconnect();
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [updateScrollState]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || offers.length === 0) return;

    setHasInitialized(false);
    const initialIndex = getRenderedOfferIndex(openingOfferIndex, offers.length);
    const target = track.querySelector<HTMLElement>(
      `[data-offer-index="${initialIndex}"]`
    );

    if (!target) return;

    syncActiveRenderedIndex(initialIndex);
    centerCardInTrack(track, target, 'auto');
    setHasInitialized(true);
  }, [offers.length, openingOfferIndex, syncActiveRenderedIndex]);

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const track = trackRef.current;
      if (!track || offers.length <= 1) return;

      const currentRenderedIndex = getSettledRenderedIndex(
        activeRenderedIndexRef.current,
        offers.length
      );
      const nextIndex =
        direction === 'left'
          ? currentRenderedIndex - 1
          : currentRenderedIndex + 1;

      const target = track.querySelector<HTMLElement>(
        `[data-offer-index="${nextIndex}"]`
      );
      if (!target) return;

      centerCardInTrack(track, target, 'smooth');
    },
    [offers.length]
  );

  const showArrows = offers.length > 1;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl lg:ml-auto lg:max-w-[432px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 text-center md:px-8">
          <p className="text-xl font-semibold leading-relaxed text-text-primary md:text-[1.55rem] md:whitespace-nowrap">
            Which offer is best for you?
          </p>
          <p className="mt-1 text-xl text-brand-teal md:text-[1.55rem]">
            The Stack tells you.
          </p>
        </div>

        {/* Scrollable track with edge arrows */}
        <div className="relative">
          <EdgeArrow
            direction="left"
            onClick={() => scroll('left')}
            visible={showArrows}
          />
          <EdgeArrow
            direction="right"
            onClick={() => scroll('right')}
            visible={showArrows}
          />
          <div
            ref={trackRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto py-5"
            style={{
              paddingLeft: 'calc(50% - 140px)',
              paddingRight: 'calc(50% - 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {renderedOffers.map(({ key, offer, renderedIndex, isClone }) => (
              <div
                key={key}
                aria-hidden={isClone ? 'true' : undefined}
                data-offer-index={renderedIndex}
                className={`snap-center ${
                  hasInitialized ? 'transition-all duration-300' : ''
                } ${
                  renderedIndex === activeRenderedIndex
                    ? 'scale-100 opacity-100'
                    : 'scale-[0.93] opacity-55'
                }`}
              >
                <OfferCard offer={offer} interactive={!isClone} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
