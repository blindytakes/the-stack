import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllBankingBonusSlugs,
  getBankingBonusBySlug,
  getBankingBonusesData,
  getBankingOfferRequirements
} from '@/lib/banking-bonuses';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string | string[] }>;
};

export async function generateStaticParams() {
  const slugs = await getAllBankingBonusSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getBankingBonusBySlug(slug);
  if (!offer) return { title: 'Banking Offer Not Found' };

  return {
    title: `${offer.offerName} | ${offer.bankName}`,
    description: offer.headline
  };
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatDays(days?: number) {
  if (!days) return 'Varies by offer terms';
  const months = Math.round(days / 30);
  if (months <= 1) return `${days} days`;
  return `${months} months (${days} days)`;
}

export default async function BankingOfferDetailPage({ params }: Props) {
  const { slug } = await params;
  const offer = await getBankingBonusBySlug(slug);
  if (!offer) notFound();

  const requirements = getBankingOfferRequirements(offer);
  const outboundOfferUrl = offer.affiliateUrl ?? offer.offerUrl;
  const relatedOffers = (await getBankingBonusesData()).bonuses
    .filter((item) => item.slug !== offer.slug)
    .slice(0, 3);

  return (
    <div className="container-page pt-12 pb-16">
      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/banking" className="transition hover:text-text-secondary">
          Banking Bonuses
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{offer.offerName}</span>
      </nav>

      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-elevated p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">{offer.bankName}</p>
            <h1 className="mt-2 font-heading text-4xl text-text-primary">{offer.offerName}</h1>
            <p className="mt-3 text-lg text-text-secondary">{offer.headline}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Bonus</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {formatCurrency(offer.bonusAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Estimated Fees</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {formatCurrency(offer.estimatedFees)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Net Value Est.</p>
                <p className="mt-2 text-sm font-semibold text-brand-teal">
                  {formatCurrency(offer.estimatedNetValue)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Timeline</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{formatDays(offer.holdingPeriodDays)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs uppercase text-brand-gold">
                {offer.accountType}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-secondary">
                {offer.directDeposit.required ? 'Direct deposit required' : 'No direct deposit required'}
              </span>
              {offer.stateRestrictions && offer.stateRestrictions.length > 0 && (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-secondary">
                  Eligible states: {offer.stateRestrictions.join(', ')}
                </span>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-bg/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Execution Checklist</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
              {requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-text-muted">
              Confirm offer terms directly with the bank before applying. Requirements and deadlines can change.
            </p>
            <div className="mt-5 space-y-2">
              {outboundOfferUrl && (
                <a
                  href={outboundOfferUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Check Current Offer
                </a>
              )}
              <Link
                href="/tools/card-finder"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Build Full Bonus Plan
              </Link>
              <Link
                href="/banking"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Back to Banking Directory
              </Link>
            </div>
          </aside>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-text-muted">Related Banking Offers</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {relatedOffers.map((item) => (
            <Link
              key={item.slug}
              href={`/banking/${item.slug}?src=banking_detail`}
              className="rounded-2xl border border-white/10 bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-brand-teal/30"
            >
              <p className="text-xs text-text-muted">{item.bankName}</p>
              <h3 className="mt-1 text-base font-semibold text-text-primary">{item.offerName}</h3>
              <p className="mt-2 text-sm text-text-secondary">Net est. {formatCurrency(item.estimatedNetValue)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
