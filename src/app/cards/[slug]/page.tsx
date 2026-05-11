import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CardDetailPage } from '@/components/cards/card-detail-page';
import { getCardBySlug, getCardsData } from '@/lib/cards';
import { normalizeSelectedOfferSourcePath } from '@/lib/selected-offer-intent';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCardBySlug(slug);

  if (!card) {
    return {
      title: 'Card Not Found',
      description: 'This card is no longer available in The Stack directory.'
    };
  }

  return {
    title: `${card.name} Review`,
    description: card.description ?? card.headline,
    alternates: {
      canonical: `/cards/${card.slug}`
    }
  };
}

export default async function CardDetailRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  const [card, cardsResult] = await Promise.all([getCardBySlug(slug), getCardsData()]);

  if (!card) {
    notFound();
  }

  return (
    <CardDetailPage
      card={card}
      cards={cardsResult.cards}
      returnHref={normalizeSelectedOfferSourcePath(firstParam(search.returnTo))}
    />
  );
}
