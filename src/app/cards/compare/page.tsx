import type { Metadata } from 'next';
import { CardsCompareExperience } from '@/components/cards/cards-compare-experience';
import { filterCardsForDirectory } from '@/lib/cards-directory';
import { getCardBySlug, getCardsData } from '@/lib/cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compare Cards',
  description:
    'Compare two cards using year-one value, ongoing value, welcome-offer difficulty, rewards math, and usable credits under your own assumptions.'
};

type Props = {
  searchParams: Promise<{
    a?: string | string[];
    b?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickDefaultCompareSlugs(cards: Awaited<ReturnType<typeof getCardsData>>['cards']) {
  const ranked = filterCardsForDirectory(cards)
    .filter((card) => card.cardType !== 'secured')
    .sort((left, right) => {
      const bonusDiff = (right.bestSignUpBonusValue ?? 0) - (left.bestSignUpBonusValue ?? 0);
      if (bonusDiff !== 0) return bonusDiff;
      return left.annualFee - right.annualFee;
    });

  const first = ranked[0]?.slug ?? cards[0]?.slug ?? null;
  const second =
    ranked.find((card) => card.slug !== first)?.slug ??
    cards.find((card) => card.slug !== first)?.slug ??
    null;

  return { first, second };
}

export default async function CardsComparePage({ searchParams }: Props) {
  const search = await searchParams;
  const requestedA = firstParam(search.a);
  const requestedB = firstParam(search.b);

  const { cards } = await getCardsData();
  const defaults = pickDefaultCompareSlugs(cards);

  const slugA = requestedA ?? defaults.first;
  const slugB =
    requestedB && requestedB !== slugA
      ? requestedB
      : defaults.second && defaults.second !== slugA
        ? defaults.second
        : null;

  const [cardA, cardB] = await Promise.all([
    slugA ? getCardBySlug(slugA) : Promise.resolve(null),
    slugB ? getCardBySlug(slugB) : Promise.resolve(null)
  ]);

  return (
    <div className="container-page pt-12 pb-16">
      <CardsCompareExperience
        cards={cards}
        initialSlugA={cardA?.slug ?? null}
        initialSlugB={cardB?.slug ?? null}
        initialCardA={cardA}
        initialCardB={cardB}
      />
    </div>
  );
}
