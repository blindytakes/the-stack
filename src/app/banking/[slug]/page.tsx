import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BankingDetailPage } from '@/components/banking/banking-detail-page';
import { getBankingBonusBySlug, getBankingBonusesData } from '@/lib/banking-bonuses';
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
  const offer = await getBankingBonusBySlug(slug);

  if (!offer) {
    return {
      title: 'Bank Offer Not Found',
      description: 'This banking offer is no longer available in The Stack directory.'
    };
  }

  return {
    title: `${offer.offerName} Review`,
    description: offer.headline,
    alternates: {
      canonical: `/banking/${offer.slug}`
    }
  };
}

export default async function BankingOfferDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  const [offer, offersResult] = await Promise.all([getBankingBonusBySlug(slug), getBankingBonusesData()]);

  if (!offer) {
    notFound();
  }

  return (
    <BankingDetailPage
      offer={offer}
      offers={offersResult.bonuses}
      returnHref={normalizeSelectedOfferSourcePath(firstParam(search.returnTo))}
    />
  );
}
