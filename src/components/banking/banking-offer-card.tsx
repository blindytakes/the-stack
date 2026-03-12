import Link from 'next/link';
import { EntityImage } from '@/components/ui/entity-image';
import {
  formatBankingCurrency,
  getBankingOfferPrimaryConstraint,
  getBankingOfferPrimaryRequirement,
  getBankingOfferTimeline,
  type BankingBonusListItem
} from '@/lib/banking-bonuses';
import { getBankingImagePresentation } from '@/lib/banking-image-presentation';

type BankingOfferCardProps = {
  offer: BankingBonusListItem;
  source: 'banking_directory' | 'banking_detail';
  variant?: 'directory' | 'compact';
};

function buildClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function getOfferHighlights(offer: BankingBonusListItem) {
  const highlights: string[] = [];

  if (!offer.directDeposit.required) {
    highlights.push('No payroll');
  }

  if (offer.accountType !== 'checking') {
    highlights.push(offer.accountType === 'bundle' ? 'Bundle' : 'Savings');
  }

  if (offer.stateRestrictions && offer.stateRestrictions.length > 0) {
    highlights.push('State-limited');
  }

  return highlights.slice(0, 2);
}

export function BankingOfferCard({
  offer,
  source,
  variant = 'directory'
}: BankingOfferCardProps) {
  const isCompact = variant === 'compact';
  const highlights = getOfferHighlights(offer);
  const primaryRequirement = getBankingOfferPrimaryRequirement(offer);
  const primaryConstraint = getBankingOfferPrimaryConstraint(offer);
  const timeline = getBankingOfferTimeline(offer);
  const imagePresentation = getBankingImagePresentation(offer.bankName);

  return (
    <Link
      href={`/banking/${offer.slug}?src=${source}`}
      className={buildClassName(
        'group flex h-full flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 transition hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)]',
        isCompact && 'rounded-[1.75rem] p-3.5'
      )}
    >
      <div
        className={buildClassName(
          'rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_58%),radial-gradient(circle_at_85%_20%,rgba(250,204,21,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3.5',
          isCompact && 'rounded-[1.45rem] p-3'
        )}
      >
        <div className="relative">
          {highlights.length > 0 ? (
            <div className="pointer-events-none absolute -top-2 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
              {highlights.map((highlight, index) => (
                <span
                  key={highlight}
                  className={buildClassName(
                    'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm',
                    index === 0 && highlight === 'No payroll'
                      ? 'border-brand-teal/35 bg-brand-teal/10 text-brand-teal'
                      : 'border-white/15 bg-black/30 text-text-secondary'
                  )}
                >
                  {highlight}
                </span>
              ))}
            </div>
          ) : null}

          <EntityImage
            src={offer.imageUrl}
            alt={`${offer.bankName} logo`}
            label={offer.bankName}
            className={buildClassName(
              'h-[124px] w-full rounded-[1.45rem] sm:h-[132px]',
              isCompact && 'h-[104px] sm:h-[108px]'
            )}
            imgClassName={imagePresentation?.imgClassName ?? 'bg-black/10 px-6 py-4'}
            fallbackClassName="bg-black/10"
            fallbackVariant="wordmark"
            fallbackTextClassName={buildClassName(
              'px-3 text-xl sm:text-2xl',
              isCompact && 'text-lg sm:text-xl'
            )}
            fit={imagePresentation?.fit}
            position={imagePresentation?.position}
            scale={imagePresentation?.scale ?? 1.04}
          />
        </div>
      </div>

      <div className={buildClassName('mt-4 flex flex-1 flex-col', isCompact && 'mt-3.5')}>
        <div
          className={buildClassName(
            'space-y-3',
            isCompact && 'space-y-3'
          )}
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">{offer.bankName}</p>
            <h3
              className={buildClassName(
                'mt-2 font-semibold text-text-primary transition group-hover:text-brand-teal',
                isCompact ? 'line-clamp-2 text-lg leading-7' : 'line-clamp-2 text-[1.75rem] leading-[1.08]'
              )}
            >
              {offer.offerName}
            </h3>
          </div>

          <div
            className={buildClassName(
              'rounded-[1.45rem] border border-white/10 bg-bg/45 px-3.5 py-3',
              isCompact ? 'w-full' : ''
            )}
          >
            <div className={buildClassName('items-end gap-3', isCompact ? 'space-y-2' : 'flex justify-between')}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Net est.</p>
                <p
                  className={buildClassName(
                    'mt-2 font-semibold text-brand-teal',
                    isCompact ? 'text-[2rem] leading-none' : 'text-[2.35rem] leading-none'
                  )}
                >
                  +{formatBankingCurrency(offer.estimatedNetValue)}
                </p>
              </div>
              <p
                className={buildClassName(
                  'text-[11px] leading-5 text-brand-gold',
                  isCompact ? '' : 'max-w-[10rem] text-left'
                )}
              >
                Bonus {formatBankingCurrency(offer.bonusAmount)} /{' '}
                {timeline.isKnown ? timeline.shortLabel : 'Check terms'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 space-y-2.5">
          <div className="rounded-[1.4rem] border border-white/10 bg-bg/35 px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">What it takes</p>
            <p className="mt-1.5 text-sm leading-6 text-text-primary line-clamp-2">{primaryRequirement}</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-bg/25 px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Main constraint</p>
            <p className="mt-1.5 text-sm leading-6 text-text-secondary line-clamp-2">{primaryConstraint}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-brand-teal">View steps</span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-bg/35 text-text-primary transition group-hover:border-brand-teal/30 group-hover:text-brand-teal">
            -&gt;
          </span>
        </div>
      </div>
    </Link>
  );
}
