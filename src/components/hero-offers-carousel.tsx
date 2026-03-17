'use client';

import { useEffect, useRef } from 'react';
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

export function HeroOffersCarousel({ offers }: HeroOffersCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);

  const doubled = [...offers, ...offers];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;
    const speed = 0.4;

    function tick() {
      if (!pausedRef.current) {
        offsetRef.current += speed;
        const halfWidth = track!.scrollWidth / 2;
        if (offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        track!.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-[0_0_45px_rgba(45,212,191,0.08)] backdrop-blur-2xl"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_40%)]" />

      <div className="relative">
        <div className="border-b border-white/10 px-6 py-4 md:px-8">
          <p className="text-lg font-semibold leading-relaxed text-text-primary md:text-xl">
            Hard to know which bonus is right for you?
          </p>
          <p className="mt-1 text-sm text-brand-teal md:text-base">
            The Stack tells you.
          </p>
        </div>

        <div className="overflow-hidden px-6 py-5 md:px-8">
          <div
            ref={trackRef}
            className="flex w-max gap-4 will-change-transform"
          >
            {doubled.map((offer, i) => (
              <OfferCard key={`${offer.slug}-${i}`} offer={offer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
