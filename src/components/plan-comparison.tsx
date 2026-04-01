'use client';

import { useEffect, useRef, useState } from 'react';
import { EntityImage } from '@/components/ui/entity-image';
import { getCardFallbackLabel } from '@/lib/card-image-fallback';
import { getCardImagePresentation } from '@/lib/card-image-presentation';
import { resolveBankingBrandImageUrl } from '@/lib/banking-brand-assets';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';

interface GanttRow {
  name: string;
  type: 'card' | 'bank';
  provider: string;
  action: string;
  value: string;
  startCol: number;
  endCol: number;
  slug?: string;
  imageUrl?: string;
}

const CHASE_SAPPHIRE_PREFERRED_ART_URL =
  'https://images.ctfassets.net/8qmz0ef3xzub/7iFzyweepMTrfGn2VrDdL5/6adcc35d50cef1e3087ced153d3b7bee/sapphire_preferred_card.png';
const AMEX_GOLD_CARD_ART_URL =
  'https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/gold-card.png';
const GRID_COLUMNS_CLASS_NAME =
  'grid-cols-[210px_repeat(6,minmax(0,1fr))] md:grid-cols-[300px_repeat(6,minmax(0,1fr))]';

const ganttRows: GanttRow[] = [
  {
    name: 'Chase Sapphire Preferred',
    type: 'card',
    provider: 'Chase',
    action: 'Spend $4k in 3 months',
    value: '$1,250',
    startCol: 1,
    endCol: 4,
    slug: 'chase-sapphire-preferred',
    imageUrl: CHASE_SAPPHIRE_PREFERRED_ART_URL
  },
  {
    name: 'Chase Total Checking',
    type: 'bank',
    provider: 'Chase',
    action: 'Direct deposit × 2 months',
    value: '$400',
    startCol: 2,
    endCol: 4
  },
  {
    name: 'Amex Gold Card',
    type: 'card',
    provider: 'American Express',
    action: 'Spend $6k in 6 months',
    value: '$1,200',
    startCol: 3,
    endCol: 6,
    slug: 'amex-gold-card',
    imageUrl: AMEX_GOLD_CARD_ART_URL
  },
  {
    name: 'SoFi Checking & Savings',
    type: 'bank',
    provider: 'SoFi',
    action: 'Direct deposit $1k',
    value: '$650',
    startCol: 4,
    endCol: 6
  },
  {
    name: 'Capital One Venture X',
    type: 'card',
    provider: 'Capital One',
    action: 'Spend $4k in 3 months',
    value: '$1,500',
    startCol: 5,
    endCol: 7,
    slug: 'capital-one-venture-x'
  },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getUpcomingMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => MONTH_LABELS[(now.getMonth() + i) % 12]);
}

function getDisplayName(name: string, provider: string) {
  const normalizedName = name.toLowerCase();
  const normalizedProvider = provider.toLowerCase();

  if (normalizedName.startsWith(`${normalizedProvider} `)) {
    return name.slice(provider.length + 1);
  }

  return name;
}

