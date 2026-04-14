import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BankingDetailPage } from '@/components/banking/banking-detail-page';
import { getBankingBonusBySlug, getBankingBonusesData } from '@/lib/banking-bonuses';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

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

export default async function BankingOfferDetailPage({ params }: Props) {
  const { slug } = await params;
  const [offer, offersResult] = await Promise.all([getBankingBonusBySlug(slug), getBankingBonusesData()]);

  if (!offer) {
    notFound();
  }

  return <BankingDetailPage offer={offer} offers={offersResult.bonuses} />;
}
