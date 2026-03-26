import type { Metadata } from 'next';
import { CardFinderPathChooser, CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { getCardsData, type CardRecord } from '@/lib/cards';
import { getBankingBonusesData, type BankingBonusListItem } from '@/lib/banking-bonuses';
import type { PlannerAudience } from '@/lib/quiz-engine';
import type { SelectedOfferIntent } from '@/lib/plan-contract';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bonus Plan',
  description:
    'Build a combined card-and-bank bonus plan using your spend capacity, credit profile, direct deposit access, and state.'
};

type Props = {
  searchParams: Promise<{
    mode?: string | string[];
    audience?: string | string[];
    selectedLane?: string | string[];
    selectedSlug?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getUniqueBankNames(bonuses: { bankName: string }[]): string[] {
  const seen = new Map<string, string>();
  for (const b of bonuses) {
    const key = b.bankName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.set(key, b.bankName.trim());
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

function resolveSelectedOfferIntent(input: {
  lane?: string;
  slug?: string;
  cards: CardRecord[];
  bonuses: BankingBonusListItem[];
}): SelectedOfferIntent | null {
  if (!input.lane || !input.slug) return null;

  if (input.lane === 'cards') {
    const card = input.cards.find((item) => item.slug === input.slug);
    if (!card) return null;

    return {
      lane: 'cards',
      slug: card.slug,
      title: card.name,
      provider: card.issuer,
      detailPath: `/cards/${card.slug}`,
      sourcePath: '/cards'
    };
  }

  if (input.lane === 'banking') {
    const bonus = input.bonuses.find((item) => item.slug === input.slug);
    if (!bonus) return null;

    return {
      lane: 'banking',
      slug: bonus.slug,
      title: bonus.offerName,
      provider: bonus.bankName,
      detailPath: `/banking/${bonus.slug}`,
      sourcePath: '/banking'
    };
  }

  return null;
}

export default async function CardFinderPage({ searchParams }: Props) {
  const search = await searchParams;
  const mode = firstParam(search.mode);
  const plannerAudience: PlannerAudience = firstParam(search.audience) === 'business' ? 'business' : 'consumer';
  const selectedLane = firstParam(search.selectedLane);
  const selectedSlug = firstParam(search.selectedSlug);
  const showingChooser = mode === 'choose';
  const showingFullPlanner = !showingChooser;

  const [cardsResult, bankingResult] = showingFullPlanner
    ? await Promise.all([getCardsData(), getBankingBonusesData()])
    : [{ cards: [] }, { bonuses: [] }];

  const cards =
    plannerAudience === 'business'
      ? cardsResult.cards.filter((card) => card.cardType === 'business')
      : cardsResult.cards;
  const bonuses =
    plannerAudience === 'business'
      ? bankingResult.bonuses.filter((bonus) => bonus.customerType === 'business')
      : bankingResult.bonuses;
  const bankNames = getUniqueBankNames(bonuses);
  const selectedOfferIntent = showingFullPlanner
    ? resolveSelectedOfferIntent({
        lane: selectedLane,
        slug: selectedSlug,
        cards,
        bonuses
      })
    : null;

  return (
    <ToolPageShell
      tool={plannerAudience === 'business' ? 'business_plan' : 'card_finder'}
      path="/tools/card-finder"
      title={plannerAudience === 'business' ? 'The Stack Business Bonus Plan' : 'The Stack Bonus Plan'}
      description={
        plannerAudience === 'business'
          ? 'Build a business-only bonus plan using your business spend, cash runway, Chase status, and business-banking constraints.'
          : ''
      }
    >
      {showingChooser ? (
        <CardFinderPathChooser />
      ) : (
        <CardFinderTool
          cards={cards}
          bankNames={bankNames}
          selectedOfferIntent={selectedOfferIntent}
          audience={plannerAudience}
        />
      )}
    </ToolPageShell>
  );
}