function GanttRowArtwork({ row }: { row: GanttRow }) {
  if (row.type === 'bank') {
    const presentation = getBankingImagePresentation(row.provider);
    const imageUrl = resolveBankingBrandImageUrl(row.provider, row.imageUrl);

    return (
      <EntityImage
        src={imageUrl}
        alt={`${row.provider} logo`}
        label={row.provider}
        className="h-[3rem] w-[3.85rem] shrink-0 md:h-[3.65rem] md:w-[4.75rem]"
        imgClassName={presentation?.miniImgClassName ?? 'bg-black/10 px-2 py-2'}
        fallbackClassName="bg-black/10"
        fit={presentation?.fit}
        position={presentation?.position}
        scale={Math.min((presentation?.scale ?? 1.04) * 1.06, 1.22)}
      />
    );
  }

  const issuerPresentation = row.imageUrl ? null : getBankingImagePresentation(row.provider);
  const imageUrl = row.imageUrl ?? resolveBankingBrandImageUrl(row.provider);
  const presentation = row.slug ? getCardImagePresentation(row.slug, imageUrl) : null;
  const isIssuerLogo = !row.imageUrl;

  return (
    <EntityImage
      src={imageUrl}
      alt={`${row.name} ${isIssuerLogo ? 'logo' : 'card art'}`}
      label={isIssuerLogo ? getCardFallbackLabel(row.name, row.provider) : row.name}
      className="h-[3rem] w-[3.85rem] shrink-0 md:h-[3.65rem] md:w-[4.75rem]"
      imgClassName={
        presentation?.imgClassName ??
        issuerPresentation?.miniImgClassName ??
        'bg-black/10 p-0.5 md:p-1'
      }
      fallbackClassName="bg-black/10"
      fit={presentation?.fit ?? issuerPresentation?.fit}
      position={presentation?.position ?? issuerPresentation?.position}
      scale={
        presentation?.scale ??
        (issuerPresentation ? Math.min((issuerPresentation.scale ?? 1.04) * 1.06, 1.22) : 1)
      }
    />
  );
}

export function PlanComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.7 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* Headline */}
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
          The Stack tells you exactly which offers to prioritize, and when.
        </h2>
      </div>

      {/* Gantt chart */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_8px_60px_rgba(45,212,191,0.08),0_2px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_45%)]" />

        {/* Month headers */}
        <div className={`relative grid ${GRID_COLUMNS_CLASS_NAME}`}>
          <div className="px-5 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-muted/60">
              Offer
            </span>
          </div>
          {getUpcomingMonths(6).map((month, i) => (
            <div key={i} className="px-2 py-4 text-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted/50">
                {month}
              </span>
            </div>
          ))}
          {/* Subtle bottom line */}
          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Rows */}
        {ganttRows.map((row, i) => {
          const barGradient = 'bg-gradient-to-r from-brand-teal/25 via-brand-teal/15 to-brand-teal/25';
          const barBorder = 'border-brand-teal/25';
          const barGlow = 'shadow-[inset_0_1px_0_rgba(45,212,191,0.2),0_0_20px_rgba(45,212,191,0.08)]';
          const valueColor = 'text-white';

          return (
            <div
              key={row.name}
              className={`relative grid ${GRID_COLUMNS_CLASS_NAME}`}
            >
              {/* Subtle row divider */}
              {i > 0 && (
                <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              )}

              {/* Label */}
              <div
                className={`flex items-center gap-3 px-5 py-4 transition-all duration-700 md:gap-4 md:py-5 ${
                  isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <GanttRowArtwork row={row} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold/80 md:text-[11px]">
                    {row.provider}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-[1.15] text-text-primary md:text-base">
                    {getDisplayName(row.name, row.provider)}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-text-secondary md:text-xs">
                    {row.action}
                  </p>
                </div>
              </div>

              {/* Bar cells */}
              <div className="col-span-6 grid grid-cols-6 items-center py-1">
                {/* Faint column guides */}
                <div className="pointer-events-none col-span-6 row-start-1 grid grid-cols-6">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className={`py-5 ${j < 5 ? 'border-r border-white/[0.03]' : ''}`} />
                  ))}
                </div>

                {/* Bar with gradient + glow */}
                <div
                  className={`relative row-start-1 flex items-center justify-center rounded-xl border px-3 py-3 transition-all duration-700 ${barBorder} ${barGlow} ${
                    isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                  style={{
                    gridColumnStart: row.startCol,
                    gridColumnEnd: row.endCol,
                    transformOrigin: 'left',
                    transitionDelay: `${i * 150 + 200}ms`,
                  }}
                >
                  <div className={`absolute inset-0 rounded-xl ${barGradient}`} />
                  {/* Shine effect */}
                  <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className={`relative z-10 text-base font-bold ${valueColor}`}>
                    {row.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}
