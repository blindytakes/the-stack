import type { Metadata } from 'next';
import Link from 'next/link';
import { getCardsDataWithDbFallback } from '@/lib/cards';
import { formatCategory } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Card Directory',
  description: 'Browse and compare credit cards by rewards, fees, and benefits.'
};

export default async function CardsPage() {
  const { cards } = await getCardsDataWithDbFallback();

  const sorted = [...cards].sort((a, b) => {
    if (a.issuer !== b.issuer) return a.issuer.localeCompare(b.issuer);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container-page pt-12 pb-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">
          {cards.length} Cards
        </p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">
          Card Directory
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Browse every card in our database. Click any card to see full rewards, benefits, and details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((card) => (
          <Link
            key={card.slug}
            href={`/cards/${card.slug}`}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-white/20"
          >
            <p className="text-xs text-text-muted">{card.issuer}</p>
            <h2 className="mt-1 text-base font-semibold text-text-primary group-hover:text-brand-teal transition">
              {card.name}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{card.headline}</p>

            <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
              <span className="capitalize">{card.rewardType}</span>
              <span className="text-white/20">|</span>
              <span>{card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}</span>
              <span className="text-white/20">|</span>
              <span className="capitalize">{card.creditTierMin}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.topCategories
                .filter((c) => c !== 'all')
                .slice(0, 3)
                .map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2 py-0.5 text-[10px] text-brand-teal"
                  >
                    {formatCategory(cat)}
                  </span>
                ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
